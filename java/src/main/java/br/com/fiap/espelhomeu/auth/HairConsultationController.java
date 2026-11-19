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
@RequestMapping("/consultoria/cabelo")
public class HairConsultationController {
    private final RestClient flask;
    private final String secret;

    public HairConsultationController(
            @Value("${ESPELHO_IA_URL:https://espelho-meu-ia.onrender.com}") String url,
            @Value("${ESPELHO_IA_INTERNAL_KEY:}") String secret) {
        var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        var factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(40));
        this.flask = RestClient.builder().requestFactory(factory).baseUrl(url)
                .defaultHeader("X-Espelho-Internal-Key", secret.trim()).build();
        this.secret = secret.trim();
    }

    @GetMapping("/questionario")
    public ResponseEntity<byte[]> questions() {
        return forward(flask.get().uri("/api/privado/cabelo/questionario"));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> submit(@RequestParam String respostas,
                                         @RequestParam(required = false) MultipartFile foto) throws IOException {
        if (respostas.length() > 20_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Questionário acima do limite.");
        }
        var parts = new LinkedMultiValueMap<String, Object>();
        parts.add("respostas", respostas);
        if (foto != null && !foto.isEmpty()) {
            parts.add("foto", new ByteArrayResource(foto.getBytes()) {
                @Override public String getFilename() { return "foto"; }
            });
        }
        return forward(flask.post().uri("/api/privado/cabelo/analisar")
                .contentType(MediaType.MULTIPART_FORM_DATA).body(parts));
    }

    private ResponseEntity<byte[]> forward(RestClient.RequestHeadersSpec<?> request) {
        if (secret.length() < 32) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Consultoria indisponível neste servidor.");
        }
        try {
            return request.exchange((sent, response) -> ResponseEntity.status(response.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON).cacheControl(CacheControl.noStore())
                    .body(response.getBody().readNBytes(1_048_576)));
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "O serviço de consultoria está indisponível.");
        }
    }
}
