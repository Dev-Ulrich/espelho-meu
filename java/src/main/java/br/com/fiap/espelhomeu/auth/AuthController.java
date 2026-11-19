package br.com.fiap.espelhomeu.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService auth;
    private final SecurityContextRepository contexts;

    public AuthController(AuthService auth, SecurityContextRepository contexts) {
        this.auth = auth;
        this.contexts = contexts;
    }

    public record Registration(@NotBlank @Size(min = 2, max = 100) String nome,
                               @NotBlank @Email @Size(max = 100) String email,
                               @NotNull @Past LocalDate dataNascimento,
                               @Pattern(regexp = "[0-9+() -]{0,20}") String telefone,
                               @NotBlank @Size(min = 8, max = 72) String senha) {}
    public record Login(@NotBlank @Email @Size(max = 100) String email,
                        @NotBlank @Size(max = 72) String senha) {}

    @GetMapping("/csrf")
    public ResponseEntity<Map<String, String>> csrf(CsrfToken token) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(Map.of("header", token.getHeaderName(), "token", token.getToken()));
    }

    @PostMapping("/cadastro")
    public ResponseEntity<AuthService.Account> register(@RequestBody @Valid Registration body) {
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
                .body(auth.register(body.nome(), body.email(), body.dataNascimento(), body.telefone(), body.senha()));
    }

    @PostMapping("/admin/usuarios")
    public ResponseEntity<AuthService.Account> createFromAdmin(@RequestBody @Valid Registration body) {
        return register(body);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthService.Account> login(@RequestBody @Valid Login body,
                                                     HttpServletRequest request, HttpServletResponse response) {
        AuthService.Account user = auth.authenticate(body.email(), body.senha())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos."));
        if (request.getSession(false) != null) request.getSession(false).invalidate();
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(SecurityConfig.authentication(user));
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(user);
    }

    @GetMapping("/sessao")
    public ResponseEntity<AuthService.Account> session(Authentication authentication) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body((AuthService.Account) authentication.getPrincipal());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Authentication authentication,
                                       HttpServletRequest request, HttpServletResponse response) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        return ResponseEntity.noContent().build();
    }
}
