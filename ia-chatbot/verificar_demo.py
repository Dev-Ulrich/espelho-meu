"""Verifica os modelos pré-treinados e o contrato da API, sem abrir porta."""
from itertools import product

from app import create_app
from configuracao import CAMPOS

CASOS_DEMO = {
    "cabelo": (("cacheado", "longo", "media"), "camadas longas"),
    "maquiagem": (("mista", "trabalho", "natural"), "maquiagem natural"),
}


def main():
    with create_app().test_client() as client:
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


if __name__ == "__main__":
    main()
