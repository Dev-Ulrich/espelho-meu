"""Complementa a previsão com alternativas observadas em perfis sintéticos."""
from csv import DictReader

from configuracao import ALVO, CAMPOS, RAIZ

ROTULOS = {
    "textura": "textura",
    "comprimento": "comprimento",
    "manutencao": "tempo de manutenção",
    "tipo_pele": "tipo de pele",
    "ocasiao": "ocasião",
    "acabamento": "acabamento",
}
CUIDADOS = {
    "cabelo": "Mostre uma referência do corte ao profissional e combine a rotina de manutenção.",
    "maquiagem": "Aplique em camadas finas e teste a tonalidade em luz natural.",
}


def carregar_perfis(area):
    with (RAIZ / "dados" / f"{area}.csv").open(encoding="utf-8", newline="") as arquivo:
        return list(DictReader(arquivo))


def listar_alternativas(area, dados, principal, perfis):
    campos = CAMPOS[area]

    def diferencas(perfil):
        return [ROTULOS[campo] for campo in campos if perfil[campo] != dados[campo]]

    recomendacoes = [{
        "estilo": principal,
        "justificativa": "Sugestão do modelo para a combinação de respostas informada.",
        "cuidados": CUIDADOS[area],
    }]
    usados = {principal}
    for perfil in sorted(perfis, key=lambda item: len(diferencas(item))):
        estilo = perfil[ALVO]
        if estilo in usados:
            continue
        alteracoes = diferencas(perfil)
        justificativa = (
            "Alternativa observada em um perfil de exemplo com outras escolhas em " + ", ".join(alteracoes) + "."
            if alteracoes else "Alternativa observada em um perfil de exemplo com as mesmas respostas."
        )
        recomendacoes.append({"estilo": estilo, "justificativa": justificativa, "cuidados": CUIDADOS[area]})
        usados.add(estilo)
        if len(recomendacoes) == 3:
            break
    return recomendacoes
