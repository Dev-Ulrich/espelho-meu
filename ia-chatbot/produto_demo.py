"""Cadastro supervisionado na API Java configurada para a demonstração."""
from hmac import compare_digest
from os import environ
from urllib.parse import urlsplit

import requests
from flask import jsonify, request

CAMPOS = {"categoria", "nome", "marca", "categoriaPrincipal", "precoReferencia", "avaliacao", "cor", "data"}


def instalar_produto_demo(app):
    base = environ.get("PRODUTO_DEMO_API_URL", "").strip().rstrip("/")
    url = urlsplit(base)
    codigo = environ.get("PRODUTO_DEMO_CODIGO", "").strip().encode("utf-8")
    ativo = bool(len(codigo) >= 24 and url.scheme == "https" and url.hostname
                 and not (url.username or url.password or url.query or url.fragment))

    @app.get("/api/produtos-demo/status")
    def status_produto_demo():
        return jsonify(disponivel=ativo)

    @app.post("/api/produtos-demo/cadastro")
    def cadastrar_produto_demo():
        if not ativo:
            return jsonify(erro="Cadastro de demonstração indisponível."), 503
        recebido = request.headers.get("X-Produto-Demo-Codigo", "").encode("utf-8")
        if not compare_digest(recebido, codigo):
            return jsonify(erro="Código de demonstração inválido."), 403

        request.max_content_length = 8192
        dados = request.get_json(silent=True)
        if not isinstance(dados, dict) or dados.keys() - CAMPOS:
            return jsonify(erro="Dados do produto inválidos."), 422

        endpoint = f"{base}/produto"
        try:
            resposta = requests.post(endpoint, json=dados, timeout=(5, 35), allow_redirects=False)
            if resposta.status_code in (400, 409, 422):
                return jsonify(erro="A API Java rejeitou os dados do produto."), resposta.status_code
            if resposta.status_code != 201:
                return jsonify(erro="Não foi possível confirmar o cadastro na API Java. Confira a lista antes de reenviar."), 502
            produto = resposta.json()
            produto_id = produto.get("id") if isinstance(produto, dict) else None
            if type(produto_id) is not int or produto_id < 1:
                return jsonify(erro="A API retornou HTTP 201 sem um ID utilizável. Confira a lista antes de reenviar."), 502
        except (requests.RequestException, ValueError):
            return jsonify(erro="Não foi possível confirmar o cadastro. Confira a lista antes de reenviar."), 502

        confirmado = False
        try:
            busca = requests.get(f"{endpoint}/{produto_id}", timeout=(5, 12), allow_redirects=False)
            if busca.status_code == 200:
                registro = busca.json()
                confirmado = isinstance(registro, dict) and registro.get("id") == produto_id
        except (requests.RequestException, ValueError):
            app.logger.warning("Falha ao confirmar a leitura do produto de demonstração %d.", produto_id)
        return jsonify(produto=produto, confirmado=confirmado), 201
