package br.com.fiap.espelhomeu.auth;

import br.com.fiap.espelhomeu.exception.RegraDeNegocioException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
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
    public record AdminUser(long id, String nome, String email, LocalDate data, String telefone,
                            String status, String role) {}

    public record AdminSummary(long usuarios, long cortes, long penteados, long cores,
                               long produtos, long maquiagem) {}

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

    public AdminSummary summarizeCatalog() {
        return jdbc.queryForObject("""
                SELECT (SELECT COUNT(*) FROM T_EM_USUARIO) AS USUARIOS,
                       (SELECT COUNT(*) FROM T_EM_CORTE) AS CORTES,
                       (SELECT COUNT(*) FROM T_EM_PENTEADO) AS PENTEADOS,
                       (SELECT COUNT(*) FROM T_EM_COR) AS CORES,
                       (SELECT COUNT(*) FROM T_EM_PRODUTO) AS PRODUTOS,
                       (SELECT COUNT(*) FROM T_EM_MAQUIAGEM) AS MAQUIAGEM
                FROM DUAL
                """, (rs, i) -> new AdminSummary(rs.getLong("USUARIOS"), rs.getLong("CORTES"),
                rs.getLong("PENTEADOS"), rs.getLong("CORES"), rs.getLong("PRODUTOS"), rs.getLong("MAQUIAGEM")));
    }

    public List<AdminUser> listUsers() {
        return jdbc.query("""
                SELECT u.ID_USUARIO, u.NM_USUARIO, u.EM_USUARIO, u.DT_NASCIMENTO,
                       u.TL_USUARIO, u.ST_USUARIO, c.DS_ROLE
                  FROM T_EM_USUARIO u LEFT JOIN T_EM_CREDENCIAL c ON c.ID_USUARIO = u.ID_USUARIO
                 ORDER BY u.ID_USUARIO DESC
                """, (rs, i) -> new AdminUser(rs.getLong("ID_USUARIO"), rs.getString("NM_USUARIO"),
                rs.getString("EM_USUARIO"), rs.getDate("DT_NASCIMENTO").toLocalDate(),
                rs.getString("TL_USUARIO"), rs.getString("ST_USUARIO"), rs.getString("DS_ROLE")));
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

    private static RegraDeNegocioException duplicate() {
        return new RegraDeNegocioException("Já existe uma conta com este e-mail.");
    }
}
