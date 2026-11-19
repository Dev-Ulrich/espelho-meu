"""Ordenação editorial de cortes por compatibilidade e preferências."""
import csv
import json

from configuracao import RAIZ
from esteticas import PERFIS

DADOS = RAIZ / "dados"
FONTES = json.loads((DADOS / "fontes_cortes.json").read_text(encoding="utf-8"))
with (DADOS / "catalogo_cortes.csv").open(encoding="utf-8-sig", newline="") as arquivo:
    CATALOGO = tuple(csv.DictReader(arquivo))

NOMES_CORTES = frozenset(corte["nome"] for corte in CATALOGO)
MANUTENCAO = {"baixa": 1, "media": 2, "alta": 3}
ESTILOS = {"classico": "Clássico", "moderno": "Moderno", "marcante": "Marcante"}
EFEITOS = {
    "topo": "volume concentrado no topo",
    "laterais_limpas": "laterais com menos volume",
    "rosto_aberto": "rosto e testa mais abertos",
    "altura_moderada": "altura moderada no topo",
    "franja": "franja no desenho do corte",
    "assimetria": "contorno assimétrico",
    "volume_lateral": "volume nas laterais",
    "linha_reta": "linhas retas no contorno",
    "linha_diagonal": "linhas diagonais no contorno",
    "volume_queixo": "movimento na região do maxilar",
    "movimento": "movimento criado por camadas",
    "cobertura_temporas": "mechas ao redor das têmporas",
}

# Preferências visuais editoriais. O mesmo corte pode interessar a vários formatos.
EFEITOS_POR_ROSTO = {
    "oval": {"altura_moderada": 2, "rosto_aberto": 2, "movimento": 1},
    "redondo": {"topo": 3, "linha_diagonal": 3, "assimetria": 2, "laterais_limpas": 2, "volume_lateral": -2},
    "quadrado": {"movimento": 3, "assimetria": 2, "altura_moderada": 1, "linha_reta": -1},
    "oblongo": {"volume_lateral": 3, "franja": 2, "altura_moderada": 2, "topo": -3},
    "coracao": {"volume_queixo": 3, "cobertura_temporas": 2, "altura_moderada": 1, "topo": -2},
    "diamante": {"cobertura_temporas": 3, "volume_queixo": 2, "assimetria": 2, "altura_moderada": 1},
    "triangular": {"cobertura_temporas": 3, "topo": 2, "franja": 2, "volume_queixo": -2},
}


def ranquear(*, apresentacao, textura, comprimento, formato, manutencao="media",
             densidade="", franja="", estilo="", objetivo="discreta", estetica="", usar_regua=False):
    pesos = EFEITOS_POR_ROSTO.get(formato, {})
    opcoes = []
    for corte in CATALOGO:
        grupos = corte["apresentacoes"].split(";")
        referencias = grupos if apresentacao == "ambos" else [grupo for grupo in grupos if grupo == apresentacao]
        comprimentos = {grupo: corte[f"comprimento_{grupo}"] for grupo in referencias}
        if usar_regua:
            referencias = [grupo for grupo in referencias if comprimentos[grupo] == comprimento]
        elif corte["comprimento"] != comprimento:
            continue
        if not referencias or textura not in corte["texturas"].split(";"):
            continue

        efeitos = corte["efeitos"].split(";")
        if franja == "sem" and "franja" in efeitos:
            continue
        if franja == "com" and "franja" not in efeitos:
            continue
        afinidade = sum(pesos.get(efeito, 0) for efeito in efeitos)
        demanda = MANUTENCAO[corte["manutencao"]]
        disponibilidade = MANUTENCAO[manutencao]
        excesso = max(0, demanda - disponibilidade)
        esteticas = [codigo for codigo in corte.get("esteticas", "").split(";") if codigo]
        combina_estetica = estetica in esteticas
        pontuacao = afinidade + 7 * combina_estetica - 3 * excesso
        pontuacao += int(apresentacao != "ambos" and len(grupos) == 1)
        pontuacao += int(len(corte["texturas"].split(";")) < 4)
        pontuacao += 2 if densidade and densidade in corte["densidades"].split(";") else 0
        pontuacao += 3 if estilo == corte["estilo"] else 0
        pontuacao += int(objetivo == "marcante" and corte["estilo"] == "marcante")
        pontuacao += int(objetivo == "discreta" and corte["estilo"] == "classico")

        positivos = sorted((e for e in efeitos if pesos.get(e, 0) > 0), key=pesos.get, reverse=True)
        motivo = ", ".join(EFEITOS[e] for e in positivos[:2] or efeitos[:2])
        observacoes = []
        if excesso:
            observacoes.append("Pode exigir mais manutenção do que você prefere.")
        resultado = {
            "id": corte["id"], "nome": corte["nome"], "motivo": motivo,
            "apresentacoes": referencias, "efeitos": efeitos,
            "como_pedir": corte["como_pedir"], "manutencao": corte["manutencao"],
            "estilo": ESTILOS[corte["estilo"]], "observacoes": observacoes,
            "esteticas": [PERFIS[codigo][0] for codigo in esteticas],
            "combina_estetica": combina_estetica,
            "fontes": [FONTES[id] for id in corte["fontes"].split(";")],
        }
        opcoes.append((pontuacao, afinidade, excesso, resultado))

    opcoes.sort(key=lambda item: (-item[0], -item[1], item[2], item[3]["id"]))
    return [resultado for *_, resultado in opcoes[:10]]
