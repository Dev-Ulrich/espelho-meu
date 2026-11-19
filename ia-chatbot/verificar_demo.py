"""Verifica os modelos pré-treinados e o contrato da API, sem abrir porta."""
import json
from base64 import b64encode
from io import BytesIO
from itertools import product
from unittest.mock import Mock, patch

import requests

from PIL import Image

from app import create_app
from configuracao import CAMPOS
from consulta import caminho

CASOS_DEMO = {
    "cabelo": (("cacheado", "longo", "media"), "camadas longas"),
    "maquiagem": (("mista", "trabalho", "natural"), "maquiagem natural"),
}


def main():
    with create_app(modo_teste=True).test_client() as client:
        resposta = client.get("/api/saude")
        esperado = {"modelos": {area: True for area in CAMPOS}}
        if resposta.status_code != 200 or resposta.get_json() != esperado:
            raise SystemExit(f"Falha ao carregar modelos: {resposta.status_code} {resposta.get_json()}")
        print("Saúde HTTP 200: os dois modelos estão carregados.")

        for area, campos in CAMPOS.items():
            rota = f"/api/recomendacoes/{area}"
            valores_demo, resultado_demo = CASOS_DEMO[area]
            quantidade = 0
            for valores in product(*campos.values()):
                perfil = dict(zip(campos, valores, strict=True))
                resposta = client.post(rota, json=perfil)
                resultado = resposta.get_json() or {}
                recomendacao = resultado.get("recomendacao")
                if (resposta.status_code != 200 or resultado.get("area") != area
                        or not isinstance(recomendacao, str) or not recomendacao.strip()):
                    raise SystemExit(f"Falha em {rota}, perfil {perfil}: HTTP {resposta.status_code} {resultado}")
                if valores == valores_demo and recomendacao != resultado_demo:
                    raise SystemExit(f"Demo {area}: esperado {resultado_demo!r}, recebido {recomendacao!r}")
                quantidade += 1

            invalida = client.post(rota, json={})
            if invalida.status_code != 422:
                raise SystemExit(f"{rota}: corpo vazio deveria retornar HTTP 422.")
            print(f"{area}: {quantidade} perfis atendidos, demo = {resultado_demo!r}, corpo vazio = HTTP 422.")

    chave = "chave-interna-apenas-para-teste-automatizado"
    with patch.dict("os.environ", {"ESPELHO_IA_INTERNAL_KEY": chave}):
        app = create_app()
    with app.test_client() as client:
        headers = {"X-Espelho-Internal-Key": chave}
        for area in CAMPOS:
            rota = f"/api/privado/{area}"
            assert client.get(f"{rota}/questionario").status_code == 403
            questionario = client.get(f"{rota}/questionario", headers=headers)
            assert questionario.status_code == 200
            respostas = {"jornada": area}
            for pergunta in caminho(respostas):
                preencher(respostas, pergunta)
            for pergunta in caminho(respostas):
                preencher(respostas, pergunta)
            respostas.pop("jornada")
            analise = client.post(f"{rota}/analisar", headers=headers, data={"respostas": json.dumps(respostas)})
            assert analise.status_code == 200, analise.get_json()
            assert area in analise.get_json()
            print(f"Consultoria privada de {area}: acesso público bloqueado e análise autenticada aprovada.")
        respostas = {
            "jornada": "cabelo", "quer_cor": "sim", "tecnica_cor": "global",
            "cor": "fantasia", "base_cor": "escura", "subtom": "frio",
        }
        for _ in range(2):
            for pergunta in caminho(respostas):
                preencher(respostas, pergunta)
        analise = client.post("/api/privado/cabelo/analisar", headers=headers,
            data={"respostas": json.dumps(respostas)})
        assert analise.status_code == 200, analise.get_json()
        assert analise.get_json()["cabelo"]["opcoes_cor"] == [
            {"id": "cor-1", "nome": "Violeta", "tecnica": "Coloração global"},
            {"id": "cor-2", "nome": "Rosa framboesa", "tecnica": "Coloração global"},
        ]
        respostas["quer_cor"] = "nao"
        analise = client.post("/api/privado/cabelo/analisar", headers=headers,
            data={"respostas": json.dumps(respostas)})
        assert analise.status_code == 200, analise.get_json()
        assert analise.get_json()["cabelo"]["opcoes_cor"] == []
        assert client.get("/api/privado/edicoes-consulta/status").status_code == 403
        assert client.get("/api/privado/edicoes-consulta/status", headers=headers).status_code == 200

    verificar_simulacao(chave)
    verificar_foto(chave)


def verificar_foto(chave):
    """Exercita o MediaPipe real: importar o pacote não valida suas bibliotecas nativas."""
    with patch.dict("os.environ", {"ESPELHO_IA_INTERNAL_KEY": chave}):
        app = create_app()
    respostas = {"jornada": "cabelo", "formato_manual": "foto"}
    for _ in range(2):
        for pergunta in caminho(respostas):
            preencher(respostas, pergunta)
    respostas.pop("jornada")
    foto = BytesIO()
    Image.new("RGB", (256, 256), "white").save(foto, format="JPEG")
    foto.seek(0)
    with app.test_client() as client:
        resposta = client.post("/api/privado/cabelo/analisar",
            headers={"X-Espelho-Internal-Key": chave},
            data={"respostas": json.dumps(respostas), "foto": (foto, "sem-rosto.jpg")})
    esperado = "Nenhum rosto detectado. Use uma foto frontal e com boa iluminação."
    if resposta.status_code != 422 or resposta.get_json().get("erro") != esperado:
        raise SystemExit(f"Análise facial indisponível: HTTP {resposta.status_code} {resposta.get_json()}")
    print("Upload privado: detector facial real iniciou e rejeitou corretamente imagem sem rosto.")


def verificar_simulacao(chave):
    with patch.dict("os.environ", {"ESPELHO_IA_INTERNAL_KEY": chave, "OPENAI_API_KEY": "credencial-ficticia",
                                  "SIMULACAO_CODIGO": "", "ESPELHO_DEMO_LOCAL": "0",
                                  "OPENAI_IMAGE_MODEL": "gpt-image-2.6-sunburst"}):
        app = create_app()

    origem = BytesIO()
    Image.new("RGB", (640, 960)).save(origem, format="PNG")
    entrada = origem.getvalue()
    resultado = BytesIO()
    Image.new("RGB", (16, 16)).save(resultado, format="JPEG")
    jpeg = resultado.getvalue()
    provedor = Mock()
    provedor.json.return_value = {"data": [{"b64_json": b64encode(jpeg).decode()}]}
    headers = {"X-Espelho-Internal-Key": chave}

    def enviar(client, area, estilo, chave_headers=headers, foto=entrada):
        return client.post(f"/api/privado/edicoes-consulta/{area}", headers=chave_headers,
                           data={"estilo": estilo, "foto": (BytesIO(foto), "teste.png")})

    with app.test_client() as client, patch("simulacao.requests.post", return_value=provedor) as editar:
        assert client.get("/api/privado/edicoes-consulta/status", headers=headers).get_json()["disponivel"]
        assert enviar(client, "cabelo", "Coque", {}).status_code == 403
        assert client.post("/api/simulacoes/cabelo").status_code == 404
        invalida = enviar(client, "cabelo", "Coque", foto=b"invalida")
        assert invalida.status_code == 422 and invalida.headers["X-Espelho-Edit-Status"] == "not-processed"
        editar.assert_not_called()

        assert enviar(client, "cabelo", "Coque com textura").data == jpeg
        assert enviar(client, "maquiagem", "Acabamento luminoso").data == jpeg
        rota_cor = "/api/privado/edicoes-cor-consulta"
        assert client.post(rota_cor).status_code == 403
        colorida = client.post(rota_cor, headers=headers,
            data={"estilo": "Violeta. Técnica de coloração: Luzes", "foto": (BytesIO(entrada), "teste.png")})
        assert colorida.status_code == 200 and colorida.data == jpeg
        cabelo, maquiagem, cor = editar.call_args_list
        prompt_cor = cor.kwargs["data"]["prompt"]
        assert "Violeta" in prompt_cor and "Luzes" in prompt_cor
        assert "Altere somente a cor dos fios" in prompt_cor
        assert "Preserve corte, penteado" in prompt_cor
        assert "Preserve a cor original" not in prompt_cor
        assert cabelo.args == ("https://api.openai.com/v1/images/edits",)
        instrucoes = cabelo.kwargs["data"]
        assert instrucoes["model"] == "gpt-image-2.6-sunburst"
        assert (instrucoes["size"], instrucoes["quality"], instrucoes["output_format"], instrucoes["n"]) == (
            "1024x1536", "low", "jpeg", 1)
        assert "cor original do cabelo" in instrucoes["prompt"]
        assert "tom natural da pele" in maquiagem.kwargs["data"]["prompt"]
        assert cabelo.kwargs["files"]["image[]"] == maquiagem.kwargs["files"]["image[]"]

        editar.side_effect = requests.ReadTimeout()
        incerta = enviar(client, "cabelo", "Coque")
        assert incerta.status_code == 504 and "X-Espelho-Edit-Status" not in incerta.headers
        editar.side_effect = requests.ConnectTimeout()
        recusada = enviar(client, "maquiagem", "Luminoso")
        assert recusada.status_code == 503 and recusada.headers["X-Espelho-Edit-Status"] == "not-processed"
    print("Simulação privada verificada com provedor de imagens simulado.")


def preencher(respostas, pergunta):
    opcoes = pergunta["opcoes"]
    valor = [] if pergunta["multipla"] else next(opcao for opcao in opcoes if opcao != "foto")
    respostas.setdefault(pergunta["id"], valor)


if __name__ == "__main__":
    main()
