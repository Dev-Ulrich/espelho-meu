package br.com.fiap.espelhomeu.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.http.HttpClient;
import java.time.Duration;

@RestController
@RequestMapping("/consultoria/{area:cabelo|maquiagem}")
public class ConsultationController {
    private final RestClient flask;
    private final RestClient simulation;
    private final String secret;

    public ConsultationController(
            @Value("${ESPELHO_IA_URL:https://espelho-meu-ia.onrender.com}") String url,
            @Value("${ESPELHO_IA_INTERNAL_KEY:}") String secret) {
        var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        var factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(40));
        var client = RestClient.builder().requestFactory(factory).baseUrl(url)
                .defaultHeader("X-Espelho-Internal-Key", secret.trim());
        this.flask = client.build();
        var simulationFactory = new JdkClientHttpRequestFactory(http);
        simulationFactory.setReadTimeout(Duration.ofSeconds(165));
        this.simulation = client.requestFactory(simulationFactory).build();
        this.secret = secret.trim();
    }

    @GetMapping("/questionario")
    public ResponseEntity<byte[]> questions(@PathVariable String area) {
        return forward(flask.get().uri("/api/privado/{area}/questionario", area));
    }

    @GetMapping("/simulacao")
    public ResponseEntity<byte[]> simulationStatus() {
        return forward(flask.get().uri("/api/privado/simulacoes/status"));
    }

    @PostMapping(value = "/simulacao", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> simulate(@PathVariable String area, @RequestParam String estilo,
                                           @RequestHeader("X-Simulacao-Codigo") String codigo,
                                           @RequestParam MultipartFile foto) throws IOException {
        var parts = new LinkedMultiValueMap<String, Object>();
        parts.add("estilo", estilo);
        addPhoto(parts, foto);
        return forward(simulation.post().uri("/api/privado/simulacoes/{area}", area)
                .header("X-Simulacao-Codigo", codigo).contentType(MediaType.MULTIPART_FORM_DATA).body(parts));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> submit(@PathVariable String area, @RequestParam String respostas,
                                         @RequestParam(required = false) MultipartFile foto) throws IOException {
        if (respostas.length() > 20_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Questionário acima do limite.");
        }
        var parts = new LinkedMultiValueMap<String, Object>();
        parts.add("respostas", respostas);
        addPhoto(parts, foto);
        return forward(flask.post().uri("/api/privado/{area}/analisar", area)
                .contentType(MediaType.MULTIPART_FORM_DATA).body(parts));
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
                boolean jpeg = response.getStatusCode().is2xxSuccessful()
                        && MediaType.IMAGE_JPEG.isCompatibleWith(response.getHeaders().getContentType());
                int limit = jpeg ? 5 * 1024 * 1024 : 1024 * 1024;
                byte[] body = response.getBody().readNBytes(limit + 1);
                if (body.length > limit) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Resposta da IA acima do limite.");
                return ResponseEntity.status(response.getStatusCode())
                        .contentType(jpeg ? MediaType.IMAGE_JPEG : MediaType.APPLICATION_JSON)
                        .cacheControl(CacheControl.noStore()).body(body);
            });
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "O serviço de consultoria está indisponível.");
        }
    }
}
