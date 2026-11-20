package br.com.fiap.espelhomeu.controller;

import br.com.fiap.espelhomeu.dao.ConsultoriaCapilarDao;
import br.com.fiap.espelhomeu.dao.RecomendacaoCorteDao;
import br.com.fiap.espelhomeu.dto.CadastroRecomendacaoCorteAninhada;
import br.com.fiap.espelhomeu.dto.AtualizacaoRecomendacaoCorte;
import br.com.fiap.espelhomeu.dto.CadastroRecomendacaoCorte;
import br.com.fiap.espelhomeu.dto.DetalhesRecomendacaoCorte;
import br.com.fiap.espelhomeu.model.ConsultoriaCapilar;
import br.com.fiap.espelhomeu.model.Corte;
import br.com.fiap.espelhomeu.model.RecomendacaoCorte;
import jakarta.validation.Valid;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;

@RestController
public class RecomendacaoCorteController {

    private static final String RECOMENDACAO = "/recomendacaocorte";
    private static final String RECOMENDACOES_DA_CONSULTORIA = "/consultoriacapilar/{consultoriaId}/recomendacoes";

    private final RecomendacaoCorteDao dao;
    private final ConsultoriaCapilarDao consultoriaDao;
    private final ModelMapper mapper;

    public RecomendacaoCorteController(RecomendacaoCorteDao dao, ConsultoriaCapilarDao consultoriaDao,
                                       ModelMapper mapper) {
        this.dao = dao;
        this.consultoriaDao = consultoriaDao;
        this.mapper = mapper;
    }

    @GetMapping(RECOMENDACAO)
    public List<DetalhesRecomendacaoCorte> listar() {
        return dao.listar().stream().map(this::detalhes).toList();
    }

    @GetMapping(RECOMENDACOES_DA_CONSULTORIA)
    public List<DetalhesRecomendacaoCorte> listarPorConsultoria(@PathVariable long consultoriaId) {
        consultoriaDao.buscar(consultoriaId);
        return dao.listarPorConsultoria(consultoriaId).stream().map(this::detalhes).toList();
    }

    @PostMapping(RECOMENDACOES_DA_CONSULTORIA)
    public ResponseEntity<DetalhesRecomendacaoCorte> inserirNaConsultoria(
            @PathVariable long consultoriaId,
            @RequestBody @Valid CadastroRecomendacaoCorteAninhada dto) {
        consultoriaDao.buscar(consultoriaId);
        return inserir(new CadastroRecomendacaoCorte(consultoriaId, dto.corteId(), dto.justificativa(),
                LocalDateTime.now()));
    }

    private DetalhesRecomendacaoCorte detalhes(RecomendacaoCorte recomendacao) {
        DetalhesRecomendacaoCorte detalhes = mapper.map(recomendacao, DetalhesRecomendacaoCorte.class);
        detalhes.setConsultoriaCapilarId(recomendacao.getConsultoriaCapilar().getId());
        detalhes.setCorteId(recomendacao.getCorte().getId());
        return detalhes;
    }

    @GetMapping(RECOMENDACAO + "/{id}")
    public ResponseEntity<DetalhesRecomendacaoCorte> buscar(@PathVariable long id)  {
        RecomendacaoCorte recomendacao = dao.buscar(id);

        return ResponseEntity.ok(detalhes(recomendacao));
    }

    @PostMapping(RECOMENDACAO)
    public ResponseEntity<DetalhesRecomendacaoCorte> inserir(
            @RequestBody @Valid CadastroRecomendacaoCorte dto)  {

        RecomendacaoCorte recomendacao = mapper.map(dto, RecomendacaoCorte.class);

        ConsultoriaCapilar consultoria = new ConsultoriaCapilar();
        consultoria.setId(dto.getConsultoriaCapilarId());
        recomendacao.setConsultoriaCapilar(consultoria);

        Corte corte = new Corte();
        corte.setId(dto.getCorteId());
        recomendacao.setCorte(corte);

        dao.inserir(recomendacao);

        URI uri = ServletUriComponentsBuilder
                .fromCurrentContextPath()
                .path(RECOMENDACAO + "/{id}")
                .buildAndExpand(recomendacao.getId())
                .toUri();

        return ResponseEntity.created(uri).body(detalhes(recomendacao));
    }

    @PutMapping(RECOMENDACAO + "/{id}")
    public ResponseEntity<DetalhesRecomendacaoCorte> atualizar(
            @PathVariable long id,
            @RequestBody @Valid AtualizacaoRecomendacaoCorte dto)  {

        RecomendacaoCorte recomendacao = dao.buscar(id);

        mapper.map(dto, recomendacao);

        ConsultoriaCapilar consultoria = new ConsultoriaCapilar();
        consultoria.setId(dto.getConsultoriaCapilarId());
        recomendacao.setConsultoriaCapilar(consultoria);

        Corte corte = new Corte();
        corte.setId(dto.getCorteId());
        recomendacao.setCorte(corte);

        dao.atualizar(recomendacao);

        return ResponseEntity.ok(detalhes(recomendacao));
    }

    @DeleteMapping(RECOMENDACAO + "/{id}")
    public ResponseEntity<Void> deletar(@PathVariable long id)  {
        dao.deletar(id);
        return ResponseEntity.noContent().build();
    }
}