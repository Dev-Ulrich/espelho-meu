package br.com.fiap.espelhomeu.auth;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:simulations;MODE=Oracle;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa",
        "spring.datasource.password=teste-local",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "espelho.simulation.worker-enabled=false",
        "ESPELHO_JAVA_PREVIEW_ORIGIN=https://espelho-teste.vercel.app"
})
class ConsultationSimulationsTest {
    private static final String KEY = "chave-interna-ficticia-para-testes-locais";
    private static final byte[] ORIGINAL = "original-da-consulta".getBytes(StandardCharsets.UTF_8);
    private static final byte[] JPEG = {(byte) 0xff, (byte) 0xd8, (byte) 0xff, (byte) 0xd9};
    private static final Map<String, Integer> CALLS = new ConcurrentHashMap<>();
    private static final HttpServer FLASK = fakeFlask();
    private static final String HAIR = """
            {"facial":{"avisos":[]},"cabelo":{"cortes":[
              {"id":"a","nome":"Corte A","como_pedir":"Camadas longas","penteados":["Coque baixo"]},
              {"id":"b","nome":"Corte B","penteados":["Coque baixo"]},
              {"id":"c","nome":"Corte C","penteados":[]},
              {"id":"d","nome":"Corte D","penteados":[]}
            ]}}
            """;

    @Autowired WebApplicationContext context;
    @Autowired JdbcTemplate jdbc;
    @Autowired ConsultationSimulations simulations;
    MockMvc mvc;
    MockHttpSession owner;
    SimulationWorker worker;

    @DynamicPropertySource
    static void flaskProperties(DynamicPropertyRegistry registry) {
        registry.add("ESPELHO_IA_URL", ConsultationSimulationsTest::flaskUrl);
        registry.add("ESPELHO_IA_INTERNAL_KEY", () -> KEY);
    }

    @AfterAll
    static void stopFlask() {
        FLASK.stop(0);
    }

    @BeforeEach
    void configure() throws Exception {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        CALLS.clear();
        jdbc.execute("DROP ALL OBJECTS");
        jdbc.execute("CREATE SEQUENCE SQ_USUARIO START WITH 1");
        jdbc.execute("""
                CREATE TABLE T_EM_USUARIO (
                    ID_USUARIO NUMBER(10) PRIMARY KEY, NM_USUARIO VARCHAR2(100) NOT NULL,
                    EM_USUARIO VARCHAR2(100) NOT NULL UNIQUE, DT_NASCIMENTO DATE NOT NULL,
                    TL_USUARIO VARCHAR2(20), ST_USUARIO VARCHAR2(20) NOT NULL)
                """);
        new ResourceDatabasePopulator(new ClassPathResource("migrations/001-credenciais.sql"),
                new ClassPathResource("migrations/002-simulacao-comparacao.sql")).execute(jdbc.getDataSource());
        owner = signUp("dona");
        worker = new SimulationWorker(simulations, flaskUrl(), KEY);
    }

    @Test
    void persistsOneToThreeCardsAndRejectsDuplicatesFourthAndUnauthorizedAccess() throws Exception {
        String result = consult("cabelo");
        String path = result + "/simulacoes";
        assertTrue(CALLS.isEmpty());
        mvc.perform(get(result).session(owner)).andExpect(status().isOk())
                .andExpect(jsonPath("$.cabelo.cortes[0].id").value("a"));
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
        mvc.perform(multipart(path).session(owner).param("cards", "a"))
                .andExpect(status().isUnauthorized());
        enqueue(path, true, false, "a").andExpect(status().isBadRequest());
        enqueue(path, true, true, "a", "a").andExpect(status().isBadRequest());
        enqueue(path, true, true, "a", "b", "c", "d").andExpect(status().isBadRequest());
        enqueue(path, true, true, "penteado-b-0").andExpect(status().isUnprocessableEntity());

        enqueue(path, true, true, "a").andExpect(status().isAccepted()).andExpect(jsonPath("$.used").value(1));
        enqueue(path, false, false, "a").andExpect(status().isAccepted()).andExpect(jsonPath("$.used").value(1));
        worker.process();
        mvc.perform(get(path + "/imagem").param("card", "a").session(owner))
                .andExpect(status().isOk()).andExpect(content().bytes(JPEG))
                .andExpect(header().string("Cache-Control", "no-store"));

        enqueue(path, false, true, "a", "penteado-a-0", "d")
                .andExpect(status().isAccepted()).andExpect(jsonPath("$.used").value(3));
        enqueue(path, false, true, "c").andExpect(status().isConflict());
        worker.process();
        worker.process();
        worker.process();
        assertEquals(Map.of("Corte A. Camadas longas", 1, "Coque baixo. Corte de referência: Corte A", 1, "Corte D", 1), CALLS);
        mvc.perform(get(path).session(owner)).andExpect(status().isOk())
                .andExpect(jsonPath("$.used").value(3)).andExpect(jsonPath("$.photoSaved").value(false))
                .andExpect(jsonPath("$.cards[*].state").value(containsInAnyOrder("READY", "READY", "READY")));

        var stranger = signUp("outra");
        mvc.perform(get(result).session(stranger)).andExpect(status().isNotFound());
        mvc.perform(get(path).session(stranger)).andExpect(status().isNotFound());
        mvc.perform(get(path + "/imagem").param("card", "a").session(stranger)).andExpect(status().isNotFound());
        mvc.perform(multipart(path).session(stranger).with(csrf()).param("cards", "a"))
                .andExpect(status().isNotFound());
    }

    @Test
    void onlyAllowsTheConfiguredPreviewOrigin() throws Exception {
        String path = consult("cabelo") + "/simulacoes";
        String preview = "https://espelho-teste.vercel.app";
        mvc.perform(multipart(path).file(new MockMultipartFile("foto", "original.jpg", "image/jpeg", ORIGINAL))
                        .session(owner).with(csrf()).header("Origin", preview).param("cards", "a").param("autoriza", "true"))
                .andExpect(status().isAccepted()).andExpect(header().string("Access-Control-Allow-Origin", preview));
        mvc.perform(multipart(path).session(owner).with(csrf())
                        .header("Origin", "https://outro-projeto.vercel.app").param("cards", "a"))
                .andExpect(status().isForbidden());
    }

    @Test
    void twoTabsReserveAtomicallyAndNeverResetOnRead() throws Exception {
        String path = consult("cabelo") + "/simulacoes";
        var start = new CountDownLatch(1);
        try (var threads = Executors.newVirtualThreadPerTaskExecutor()) {
            var tabA = threads.submit(() -> {
                start.await();
                return enqueue(path, true, true, "a", "penteado-a-0").andReturn().getResponse().getStatus();
            });
            var tabB = threads.submit(() -> {
                start.await();
                return enqueue(path, true, true, "b", "d").andReturn().getResponse().getStatus();
            });
            start.countDown();
            assertEquals(List.of(202, 409), List.of(tabA.get(), tabB.get()).stream().sorted().toList());
        }
        mvc.perform(get(path).session(owner)).andExpect(jsonPath("$.used").value(2));
    }

    @Test
    void preservesOtherPreviewsAndRetriesOnlyDefiniteRejections() throws Exception {
        String path = consult("cabelo") + "/simulacoes";
        enqueue(path, true, true, "a", "b", "c").andExpect(status().isAccepted());
        for (int i = 0; i < 3; i++) worker.process();
        mvc.perform(get(path).session(owner)).andExpect(status().isOk())
                .andExpect(jsonPath("$.used").value(2))
                .andExpect(jsonPath("$.cards[*].state").value(containsInAnyOrder("READY", "RETRYABLE", "UNCERTAIN")));
        enqueue(path, false, true, "a", "b", "c").andExpect(status().isAccepted());
        worker.process();
        worker.process();
        assertEquals(Map.of("Corte A. Camadas longas", 1, "Corte B", 2, "Corte C", 1), CALLS);
        mvc.perform(get(path + "/imagem").param("card", "a").session(owner))
                .andExpect(status().isOk()).andExpect(content().bytes(JPEG));
        mvc.perform(get(path + "/imagem").param("card", "b").session(owner))
                .andExpect(status().isOk()).andExpect(content().bytes(JPEG));
    }

    @Test
    void acceptsFewerMakeupCardsAndDoesNotRepeatInterruptedJob() throws Exception {
        String path = consult("maquiagem") + "/simulacoes";
        enqueue(path, true, true, "maquiagem-principal", "maquiagem-alternativa")
                .andExpect(status().isAccepted()).andExpect(jsonPath("$.limit").value(2));
        var claimed = simulations.claim().orElseThrow();
        assertArrayEquals(ORIGINAL, claimed.photo());
        jdbc.update("UPDATE T_EM_PREVIA_CONSULTA SET DT_ATUALIZACAO = TIMESTAMP '2000-01-01 00:00:00' WHERE DS_ESTADO = 'RUNNING'");
        worker.process();
        enqueue(path, false, true, "maquiagem-principal", "maquiagem-alternativa")
                .andExpect(status().isAccepted()).andExpect(jsonPath("$.used").value(2));
        worker.process();
        assertEquals(1, CALLS.values().stream().mapToInt(Integer::intValue).sum());
        mvc.perform(get(path).session(owner))
                .andExpect(jsonPath("$.cards[*].state").value(containsInAnyOrder("UNCERTAIN", "READY")));
    }

    private String consult(String area) throws Exception {
        var request = mvc.perform(multipart("/consultoria/" + area).session(owner).with(csrf()).param("respostas", "{}"))
                .andExpect(status().isOk()).andReturn();
        String id = com.jayway.jsonpath.JsonPath.read(request.getResponse().getContentAsString(), "$.consulta_id");
        return "/consultoria/" + area + "/resultados/" + id;
    }

    private ResultActions enqueue(String path, boolean photo, boolean consent, String... ids) throws Exception {
        var request = multipart(path);
        if (photo) request.file(new MockMultipartFile("foto", "original.jpg", "image/jpeg", ORIGINAL));
        return mvc.perform(request.session(owner).with(csrf()).param("cards", ids).param("autoriza", String.valueOf(consent)));
    }

    private MockHttpSession signUp(String name) throws Exception {
        mvc.perform(post("/auth/cadastro").with(csrf()).contentType("application/json").content("""
                {"nome":"Pessoa Teste","email":"%s@example.com","dataNascimento":"2001-04-03","senha":"exemplo-seguro"}
                """.formatted(name))).andExpect(status().isCreated());
        return (MockHttpSession) mvc.perform(post("/auth/login").with(csrf()).contentType("application/json").content("""
                {"email":"%s@example.com","senha":"exemplo-seguro"}
                """.formatted(name))).andExpect(status().isOk()).andReturn().getRequest().getSession(false);
    }

    private static String flaskUrl() {
        return "http://127.0.0.1:" + FLASK.getAddress().getPort();
    }

    private static HttpServer fakeFlask() {
        try {
            var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            server.createContext("/api/privado", exchange -> {
                try (exchange) {
                    var path = exchange.getRequestURI().getPath();
                    String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                    if (!KEY.equals(exchange.getRequestHeaders().getFirst("X-Espelho-Internal-Key"))) {
                        send(exchange, 403, "application/json", new byte[0]);
                    } else if (path.endsWith("/cabelo/analisar")) {
                        send(exchange, 200, "application/json", HAIR.getBytes(StandardCharsets.UTF_8));
                    } else if (path.endsWith("/maquiagem/analisar")) {
                        send(exchange, 200, "application/json", """
                                {"maquiagem":{"recomendacao":"Luminoso","sugestao_modelo":"Matte"}}
                                """.getBytes(StandardCharsets.UTF_8));
                    } else if (body.contains(new String(ORIGINAL, StandardCharsets.UTF_8))) {
                        int field = body.indexOf("name=\"estilo\"");
                        int start = body.indexOf("\r\n\r\n", field) + 4;
                        String style = body.substring(start, body.indexOf("\r\n", start));
                        int count = CALLS.merge(style, 1, Integer::sum);
                        if (style.equals("Corte B") && count == 1) {
                            exchange.getResponseHeaders().set("X-Espelho-Edit-Status", "not-processed");
                            send(exchange, 503, "application/json", new byte[0]);
                        } else if (style.equals("Corte C")) {
                            send(exchange, 504, "application/json", new byte[0]);
                        } else {
                            send(exchange, 200, "image/jpeg", JPEG);
                        }
                    } else {
                        send(exchange, 422, "application/json", new byte[0]);
                    }
                }
            });
            server.start();
            return server;
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    private static void send(HttpExchange exchange, int status, String type, byte[] content) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", type);
        exchange.sendResponseHeaders(status, content.length == 0 ? -1 : content.length);
        exchange.getResponseBody().write(content);
    }
}
