package br.com.fiap.espelhomeu;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:recomendacoes;MODE=Oracle;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa",
    "spring.datasource.password=teste-local",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "espelho.simulation.worker-enabled=false"
})
class RecomendacoesDaConsultoriaTests {
    @Autowired WebApplicationContext context;
    @Autowired JdbcTemplate jdbc;

    @Test
    void listaECadastraSomenteFilhosDaConsultoriaEDevolveConflitos() throws Exception {
        jdbc.execute("""
                CREATE TABLE T_EM_CONSULTORIA_CAPILAR (
                    ID_CONSULTORIA NUMBER PRIMARY KEY,
                    ID_PERFIL_CABELO NUMBER NOT NULL,
                    DT_CONSULTORIA DATE NOT NULL
                )
                """);
        jdbc.execute("CREATE TABLE T_EM_CORTE (ID_CORTE NUMBER PRIMARY KEY)");
        jdbc.execute("""
                CREATE TABLE T_EM_RECOMENDACAO_CORTE (
                    ID_RECOMENDACAO_CORTE NUMBER PRIMARY KEY,
                    ID_CONSULTORIA NUMBER NOT NULL REFERENCES T_EM_CONSULTORIA_CAPILAR(ID_CONSULTORIA),
                    ID_CORTE NUMBER NOT NULL REFERENCES T_EM_CORTE(ID_CORTE),
                    JT_CORTE VARCHAR2(150), DT_CORTE DATE,
                    UNIQUE (ID_CONSULTORIA, ID_CORTE)
                )
                """);
        jdbc.execute("CREATE SEQUENCE SQ_RECOMENDACAO_CORTE START WITH 100");
        jdbc.update("INSERT INTO T_EM_CONSULTORIA_CAPILAR VALUES (1, 10, CURRENT_DATE), (2, 10, CURRENT_DATE)");
        jdbc.update("INSERT INTO T_EM_CORTE VALUES (7)");
        jdbc.update("INSERT INTO T_EM_RECOMENDACAO_CORTE VALUES (9, 2, 7, NULL, CURRENT_DATE)");

        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        var admin = user("avaliador").roles("ADMIN");
        String rota = "/consultoriacapilar/1/recomendacoes";
        String json = """
                {"corteId":7,"justificativa":"Compatível com as preferências da consulta"}
                """;

        mvc.perform(get(rota).with(admin)).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/consultoriacapilar/999/recomendacoes").with(admin))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.erro").exists());
        mvc.perform(post(rota).with(admin).with(csrf()).contentType("application/json").content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post(rota).with(admin).with(csrf()).contentType("application/json").content(json))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/recomendacaocorte/100"))
                .andExpect(jsonPath("$.consultoriaCapilarId").value(1))
                .andExpect(jsonPath("$.corteId").value(7));
        mvc.perform(get(rota).with(admin)).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].id").value(100));
        mvc.perform(post(rota).with(admin).with(csrf()).contentType("application/json").content(json))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.erro").value("Conflito"));
        mvc.perform(delete("/consultoriacapilar/1").with(admin).with(csrf()))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.erro").value("Conflito"));
        mvc.perform(put(rota).with(admin).with(csrf()).contentType("application/json").content(json))
                .andExpect(status().isMethodNotAllowed());
    }
}
