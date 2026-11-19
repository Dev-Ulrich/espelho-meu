package br.com.fiap.espelhomeu;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:auth;MODE=Oracle;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.datasource.driver-class-name=org.h2.Driver"
})
class EspelhomeuApplicationTests {
    @Autowired WebApplicationContext context;
    @Autowired JdbcTemplate jdbc;
    MockMvc mvc;

    @BeforeEach
    void configure() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        jdbc.execute("DROP TABLE IF EXISTS T_EM_CREDENCIAL");
        jdbc.execute("DROP TABLE IF EXISTS T_EM_USUARIO");
        jdbc.execute("DROP SEQUENCE IF EXISTS SQ_USUARIO");
        jdbc.execute("CREATE SEQUENCE SQ_USUARIO START WITH 1");
        jdbc.execute("""
                CREATE TABLE T_EM_USUARIO (
                  ID_USUARIO NUMBER(10) PRIMARY KEY, NM_USUARIO VARCHAR2(100) NOT NULL,
                  EM_USUARIO VARCHAR2(100) NOT NULL UNIQUE, DT_NASCIMENTO DATE NOT NULL,
                  TL_USUARIO VARCHAR2(20), ST_USUARIO VARCHAR2(20) NOT NULL)
                """);
        jdbc.execute("""
                CREATE TABLE T_EM_CREDENCIAL (
                  ID_USUARIO NUMBER(10) PRIMARY KEY REFERENCES T_EM_USUARIO(ID_USUARIO) ON DELETE CASCADE,
                  DS_HASH VARCHAR2(255) NOT NULL, DS_ROLE VARCHAR2(10) NOT NULL)
                """);
    }

    @Test
    void cadastroSessaoPermissoesELogout() throws Exception {
        String cadastro = """
                {"nome":"Pessoa Teste","email":"pessoa@example.com","dataNascimento":"2001-04-03",
                 "senha":"exemplo-seguro","role":"ADMIN"}
                """;
        mvc.perform(get("/auth/sessao")).andExpect(status().isUnauthorized());
        mvc.perform(get("/consultoria/cabelo/questionario")).andExpect(status().isUnauthorized());
        mvc.perform(post("/auth/cadastro").contentType("application/json").content(cadastro))
                .andExpect(status().isUnauthorized());
        var csrfResponse = mvc.perform(get("/auth/csrf")).andExpect(status().isOk()).andReturn();
        var csrfSession = (MockHttpSession) csrfResponse.getRequest().getSession(false);
        String csrfHeader = com.jayway.jsonpath.JsonPath.read(csrfResponse.getResponse().getContentAsString(), "$.header");
        String csrfToken = com.jayway.jsonpath.JsonPath.read(csrfResponse.getResponse().getContentAsString(), "$.token");
        mvc.perform(post("/auth/cadastro").session(csrfSession).header(csrfHeader, csrfToken)
                .contentType("application/json").content(cadastro))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("USER"));
        assertNotEquals("exemplo-seguro", jdbc.queryForObject("SELECT DS_HASH FROM T_EM_CREDENCIAL", String.class));
        mvc.perform(post("/auth/cadastro").with(csrf()).contentType("application/json").content(cadastro))
                .andExpect(status().isConflict());
        MockHttpSession session = (MockHttpSession) mvc.perform(post("/auth/login").with(csrf())
                .contentType("application/json").content("""
                        {"email":"PESSOA@example.com","senha":"exemplo-seguro"}
                        """)).andExpect(status().isOk()).andReturn().getRequest().getSession(false);
        mvc.perform(get("/auth/sessao").session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("USER"));
        mvc.perform(get("/usuario").session(session)).andExpect(status().isForbidden());
        mvc.perform(get("/produto").session(session)).andExpect(status().isForbidden());
        mvc.perform(get("/corte").session(session)).andExpect(status().isForbidden());
        mvc.perform(get("/consultoria/cabelo/questionario").session(session))
                .andExpect(status().isServiceUnavailable());
        jdbc.update("UPDATE T_EM_CREDENCIAL SET DS_ROLE = 'ADMIN'");
        mvc.perform(get("/usuario").session(session)).andExpect(status().isOk());
        mvc.perform(post("/auth/logout").with(csrf()).session(session)).andExpect(status().isNoContent());
        mvc.perform(get("/auth/sessao")).andExpect(status().isUnauthorized());
    }
}
