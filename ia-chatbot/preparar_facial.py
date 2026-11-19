"""Baixa o modelo oficial de pontos e treina o classificador experimental."""
import argparse
from hashlib import sha256
import json
from pathlib import Path
from tempfile import NamedTemporaryFile

import joblib
import pandas as pd
import requests
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict

from facial import ASSET, FEATURES, LABELS

ROOT = Path(__file__).resolve().parent
MODELO = ROOT / "modelos" / "formato_facial.joblib"
URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
HASH = "64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff"


def baixar():
    if ASSET.is_file() and sha256(ASSET.read_bytes()).hexdigest() == HASH:
        return
    print("Baixando Face Landmarker do Google…", flush=True)
    resposta = requests.get(URL, timeout=(10, 90))
    resposta.raise_for_status()
    if sha256(resposta.content).hexdigest() != HASH:
        raise ValueError("O arquivo Face Landmarker não corresponde ao SHA-256 esperado.")
    with NamedTemporaryFile(dir=ASSET.parent, delete=False) as arquivo:
        temporario = Path(arquivo.name)
        arquivo.write(resposta.content)
    temporario.replace(ASSET)


def treinar():
    dados = pd.read_csv(ROOT / "dados" / "formato_facial.csv", keep_default_na=False)
    x = dados[list(FEATURES)]
    y = dados["rotulo_provisorio"]
    if (dados["id"].duplicated().any() or dados["sha256_imagem"].duplicated().any()
            or set(y) != set(LABELS) or y.value_counts().min() < 5):
        raise ValueError("A base precisa ter amostras únicas e ao menos cinco exemplos por classe.")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    base = cross_val_predict(DummyClassifier(strategy="most_frequent"), x, y, cv=cv)
    modelo = RandomForestClassifier(n_estimators=200, max_depth=4, min_samples_leaf=2, random_state=42)
    pred = cross_val_predict(modelo, x, y, cv=cv)
    revisadas = dados["hipotese_arthur"].ne("")
    resumo = {
        "amostras": len(dados),
        "concordancia_rotulos_provisorios": accuracy_score(y, pred),
        "f1_macro_rotulos_provisorios": f1_score(y, pred, average="macro"),
        "baseline": accuracy_score(y, base),
        "hipoteses_humanas_comparaveis": int(revisadas.sum()),
        "previsoes_coincidentes_com_arthur": int((pred[revisadas] == dados.loc[revisadas, "hipotese_arthur"]).sum()),
    }
    modelo.fit(x, y)
    with NamedTemporaryFile(dir=MODELO.parent, delete=False) as arquivo:
        temporario = Path(arquivo.name)
    try:
        joblib.dump(modelo, temporario)
        temporario.replace(MODELO)
    finally:
        temporario.unlink(missing_ok=True)
    (MODELO.parent / "avaliacao_facial.json").write_text(json.dumps(resumo, indent=2) + "\n")
    print(json.dumps(resumo, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--somente-treino", action="store_true", help="Treina a partir das medidas já extraídas.")
    args = parser.parse_args()
    treinar()
    if not args.somente_treino:
        baixar()
