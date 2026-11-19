package br.com.fiap.espelhomeu.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class SaudeController {
    private final JdbcTemplate jdbc;
    private final boolean bancoConfigurado;

    public SaudeController(JdbcTemplate jdbc,
                           @Value("${spring.datasource.username:}") String usuario,
                           @Value("${spring.datasource.password:}") String senha) {
        this.jdbc = jdbc;
        this.bancoConfigurado = !usuario.isBlank() && !senha.isBlank();
    }

    @GetMapping("/saude")
    public ResponseEntity<Map<String, String>> saude() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of("status", "UP"));
    }

    @GetMapping("/saude/banco")
    public ResponseEntity<Map<String, String>> banco() {
        if (!bancoConfigurado) return indisponivel();
        try {
            jdbc.queryForList("SELECT ID_USUARIO, DS_HASH, DS_ROLE FROM T_EM_CREDENCIAL WHERE 1 = 0");
            return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of("status", "UP"));
        } catch (DataAccessException ex) {
            return indisponivel();
        }
    }

    private ResponseEntity<Map<String, String>> indisponivel() {
        return ResponseEntity.status(503).cacheControl(CacheControl.noStore()).body(Map.of("status", "DOWN"));
    }
}
