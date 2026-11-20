package br.com.fiap.espelhomeu.handler;

import br.com.fiap.espelhomeu.exception.EntidadeNaoEncontradaException;
import br.com.fiap.espelhomeu.exception.ErroBancoDadosException;
import br.com.fiap.espelhomeu.exception.ErrorResponseDto;
import br.com.fiap.espelhomeu.exception.RegraDeNegocioException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.sql.SQLException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(EntidadeNaoEncontradaException.class)
    public ResponseEntity<ErrorResponseDto> naoEncontrada(EntidadeNaoEncontradaException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDto(
                        "Entidade não encontrada",
                        e.getMessage()
                ));
    }

    @ExceptionHandler(org.springframework.dao.DataAccessResourceFailureException.class)
    public ResponseEntity<ErrorResponseDto> conexaoBanco() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ErrorResponseDto("Serviço indisponível", "O banco de dados está indisponível."));
    }

    @ExceptionHandler(RegraDeNegocioException.class)
    public ResponseEntity<ErrorResponseDto> regraDeNegocio(RegraDeNegocioException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponseDto("Conflito", e.getMessage()));
    }

    @ExceptionHandler(ErroBancoDadosException.class)
    public ResponseEntity<ErrorResponseDto> erroBancoDados(ErroBancoDadosException e) {
        if (e.getCause() instanceof SQLException sql) {
            if (sql.getErrorCode() == 2292 || "23503".equals(sql.getSQLState())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ErrorResponseDto("Conflito", "Existem registros vinculados à entidade."));
            }
            if (sql.getErrorCode() == 1 || "23505".equals(sql.getSQLState())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ErrorResponseDto("Conflito", "O registro entra em conflito com um dado existente."));
            }
            if (sql.getErrorCode() == 2291 || "23506".equals(sql.getSQLState())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponseDto("Entidade não encontrada", "Um registro vinculado não foi encontrado."));
            }
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponseDto(
                        "Erro interno no servidor",
                        "Não foi possível realizar a operação no banco de dados"
                ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDto> validacao(MethodArgumentNotValidException e) {

        StringBuilder errors = new StringBuilder();

        e.getBindingResult().getFieldErrors().forEach(erro ->
                errors.append(erro.getDefaultMessage()).append("; ")
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDto(
                        "Dados inválidos",
                        errors.toString()
                ));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponseDto> jsonInvalido() {
        return ResponseEntity.badRequest()
                .body(new ErrorResponseDto("Dados inválidos", "O corpo da requisição não pôde ser interpretado."));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponseDto> erroRequisicao(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode())
                .body(new ErrorResponseDto(
                        "Erro na requisição",
                        e.getReason()
                ));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponseDto> tipoDeParametroInvalido(
            MethodArgumentTypeMismatchException e) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDto(
                        "Parâmetro inválido",
                        "O valor informado para '" + e.getName() + "' é inválido"
                ));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponseDto> recursoNaoEncontrado(
            NoResourceFoundException e) {

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDto(
                        "Rota não encontrada",
                        "O endpoint informado não existe"
                ));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponseDto> metodoNaoPermitido(
            HttpRequestMethodNotSupportedException e) {

        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ErrorResponseDto(
                        "Método não permitido",
                        "O método HTTP informado não é permitido neste endpoint"
                ));
    }
}