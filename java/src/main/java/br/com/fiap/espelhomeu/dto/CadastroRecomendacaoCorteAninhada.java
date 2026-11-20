package br.com.fiap.espelhomeu.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CadastroRecomendacaoCorteAninhada(
        @NotNull @Positive Long corteId,
        @Size(max = 150) String justificativa
) {}
