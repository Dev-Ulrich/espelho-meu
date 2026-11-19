package br.com.fiap.espelhomeu.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;

import static br.com.fiap.espelhomeu.auth.ConsultationSimulations.State;

@Component
@ConditionalOnProperty(name = "espelho.simulation.worker-enabled", havingValue = "true", matchIfMissing = true)
class SimulationWorker {
    private static final int JPEG_LIMIT = 4 * 1024 * 1024;
    private final ConsultationSimulations simulations;
    private final RestClient flask;
    private final String secret;

    SimulationWorker(ConsultationSimulations simulations,
                     @Value("${ESPELHO_IA_URL:https://espelho-meu-ia.onrender.com}") String url,
                     @Value("${ESPELHO_IA_INTERNAL_KEY:}") String secret) {
        this.simulations = simulations;
        this.secret = secret.trim();
        var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        var factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(175));
        this.flask = RestClient.builder().baseUrl(url).requestFactory(factory)
                .defaultHeader("X-Espelho-Internal-Key", this.secret).build();
    }

    @Scheduled(fixedDelay = 2000)
    void process() {
        var cutoff = Instant.now().minus(Duration.ofMinutes(6));
        for (var key : simulations.expired(cutoff)) {
            simulations.finish(key, State.UNCERTAIN, null, cutoff);
        }
        simulations.claim().ifPresent(job -> {
            var outcome = edit(job);
            simulations.finish(job.key(), outcome.state(), outcome.image(), Instant.now());
        });
    }

    private Outcome edit(ConsultationSimulations.Job job) {
        if (secret.length() < 32 || job.photo() == null) return new Outcome(State.RETRYABLE, null);
        var parts = new LinkedMultiValueMap<String, Object>();
        parts.add("estilo", job.style());
        parts.add("foto", new ByteArrayResource(job.photo()) {
            @Override public String getFilename() { return "foto"; }
        });
        try {
            return flask.post().uri("/api/privado/edicoes-consulta/{area}", job.area())
                    .contentType(MediaType.MULTIPART_FORM_DATA).body(parts).exchange((request, response) -> {
                        if (response.getStatusCode().is2xxSuccessful()
                                && MediaType.IMAGE_JPEG.isCompatibleWith(response.getHeaders().getContentType())) {
                            var jpeg = response.getBody().readNBytes(JPEG_LIMIT + 1);
                            if (jpeg.length <= JPEG_LIMIT && jpeg.length >= 2
                                    && jpeg[0] == (byte) 0xff && jpeg[1] == (byte) 0xd8) {
                                return new Outcome(State.READY, jpeg);
                            }
                        }
                        boolean rejected = "not-processed".equals(
                                response.getHeaders().getFirst("X-Espelho-Edit-Status"));
                        return new Outcome(rejected ? State.RETRYABLE : State.UNCERTAIN, null);
                    });
        } catch (RestClientException ex) {
            return new Outcome(State.UNCERTAIN, null);
        }
    }

    private record Outcome(State state, byte[] image) {}
}
