package br.com.fiap.espelhomeu.auth;

import tools.jackson.databind.JsonNode;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;

final class ComparisonCards {
    private ComparisonCards() {}

    static Map<String, String> from(String area, JsonNode result) {
        var cards = new LinkedHashMap<String, String>();
        var names = new HashSet<String>();
        if (area.equals("cabelo")) {
            var hair = result.path("cabelo");
            var cuts = hair.path("cortes");
            for (var cut : cuts) {
                add(cards, names, cut.path("id").asText(), cut.path("nome").asText(),
                        cut.path("como_pedir").asText());
            }
            for (var color : hair.path("opcoes_cor")) {
                var id = color.path("id").asText();
                var tone = color.path("nome").asText();
                var technique = color.path("tecnica").asText();
                if (isHairColor(id) && !tone.isBlank() && !technique.isBlank()) {
                    add(cards, names, id, tone, "Técnica de coloração: " + technique);
                }
            }
            for (var cut : cuts) {
                var hairstyles = cut.path("penteados");
                for (int index = 0; index < hairstyles.size(); index++) {
                    add(cards, names, "penteado-" + cut.path("id").asText() + "-" + index,
                            hairstyles.get(index).asText(), "Corte de referência: " + cut.path("nome").asText());
                }
            }
        } else {
            var makeup = result.path("maquiagem");
            add(cards, names, "maquiagem-principal", makeup.path("recomendacao").asText(),
                    makeup.path("aplicacao").asText());
            var alternative = makeup.path("sugestao_modelo");
            if (alternative.isTextual()) {
                add(cards, names, "maquiagem-alternativa", alternative.asText(), "");
            }
        }
        return cards;
    }

    static boolean isHairColor(String id) {
        return id.equals("cor-1") || id.equals("cor-2");
    }

    private static void add(Map<String, String> cards, HashSet<String> names, String id, String name, String details) {
        if (!id.isBlank() && !name.isBlank() && names.add(name)) {
            cards.put(id, details.isBlank() ? name : name + ". " + details);
        }
    }
}
