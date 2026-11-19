"""Verifica os modelos pré-treinados e o contrato da API, sem abrir porta."""
import json
from io import BytesIO
from itertools import product
from unittest.mock import patch

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
        assert client.get("/api/privado/simulacoes/status").status_code == 403
        assert client.get("/api/privado/simulacoes/status", headers=headers).status_code == 200

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
    codigo = "codigo-de-teste-local"
    with patch.dict("os.environ", {"ESPELHO_IA_INTERNAL_KEY": chave,
                                  "OPENAI_API_KEY": "credencial-ficticia", "SIMULACAO_CODIGO": codigo}):
        app = create_app()
    with app.test_client() as client:
        headers = {"X-Espelho-Internal-Key": chave}
        assert client.get("/api/privado/simulacoes/status", headers=headers).get_json()["disponivel"]
        rota = "/api/privado/simulacoes/maquiagem"
        assert client.post(rota, headers=headers).status_code == 403
        foto = BytesIO()
        Image.new("RGB", (16, 16)).save(foto, format="JPEG")
        resultado = foto.getvalue()
        foto.seek(0)
        with patch("app.editar_foto", return_value=resultado) as editar:
            resposta = client.post(rota, headers={**headers, "X-Simulacao-Codigo": codigo},
                                    data={"estilo": "maquiagem natural", "foto": (foto, "teste.jpg")})
            editar.assert_called_once()
        assert resposta.status_code == 200 and resposta.mimetype == "image/jpeg"
        assert resposta.data == resultado
        print("Simulação protegida: código conferido e JPEG validado com provedor simulado.")


def preencher(respostas, pergunta):
    opcoes = pergunta["opcoes"]
    valor = [] if pergunta["multipla"] else next(opcao for opcao in opcoes if opcao != "foto")
    respostas.setdefault(pergunta["id"], valor)


if __name__ == "__main__":
    main()
