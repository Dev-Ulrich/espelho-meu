"""Inicializador da demo local, usado no Windows e no Linux."""
import argparse
import webbrowser
from threading import Thread

from werkzeug.serving import make_server

from app import create_app
from facial import ASSET
from preparar_facial import baixar
from verificar_demo import main as verificar_api


def configurar():
    from mediapipe import tasks

    baixar()
    opcoes = tasks.vision.FaceLandmarkerOptions(
        base_options=tasks.BaseOptions(model_asset_path=str(ASSET)),
        num_faces=2,
    )
    with tasks.vision.FaceLandmarker.create_from_options(opcoes):
        print("Detector facial instalado e carregado.")
    verificar_api()
    with create_app().test_client() as client:
        perfil = {
            "apresentacao": "masculino", "textura": "cacheado", "comprimento": "longo",
            "manutencao": "media", "formato_manual": "oval", "objetivo": "discreta",
            "penteado": "solto", "cor": "manter", "tipo_pele": "mista",
            "ocasiao": "trabalho", "acabamento": "natural",
        }
        resposta = client.post("/api/demo/analisar", data=perfil)
        if resposta.status_code != 200 or len(resposta.json["cabelo"]["cortes"]) != 10:
            raise RuntimeError("Não foi possível verificar o ranking de cortes da demo.")
        if client.get("/demo").status_code != 200:
            raise RuntimeError("Não foi possível abrir a página da demo.")


def abrir():
    with make_server("127.0.0.1", 0, create_app(), threaded=True) as servidor:
        url = f"http://127.0.0.1:{servidor.server_port}/demo"
        print(f"Espelho Meu disponível em {url}", flush=True)
        print("Mantenha esta janela aberta. Para encerrar, pressione Ctrl+C.", flush=True)
        # O servidor deve aceitar conexões enquanto o navegador abre a página.
        navegador = Thread(target=abrir_navegador, args=(url,), daemon=True)
        navegador.start()
        servidor.serve_forever()


def abrir_navegador(url):
    try:
        if webbrowser.open(url):
            return
    except webbrowser.Error:
        pass
    print("Abra o endereço acima no navegador.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--configurar", action="store_true")
    args = parser.parse_args()
    if args.configurar:
        configurar()
    else:
        abrir()
