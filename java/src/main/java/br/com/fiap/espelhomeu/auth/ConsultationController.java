package br.com.fiap.espelhomeu.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

@RestController
@RequestMapping("/consultoria/{area:cabelo|maquiagem}")
public class ConsultationController {
    private final RestClient flask;
    private final ConsultationSimulations simulations;
    private final ObjectMapper json;
    private final String secret;

    public ConsultationController(
            @Value("${ESPELHO_IA_URL:https://espelho-meu-ia.onrender.com}") String url,
            @Value("${ESPELHO_IA_INTERNAL_KEY:}") String secret,
            ConsultationSimulations simulations, ObjectMapper json) {
        var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        var factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(40));
        var client = RestClient.builder().requestFactory(factory).baseUrl(url)
                .defaultHeader("X-Espelho-Internal-Key", secret.trim());
        this.flask = client.build();
        this.simulations = simulations;
        this.json = json;
        this.secret = secret.trim();
    }

    @GetMapping("/questionario")
    public ResponseEntity<byte[]> questions(@PathVariable String area) {
        return forward(flask.get().uri("/api/privado/{area}/questionario", area));
    }

    @GetMapping("/resultados/{id}")
    public ResponseEntity<ObjectNode> result(@PathVariable String area, @PathVariable UUID id,
                                             @AuthenticationPrincipal AuthService.Account account) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(simulations.result(id.toString(), account.id(), area));
    }

    @GetMapping("/resultados/{id}/simulacoes")
    public ResponseEntity<ConsultationSimulations.Progress> progress(@PathVariable String area, @PathVariable UUID id,
                                                                     @AuthenticationPrincipal AuthService.Account account) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(simulations.progress(id.toString(), account.id(), area));
    }

    @PostMapping(value = "/resultados/{id}/simulacoes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ConsultationSimulations.Progress> enqueue(
            @PathVariable String area, @PathVariable UUID id, @AuthenticationPrincipal AuthService.Account account,
            @RequestParam List<String> cards, @RequestParam(defaultValue = "false") boolean autoriza,
            @RequestParam(required = false) MultipartFile foto) throws IOException {
        return ResponseEntity.accepted().cacheControl(CacheControl.noStore())
                .body(simulations.enqueue(id.toString(), account.id(), area, cards, autoriza,
                        foto == null ? null : foto.getBytes()));
    }

    @GetMapping("/resultados/{id}/simulacoes/imagem")
    public ResponseEntity<byte[]> preview(@PathVariable String area, @PathVariable UUID id,
                                          @AuthenticationPrincipal AuthService.Account account,
                                          @RequestParam String card) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).contentType(MediaType.IMAGE_JPEG)
                .body(simulations.image(id.toString(), account.id(), area, card));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submit(@PathVariable String area, @RequestParam String respostas,
                                    @AuthenticationPrincipal AuthService.Account account,
                                         @RequestParam(required = false) MultipartFile foto) throws IOException {
        if (respostas.length() > 20_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Questionário acima do limite.");
        }
        var parts = new LinkedMultiValueMap<String, Object>();
        parts.add("respostas", respostas);
        addPhoto(parts, foto);
        var response = forward(flask.post().uri("/api/privado/{area}/analisar", area)
                .contentType(MediaType.MULTIPART_FORM_DATA).body(parts));
        if (!response.getStatusCode().is2xxSuccessful()) return response;
        ObjectNode result;
        try {
            var decoded = json.readTree(response.getBody());
            if (!(decoded instanceof ObjectNode object) || !object.path(area).isObject()) {
                throw new IllegalArgumentException();
            }
            result = object;
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "A consultoria retornou um resultado incompleto.");
        }
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(simulations.save(account.id(), area, result));
    }

    private void addPhoto(LinkedMultiValueMap<String, Object> parts, MultipartFile foto) throws IOException {
        if (foto != null && !foto.isEmpty()) {
            parts.add("foto", new ByteArrayResource(foto.getBytes()) {
                @Override public String getFilename() { return "foto"; }
            });
        }
    }

    private ResponseEntity<byte[]> forward(RestClient.RequestHeadersSpec<?> request) {
        if (secret.length() < 32) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Consultoria indisponível neste servidor.");
        }
        try {
            return request.exchange((sent, response) -> {
                int limit = 1024 * 1024;
                byte[] body = response.getBody().readNBytes(limit + 1);
                if (body.length > limit) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Resposta da IA acima do limite.");
                return ResponseEntity.status(response.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .cacheControl(CacheControl.noStore()).body(body);
            });
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "O serviço de consultoria está indisponível.");
        }
    }
}
