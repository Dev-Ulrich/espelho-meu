package br.com.fiap.espelhomeu.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    private final String previewOrigin;

    public CorsConfig(@Value("${ESPELHO_JAVA_PREVIEW_ORIGIN:}") String previewOrigin) {
        this.previewOrigin = previewOrigin.strip();
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        var origins = new ArrayList<>(List.of(
                "https://espelho-meu-two.vercel.app", "http://localhost:5173", "http://127.0.0.1:5173"));
        if (!previewOrigin.isEmpty()) origins.add(previewOrigin);
        registry.addMapping("/**")
                .allowedOrigins(origins.toArray(String[]::new))
                .allowCredentials(true)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS");
    }
}
