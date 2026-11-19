package br.com.fiap.espelhomeu.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
public class SecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() {
        return Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    }

    @Bean
    SecurityContextRepository securityContexts() {
        return new HttpSessionSecurityContextRepository();
    }

    static UsernamePasswordAuthenticationToken authentication(AuthService.Account user) {
        return UsernamePasswordAuthenticationToken.authenticated(user, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.role())));
    }

    @Bean
    SecurityFilterChain security(HttpSecurity http, AuthService auth, SecurityContextRepository contexts)
            throws Exception {
        http.cors(org.springframework.security.config.Customizer.withDefaults())
                .securityContext(context -> context.securityContextRepository(contexts))
                .requestCache(cache -> cache.disable())
                .logout(logout -> logout.disable())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, error) -> response.setStatus(401))
                        .accessDeniedHandler((request, response, error) ->
                                response.setStatus(request.getUserPrincipal() == null ? 401 : 403)))
                .authorizeHttpRequests(routes -> routes
                        .requestMatchers(HttpMethod.GET, "/auth/csrf", "/saude", "/saude/banco").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/cadastro", "/auth/login").permitAll()
                        .requestMatchers("/auth/sessao", "/auth/logout", "/consultoria/cabelo/**", "/consultoria/maquiagem/**").authenticated()
                        .anyRequest().hasRole("ADMIN"))
                .addFilterBefore(new OncePerRequestFilter() {
                    @Override
                    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                                    FilterChain chain) throws ServletException, IOException {
                        var context = SecurityContextHolder.getContext();
                        if (context.getAuthentication() != null
                                && context.getAuthentication().getPrincipal() instanceof AuthService.Account account) {
                            var current = auth.findActive(account.id());
                            if (current.isPresent()) {
                                var refreshed = SecurityContextHolder.createEmptyContext();
                                refreshed.setAuthentication(authentication(current.get()));
                                SecurityContextHolder.setContext(refreshed);
                            } else {
                                SecurityContextHolder.clearContext();
                                if (request.getSession(false) != null) request.getSession(false).invalidate();
                            }
                        }
                        chain.doFilter(request, response);
                    }
                }, AuthorizationFilter.class);
        return http.build();
    }
}
