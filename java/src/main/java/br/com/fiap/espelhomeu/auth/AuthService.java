package br.com.fiap.espelhomeu.auth;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Optional;

@Service
public class AuthService {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    private final String dummyHash;

    public AuthService(JdbcTemplate jdbc, PasswordEncoder encoder) {
        this.jdbc = jdbc;
        this.encoder = encoder;
        this.dummyHash = encoder.encode(java.util.UUID.randomUUID().toString());
    }

    public record Account(long id, String nome, String email, String role) {}
    private record Login(Account account, String hash) {}

    @Transactional
    public Account register(String nome, String email, LocalDate nascimento, String telefone, String senha) {
        String normalized = normalize(email);
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM T_EM_USUARIO WHERE LOWER(EM_USUARIO) = ?", Integer.class, normalized);
        if (count != null && count > 0) throw duplicate();
        long id = java.util.Objects.requireNonNull(
                jdbc.queryForObject("SELECT SQ_USUARIO.NEXTVAL FROM DUAL", Long.class));
        String name = nome.strip();
        try {
            jdbc.update("""
                    INSERT INTO T_EM_USUARIO (ID_USUARIO, NM_USUARIO, EM_USUARIO, DT_NASCIMENTO, TL_USUARIO, ST_USUARIO)
                    VALUES (?, ?, ?, ?, ?, 'Ativo')
                    """, id, name, normalized, java.sql.Date.valueOf(nascimento), telefone);
            jdbc.update("INSERT INTO T_EM_CREDENCIAL (ID_USUARIO, DS_HASH, DS_ROLE) VALUES (?, ?, 'USER')",
                    id, encoder.encode(senha));
        } catch (org.springframework.dao.DuplicateKeyException ex) {
            throw duplicate();
        }
        return new Account(id, name, normalized, "USER");
    }

    public Optional<Account> authenticate(String email, String password) {
        var records = jdbc.query("""
                SELECT u.ID_USUARIO, u.NM_USUARIO, u.EM_USUARIO, c.DS_ROLE, c.DS_HASH
                  FROM T_EM_USUARIO u JOIN T_EM_CREDENCIAL c ON c.ID_USUARIO = u.ID_USUARIO
                 WHERE LOWER(u.EM_USUARIO) = ? AND u.ST_USUARIO = 'Ativo'
                """, (rs, i) -> new Login(new Account(rs.getLong(1), rs.getString(2),
                rs.getString(3), rs.getString(4)), rs.getString(5)), normalize(email));
        Optional<Login> found = records.size() == 1 ? Optional.of(records.getFirst()) : Optional.empty();
        boolean match = encoder.matches(password, found.map(Login::hash).orElse(dummyHash));
        return match ? found.map(Login::account) : Optional.empty();
    }

    public Optional<Account> findActive(long id) {
        return jdbc.query("""
                SELECT u.ID_USUARIO, u.NM_USUARIO, u.EM_USUARIO, c.DS_ROLE
                  FROM T_EM_USUARIO u JOIN T_EM_CREDENCIAL c ON c.ID_USUARIO = u.ID_USUARIO
                 WHERE u.ID_USUARIO = ? AND u.ST_USUARIO = 'Ativo'
                """, (rs, i) -> new Account(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4)), id)
                .stream().findFirst();
    }

    private static String normalize(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }

    private static ResponseStatusException duplicate() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma conta com este e-mail.");
    }
}
