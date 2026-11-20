from hmac import compare_digest
from os import environ
from pathlib import Path

import joblib
import pandas as pd
import requests
from flask import Flask, abort, jsonify, request, send_from_directory

from simulacao import MAX_FOTO, MODELO_PADRAO, editar_foto, preparar_foto

from alternativas import carregar_perfis, listar_alternativas
from configuracao import CAMPOS, RAIZ
from demo_web import instalar_demo
from cortes import NOMES_CORTES
from produto_demo import instalar_produto_demo


def create_app(pasta_modelos=RAIZ / "modelos", *, modo_teste=False):
    app = Flask(__name__, static_folder=None, template_folder="demo")
    pasta_front = Path(environ.get("ESPELHO_FRONT_DIST", RAIZ.parent / "front-end" / "dist")).resolve()
    chave_openai = environ.get("OPENAI_API_KEY", "").strip()
    codigo_demo = environ.get("SIMULACAO_CODIGO", "").strip()
    modelo_imagem = environ.get("OPENAI_IMAGE_MODEL", MODELO_PADRAO).strip() or MODELO_PADRAO
    origens_front = {
        origem.strip() for origem in environ.get(
            "ESPELHO_FRONT_ORIGINS", "https://espelho-meu-two.vercel.app"
        ).split(",") if origem.strip()
    }
    perfis = {area: carregar_perfis(area) for area in CAMPOS}
    modelos = {}
    for area in CAMPOS:
        arquivo = pasta_modelos / f"{area}.joblib"
        if arquivo.is_file():
            modelos[area] = joblib.load(arquivo)

    chave_interna = environ.get("ESPELHO_IA_INTERNAL_KEY", "").strip().encode("utf-8")
    demo_local = modo_teste or environ.get("ESPELHO_DEMO_LOCAL") == "1"

    @app.before_request
    def proteger_consultoria():
        caminho = request.path
        if caminho.startswith("/api/privado/"):
            chave = request.headers.get("X-Espelho-Internal-Key", "").encode("utf-8")
            if len(chave_interna) < 32 or not compare_digest(chave, chave_interna):
                return rejeitar_edicao("Acesso restrito.", 403)
        elif not demo_local and (
            request.endpoint == "inicio_demo" or caminho == "/demo"
            or caminho.startswith(("/api/demo/", "/api/recomendacoes/", "/recomendacoes/",
                                   "/api/simulacoes/", "/api/produtos-demo/"))
        ):
            return jsonify(erro="Acesse a consultoria pelo Espelho Meu."), 404

    @app.after_request
    def cors_front(resposta):
        if request.path.startswith(("/api/recomendacoes/", "/api/simulacoes/", "/api/produtos-demo/")):
            origem = request.headers.get("Origin")
            resposta.vary.add("Origin")
            if origem in origens_front:
                resposta.headers["Access-Control-Allow-Origin"] = origem
                resposta.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
                resposta.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Simulacao-Codigo, X-Produto-Demo-Codigo"
        return resposta

    def prever(area, dados):
        perfil = pd.DataFrame([dados], columns=list(CAMPOS[area]))
        return str(modelos[area].predict(perfil)[0])

    @app.get("/api/saude")
    @app.get("/saude")
    def saude():
        codigo = 200 if len(modelos) == len(CAMPOS) else 503
        return jsonify(modelos={area: area in modelos for area in CAMPOS}), codigo

    @app.post("/api/recomendacoes/<area>")
    @app.post("/recomendacoes/<area>")
    def recomendar(area):
        campos = CAMPOS.get(area)
        if campos is None:
            return jsonify(erro="Área desconhecida."), 404
        if not request.is_json:
            return jsonify(erro="Envie o corpo como application/json."), 415
        dados = request.get_json(silent=True)
        if not isinstance(dados, dict):
            return jsonify(erro="O corpo precisa ser um objeto JSON válido."), 400

        invalidos = {
            campo: opcoes for campo, opcoes in campos.items()
            if dados.get(campo) not in opcoes
        }
        extras = sorted(dados.keys() - campos.keys())
        if invalidos or extras:
            return jsonify(erro="Campos inválidos.", aceitos=invalidos, extras=extras), 422
        if area not in modelos:
            return jsonify(erro="Modelo indisponível. Execute python treinar.py e reinicie a API."), 503

        principal = prever(area, dados)
        return jsonify(
            area=area, recomendacao=principal,
            alternativas=listar_alternativas(area, dados, principal, perfis[area]),
        )

    def rejeitar_edicao(mensagem, status):
        return jsonify(erro=mensagem), status, {"X-Espelho-Edit-Status": "not-processed"}

    @app.get("/api/simulacoes/status")
    @app.get("/api/privado/edicoes-consulta/status")
    def status_simulacao():
        privada = request.path.startswith("/api/privado/")
        return jsonify(disponivel=bool(chave_openai and (privada or codigo_demo)))

    @app.post("/api/privado/edicoes-cor-consulta")
    def simular_cor():
        return simular("cabelo", colorir=True)

    @app.post("/api/simulacoes/<area>")
    @app.post("/api/privado/edicoes-consulta/<area>")
    def simular(area, *, colorir=False):
        privada = request.path.startswith("/api/privado/")
        if area not in CAMPOS:
            return rejeitar_edicao("Área desconhecida.", 404)
        if not chave_openai or (not privada and not (codigo_demo and area in modelos)):
            return rejeitar_edicao("A edição de fotos ainda não foi ativada neste servidor.", 503)

        if not privada:
            autorizado = request.headers.get("X-Simulacao-Codigo", "").encode("utf-8")
            if not compare_digest(autorizado, codigo_demo.encode("utf-8")):
                return rejeitar_edicao("Código de demonstração inválido.", 403)

        request.max_content_length = MAX_FOTO + 64 * 1024
        if request.mimetype != "multipart/form-data":
            return rejeitar_edicao("Envie a foto como multipart/form-data.", 415)
        estilo = request.form.get("estilo", "").strip()
        arquivo = request.files.get("foto")
        estilo_valido = bool(estilo) and len(estilo) <= 1000 and (
            privada or estilo in modelos[area].classes_ or (area == "cabelo" and estilo in NOMES_CORTES)
        )
        if not estilo_valido or not arquivo:
            return rejeitar_edicao("Selecione uma foto e uma sugestão válida.", 422)
        try:
            foto, tamanho = preparar_foto(arquivo.stream)
        except ValueError as erro:
            return rejeitar_edicao(str(erro), 422)

        try:
            imagem = editar_foto(foto, tamanho, area, estilo, chave_openai, modelo_imagem, colorir=colorir)
        except requests.ConnectTimeout:
            return rejeitar_edicao("O serviço de edição está temporariamente indisponível.", 503)
        except requests.Timeout:
            return jsonify(erro="A edição demorou e o resultado não pôde ser confirmado."), 504
        except (requests.RequestException, ValueError) as erro:
            provedor = getattr(erro, "response", None)
            status = provedor.status_code if provedor is not None else None
            app.logger.warning("Falha na edição de imagem: %s (HTTP %s)", type(erro).__name__, status)
            if status in (401, 403, 429):
                return rejeitar_edicao("O serviço de edição recusou a solicitação.", 503)
            return jsonify(erro="O serviço de edição não retornou uma imagem."), 502

        return app.response_class(imagem, mimetype="image/jpeg", headers={"Cache-Control": "no-store"})

    @app.errorhandler(413)
    def corpo_grande(_erro):
        if request.path.startswith("/api/produtos-demo/"):
            return jsonify(erro="O corpo do cadastro excede o limite de 8 KB."), 413
        return rejeitar_edicao("A foto deve ter até 5 MB.", 413)

    if (pasta_front / "index.html").is_file():
        @app.get("/", defaults={"caminho": ""})
        @app.get("/<path:caminho>")
        def front(caminho):
            if caminho.startswith(("api/", "assets/")):
                if caminho.startswith("assets/"):
                    return send_from_directory(pasta_front, caminho)
                abort(404)
            if caminho and (pasta_front / caminho).is_file():
                return send_from_directory(pasta_front, caminho)
            return send_from_directory(pasta_front, "index.html")

    instalar_produto_demo(app)
    instalar_demo(app, modelos, pasta_modelos, prever)
    if not (pasta_front / "index.html").is_file():
        app.add_url_rule("/", "inicio_demo", app.view_functions["demo"])

    return app
