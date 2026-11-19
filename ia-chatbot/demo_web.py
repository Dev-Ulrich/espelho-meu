"""Consulta local que combina foto e preferências para testar os modelos."""
import json
from pathlib import Path

import joblib
import pandas as pd
from flask import jsonify, render_template, request, send_from_directory

from configuracao import CAMPOS
from cortes import ranquear
from consulta import PERGUNTAS, CABELO, MAQUIAGEM, COMUNS, FINAL_MAKE, FINAL, validar
import recomendacao_consulta as consultoria
from facial import FEATURES, LABELS, MAX_FOTO, extrair

ARQUIVOS = Path(__file__).resolve().parent / "demo"
ROTULOS = {
    "textura": ("Textura atual", ("Liso", "Ondulado", "Cacheado", "Crespo")),
    "comprimento": ("Comprimento desejado", ("Curto", "Médio", "Longo")),
    "manutencao": ("Tempo para manutenção", ("Baixo", "Moderado", "Alto")),
    "tipo_pele": ("Tipo de pele", ("Seca", "Mista", "Oleosa")),
    "ocasiao": ("Ocasião", ("Dia a dia", "Trabalho", "Evento")),
    "acabamento": ("Acabamento desejado", ("Natural", "Matte", "Luminoso")),
}
PADROES_CORTES = {"apresentacao": "ambos", "densidade": "", "franja": "", "estilo_corte": "", "formato_manual": ""}
OPCOES = {
    "apresentacao": ("Estilo de referência", {"masculino": "Masculino", "feminino": "Feminino", "ambos": "Ver ambos"}),
    "densidade": ("Densidade aparente", {"fina": "Baixa", "media": "Média", "alta": "Alta"}),
    "franja": ("Preferência de franja", {"com": "Com franja", "sem": "Sem franja"}),
    "estilo_corte": ("Estética preferida", {"classico": "Clássica", "moderno": "Moderna", "marcante": "Marcante"}),
    "formato_manual": ("Formato facial para o ranking", LABELS),
    "objetivo": ("Mudança desejada", {"discreta": "Discreta", "marcante": "Marcante"}),
    "penteado": ("Preferência de penteado", {"solto": "Solto", "preso": "Preso", "semipreso": "Semipreso"}),
    "cor": ("Preferência de coloração", {"manter": "Manter a cor atual", "quente": "Reflexos quentes", "fria": "Reflexos frios", "fantasia": "Cor fantasia"}),
    "tom": ("Tom de pele autodeclarado", {"claro": "Claro", "medio": "Médio", "escuro": "Escuro"}),
    "subtom": ("Subtom autodeclarado", {"quente": "Quente", "frio": "Frio", "neutro": "Neutro", "oliva": "Oliva"}),
}
DICAS_ROSTO = {
    "oval": "Experimente uma risca central ou lateral e compare o enquadramento.",
    "redondo": "Compare mais volume no topo com volume nas laterais.",
    "quadrado": "Compare camadas suaves perto da mandíbula com uma base reta.",
    "oblongo": "Compare movimento nas laterais com uma finalização mais vertical.",
    "coracao": "Experimente movimento perto do queixo e compare o volume no topo.",
    "diamante": "Compare uma risca lateral com mechas que contornam as maçãs.",
    "triangular": "Compare um pouco de volume no topo com uma finalização mais assentada.",
}
DICAS_MAQUIAGEM = {
    "natural": "Aplique uma camada fina de base e use corretivo só nas regiões desejadas.",
    "matte": "Aplique pó aos poucos nas áreas de brilho, ajustando a quantidade à pele.",
    "luminoso": "Use iluminador gradualmente nas áreas que deseja destacar.",
}
DICAS_PELE = {
    "seca": "Prepare a pele com hidratação e use pouco pó.",
    "mista": "Observe se a zona T precisa de mais pó do que as bochechas.",
    "oleosa": "Finalize as áreas de maior brilho com uma camada leve de pó.",
}
PENTEADOS = {
    "curto": {"solto": "Modelado solto com textura", "preso": "Laterais presas com grampos", "semipreso": "Mechas da frente presas"},
    "medio": {"solto": "Solto com risca lateral", "preso": "Coque baixo, se o comprimento permitir", "semipreso": "Semipreso com torção"},
    "longo": {"solto": "Solto com movimento", "preso": "Rabo baixo ou coque baixo", "semipreso": "Semipreso com mechas frontais soltas"},
}
CORES = {
    "manter": "Preserve a cor atual e experimente outra finalização.",
    "quente": "Compare reflexos caramelo ou acobreados com a cor atual.",
    "fria": "Compare reflexos acinzentados ou perolados com a cor atual.",
    "fantasia": "Experimente primeiro uma mecha temporária na cor escolhida.",
}


def combinar(perfil, extras, formato, prever):
    maquiagem = prever("maquiagem", perfil)
    cortes = ranquear(
        apresentacao=extras["apresentacao"], textura=perfil["textura"], comprimento=perfil["comprimento"],
        formato=formato, manutencao=perfil["manutencao"], densidade=extras["densidade"],
        franja=extras["franja"], estilo=extras["estilo_corte"], objetivo=extras["objetivo"],
    )
    respostas = {
        campo: dict(zip(valores, ROTULOS[campo][1], strict=True))[perfil[campo]].lower()
        for campos in CAMPOS.values() for campo, valores in campos.items()
    }
    acabamento_indicado = {
        "maquiagem natural": "natural", "maquiagem matte": "matte", "maquiagem luminosa": "luminoso",
    }.get(maquiagem, perfil["acabamento"])
    tom = extras["tom"]
    subtom = extras["subtom"]
    tons = []
    if tom:
        tons.append("Tom " + OPCOES["tom"][1][tom].lower())
    if subtom:
        tons.append("subtom " + OPCOES["subtom"][1][subtom].lower())
    dica_tom = (", ".join(tons) + ". Teste base e corretivo no rosto sob luz natural."
                if tons else "Compare as tonalidades na pele sob luz natural.")
    return {
        "cabelo": {
            "recomendacao": cortes[0]["nome"] if cortes else "Nenhum corte atende aos filtros.",
            "cortes": cortes,
            "entradas": f"Referência: {OPCOES['apresentacao'][1][extras['apresentacao']].lower()}. Textura {respostas['textura']}, comprimento {respostas['comprimento']} e manutenção em nível {respostas['manutencao']}.",
            "formato_dica": DICAS_ROSTO[formato],
            "penteado": PENTEADOS[perfil["comprimento"]][extras["penteado"]],
            "coloracao": CORES[extras["cor"]],
            "mudanca": ("Experimente primeiro uma mudança de finalização ou de camadas."
                        if extras["objetivo"] == "discreta" else "Compare uma mudança mais visível de comprimento, volume ou cor."),
        },
        "maquiagem": {
            "recomendacao": maquiagem,
            "entradas": f"Pele {respostas['tipo_pele']}, ocasião {respostas['ocasiao']} e acabamento {respostas['acabamento']}.",
            "aplicacao": DICAS_MAQUIAGEM[acabamento_indicado],
            "pele_dica": DICAS_PELE[perfil["tipo_pele"]],
            "tom_dica": dica_tom,
        },
    }


def instalar_demo(app, modelos, pasta_modelos, prever):
    arquivo_facial = pasta_modelos / "formato_facial.joblib"
    facial = joblib.load(arquivo_facial) if arquivo_facial.is_file() else None

    @app.get("/demo")
    def demo():
        return render_template("index.html", questionario={
            "inicio": PERGUNTAS, "cabelo": CABELO, "maquiagem": MAQUIAGEM,
            "comuns": COMUNS, "final_make": FINAL_MAKE, "final": FINAL,
        })

    @app.get("/demo-assets/<path:nome>")
    def demo_asset(nome):
        return send_from_directory(ARQUIVOS, nome)

    @app.post("/api/demo/analisar")
    def analisar():
        request.max_content_length = MAX_FOTO + 64 * 1024
        foto = request.files.get("foto")
        respostas_json = request.form.get("respostas")
        if respostas_json is not None:
            try:
                respostas = validar(json.loads(respostas_json))
            except ValueError as erro:
                return jsonify(erro=str(erro)), 422
            return analisar_consulta(respostas, foto)

        if "maquiagem" not in modelos:
            return jsonify(erro="O modelo de maquiagem não está carregado."), 503
        campos = {campo: aceitos for area in CAMPOS.values() for campo, aceitos in area.items()}
        perfil = {campo: request.form.get(campo) for campo in campos}
        extras = {campo: request.form.get(campo, PADROES_CORTES.get(campo, "")) for campo in OPCOES}
        invalidos = [ROTULOS[campo][0] for campo, aceitos in campos.items() if perfil[campo] not in aceitos]
        opcionais = {"tom", "subtom", "densidade", "franja", "estilo_corte", "formato_manual"}
        invalidos += [
            rotulo for campo, (rotulo, aceitos) in OPCOES.items()
            if extras[campo] not in aceitos and (campo not in opcionais or extras[campo])
        ]
        if invalidos:
            return jsonify(erro="Revise as respostas de " + ", ".join(invalidos) + "."), 422

        manual = extras["formato_manual"]
        if not foto and not manual:
            return jsonify(erro="Envie uma foto ou selecione o formato facial no questionário."), 422

        medidas, contorno, avisos = {}, [], []
        detectado = ""
        if foto:
            if facial is None:
                return jsonify(erro="Rode python preparar_facial.py e reinicie o Flask para analisar fotos."), 503
            try:
                medidas, contorno, avisos = extrair(foto.stream)
            except ValueError as erro:
                return jsonify(erro=str(erro)), 422
            except RuntimeError as erro:
                return jsonify(erro=str(erro)), 503
            detectado = str(facial.predict(pd.DataFrame([medidas], columns=FEATURES))[0])

        formato = manual or detectado
        resposta = combinar(perfil, extras, formato, prever)
        resposta["facial"] = {
            "formato": LABELS[formato], "origem": "manual" if manual else "foto",
            "detectado": LABELS.get(detectado), "medidas": medidas, "contorno": contorno, "avisos": avisos,
        }
        return jsonify(resposta)

    @app.get("/api/privado/cabelo/questionario")
    def questionario_capilar():
        perguntas = [*CABELO, *COMUNS, *FINAL]
        return jsonify(perguntas=[
            {**p, "opcoes": list(p["opcoes"].items())} for p in perguntas
        ])

    @app.post("/api/privado/cabelo/analisar")
    def analisar_capilar():
        request.max_content_length = MAX_FOTO + 64 * 1024
        try:
            respostas = json.loads(request.form.get("respostas", ""))
            if not isinstance(respostas, dict):
                raise ValueError("Envie as respostas do questionário.")
            respostas = validar({**respostas, "jornada": "cabelo"})
        except ValueError as erro:
            return jsonify(erro=str(erro)), 422
        return analisar_consulta(respostas, request.files.get("foto"))

    def analisar_consulta(respostas, foto):
        manual = respostas.get("formato_manual")
        if manual == "foto" and not foto:
            return jsonify(erro="Adicione uma foto ou escolha outro modo de definir o formato facial."), 422
        medidas, contorno, avisos = {}, [], []
        detectado = None
        if manual == "foto":
            if facial is None:
                return jsonify(erro="Rode python preparar_facial.py e reinicie o Flask para analisar fotos."), 503
            try:
                medidas, contorno, avisos = extrair(foto.stream)
            except ValueError as erro:
                return jsonify(erro=str(erro)), 422
            except RuntimeError as erro:
                return jsonify(erro=str(erro)), 503
            detectado = str(facial.predict(pd.DataFrame([medidas], columns=FEATURES))[0])

        formato = detectado if manual == "foto" else manual
        resposta = {"facial": {
            "formato": LABELS.get(formato), "origem": "foto" if detectado else "manual",
            "detectado": LABELS.get(detectado), "medidas": medidas, "contorno": contorno, "avisos": avisos,
            "dica": DICAS_ROSTO.get(formato),
        }}
        if respostas["jornada"] in ("cabelo", "ambos"):
            resposta["cabelo"] = consultoria.cabelo(respostas, formato)
        if respostas["jornada"] in ("maquiagem", "ambos"):
            modelo = prever if "maquiagem" in modelos else None
            resposta["maquiagem"] = consultoria.maquiagem(respostas, modelo, DICAS_MAQUIAGEM, DICAS_PELE)
        return jsonify(resposta)
