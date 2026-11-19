package br.com.fiap.espelhomeu.auth;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.support.SqlBinaryValue;
import org.springframework.jdbc.core.support.SqlCharacterValue;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ConsultationSimulations {
    private static final int MAX_PREVIEWS = 3;
    enum State { QUEUED, RUNNING, READY, RETRYABLE, UNCERTAIN }
    public record Preview(String cardId, State state) {}
    public record Progress(int used, int limit, boolean photoSaved, List<Preview> cards) {}
    record JobKey(String consultationId, String cardId) {}
    record Job(JobKey key, String area, String style, byte[] photo) {}
    private record Consultation(String result, int limit, boolean photoSaved) {}

    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public ConsultationSimulations(JdbcTemplate jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    ObjectNode save(long owner, String area, ObjectNode result) {
        String id = UUID.randomUUID().toString();
        int limit = Math.min(MAX_PREVIEWS, ComparisonCards.from(area, result).size());
        jdbc.update("""
                INSERT INTO T_EM_CONSULTA_GUIADA (ID_CONSULTA, ID_USUARIO, DS_AREA, DS_RESULTADO, NR_LIMITE)
                VALUES (?, ?, ?, ?, ?)
                """, new Object[]{id, owner, area, new SqlCharacterValue(result.toString()), limit},
                new int[]{Types.VARCHAR, Types.NUMERIC, Types.VARCHAR, Types.CLOB, Types.NUMERIC});
        return result.put("consulta_id", id);
    }

    ObjectNode result(String consultationId, long owner, String area) {
        var consultation = find(consultationId, owner, area, false);
        return ((ObjectNode) json.readTree(consultation.result())).put("consulta_id", consultationId);
    }

    public Progress progress(String id, long owner, String area) {
        return progress(id, find(id, owner, area, false));
    }

    @Transactional
    public Progress enqueue(String id, long owner, String area, List<String> cards, boolean consent, byte[] photo) {
        var consultation = find(id, owner, area, true);
        if (cards == null || cards.isEmpty() || cards.size() > MAX_PREVIEWS
                || cards.size() != new HashSet<>(cards).size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione de um a três cartões distintos.");
        }
        var recommended = ComparisonCards.from(area, json.readTree(consultation.result()));
        if (!recommended.keySet().containsAll(cards)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Selecione cartões recomendados nesta consulta.");
        }
        var progress = progress(id, consultation);
        var reserved = new HashSet<String>();
        var retryable = new HashSet<String>();
        for (var preview : progress.cards()) {
            (preview.state() == State.RETRYABLE ? retryable : reserved).add(preview.cardId());
        }
        var pending = new ArrayList<>(cards);
        pending.removeAll(reserved);
        if (pending.isEmpty()) return progress;
        if (progress.used() + pending.size() > consultation.limit()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A seleção ultrapassa o limite de prévias desta consulta.");
        }
        if (!consent) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Confirme a autorização de envio da foto.");
        }
        if (!consultation.photoSaved()) {
            if (photo == null || photo.length == 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione uma foto para gerar as prévias.");
            }
            jdbc.update("UPDATE T_EM_CONSULTA_GUIADA SET BL_FOTO = ? WHERE ID_CONSULTA = ?",
                    new Object[]{new SqlBinaryValue(photo), id}, new int[]{Types.BLOB, Types.VARCHAR});
        }
        var now = Timestamp.from(Instant.now());
        for (String card : pending) {
            if (retryable.contains(card)) {
                jdbc.update("""
                        UPDATE T_EM_PREVIA_CONSULTA SET DS_ESTADO = 'QUEUED', DT_ATUALIZACAO = ?
                        WHERE ID_CONSULTA = ? AND ID_CARTAO = ?
                        """, now, id, card);
            } else {
                jdbc.update("""
                        INSERT INTO T_EM_PREVIA_CONSULTA (ID_CONSULTA, ID_CARTAO, DS_ESTILO, DS_ESTADO, DT_ATUALIZACAO)
                        VALUES (?, ?, ?, 'QUEUED', ?)
                        """, id, card, recommended.get(card), now);
            }
        }
        return new Progress(progress.used() + pending.size(), consultation.limit(), true, previews(id));
    }

    byte[] image(String id, long owner, String area, String card) {
        return jdbc.query("""
                SELECT p.BL_PREVIA FROM T_EM_PREVIA_CONSULTA p JOIN T_EM_CONSULTA_GUIADA c
                  ON c.ID_CONSULTA = p.ID_CONSULTA
                 WHERE c.ID_CONSULTA = ? AND c.ID_USUARIO = ? AND c.DS_AREA = ?
                   AND p.ID_CARTAO = ? AND p.DS_ESTADO = 'READY'
                """, (row, index) -> row.getBytes(1), id, owner, area, card)
                .stream().findFirst().orElseThrow(ConsultationSimulations::notFound);
    }

    @Transactional
    public Optional<Job> claim() {
        var keys = jdbc.query("""
                SELECT ID_CONSULTA, ID_CARTAO FROM T_EM_PREVIA_CONSULTA
                WHERE DS_ESTADO = 'QUEUED' ORDER BY DT_ATUALIZACAO, ID_CONSULTA, ID_CARTAO
                FETCH FIRST 1 ROW ONLY
                """, (row, index) -> new JobKey(row.getString(1), row.getString(2)));
        if (keys.isEmpty()) return Optional.empty();
        var key = keys.getFirst();
        int updated = jdbc.update("""
                UPDATE T_EM_PREVIA_CONSULTA SET DS_ESTADO = 'RUNNING', DT_ATUALIZACAO = ?
                WHERE ID_CONSULTA = ? AND ID_CARTAO = ? AND DS_ESTADO = 'QUEUED'
                """, Timestamp.from(Instant.now()), key.consultationId(), key.cardId());
        if (updated == 0) return Optional.empty();
        return jdbc.query("""
                SELECT c.DS_AREA, p.DS_ESTILO, c.BL_FOTO
                FROM T_EM_PREVIA_CONSULTA p JOIN T_EM_CONSULTA_GUIADA c ON c.ID_CONSULTA = p.ID_CONSULTA
                WHERE p.ID_CONSULTA = ? AND p.ID_CARTAO = ?
                """, (row, index) -> new Job(key, row.getString(1), row.getString(2), row.getBytes(3)),
                key.consultationId(), key.cardId()).stream().findFirst();
    }

    List<JobKey> expired(Instant before) {
        return jdbc.query("""
                SELECT ID_CONSULTA, ID_CARTAO FROM T_EM_PREVIA_CONSULTA
                WHERE DS_ESTADO = 'RUNNING' AND DT_ATUALIZACAO < ?
                """, (row, index) -> new JobKey(row.getString(1), row.getString(2)), Timestamp.from(before));
    }

    @Transactional
    public void finish(JobKey key, State state, byte[] image, Instant cutoff) {
        var limits = jdbc.query("""
                SELECT NR_LIMITE FROM T_EM_CONSULTA_GUIADA WHERE ID_CONSULTA = ? FOR UPDATE
                """, (row, index) -> row.getInt(1), key.consultationId());
        if (limits.isEmpty()) return;
        jdbc.update("""
                UPDATE T_EM_PREVIA_CONSULTA SET DS_ESTADO = ?, DT_ATUALIZACAO = ?, BL_PREVIA = ?
                WHERE ID_CONSULTA = ? AND ID_CARTAO = ? AND DS_ESTADO = 'RUNNING' AND DT_ATUALIZACAO <= ?
                """, new Object[]{state.name(), Timestamp.from(Instant.now()),
                image == null ? null : new SqlBinaryValue(image), key.consultationId(), key.cardId(), Timestamp.from(cutoff)},
                new int[]{Types.VARCHAR, Types.TIMESTAMP, Types.BLOB, Types.VARCHAR, Types.VARCHAR, Types.TIMESTAMP});
        var previews = previews(key.consultationId());
        boolean active = previews.stream().anyMatch(p -> p.state() == State.QUEUED || p.state() == State.RUNNING);
        long used = previews.stream().filter(p -> p.state() != State.RETRYABLE).count();
        if (!active && (used == 0 || used == limits.getFirst())) {
            jdbc.update("UPDATE T_EM_CONSULTA_GUIADA SET BL_FOTO = NULL WHERE ID_CONSULTA = ?", key.consultationId());
        }
    }

    private Consultation find(String id, long owner, String area, boolean lock) {
        String sql = """
                SELECT DS_RESULTADO, NR_LIMITE, CASE WHEN BL_FOTO IS NULL THEN 0 ELSE 1 END
                FROM T_EM_CONSULTA_GUIADA WHERE ID_CONSULTA = ? AND ID_USUARIO = ? AND DS_AREA = ?
                """;
        return jdbc.query(lock ? sql + " FOR UPDATE" : sql, (row, index) ->
                new Consultation(row.getString(1), row.getInt(2), row.getInt(3) == 1),
                id, owner, area).stream().findFirst().orElseThrow(ConsultationSimulations::notFound);
    }

    private List<Preview> previews(String id) {
        return jdbc.query("""
                SELECT ID_CARTAO, DS_ESTADO FROM T_EM_PREVIA_CONSULTA
                WHERE ID_CONSULTA = ? ORDER BY DT_ATUALIZACAO, ID_CARTAO
                """, (row, index) -> new Preview(row.getString(1), State.valueOf(row.getString(2))), id);
    }

    private Progress progress(String id, Consultation consultation) {
        var previews = previews(id);
        int used = (int) previews.stream().filter(p -> p.state() != State.RETRYABLE).count();
        return new Progress(used, consultation.limit(), consultation.photoSaved(), previews);
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Consulta ou prévia não encontrada.");
    }
}
