import json
from pathlib import Path
from tempfile import NamedTemporaryFile

import joblib
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeClassifier

from configuracao import ALVO, CAMPOS, RAIZ


def carregar_dados(area, pasta_dados=RAIZ / "dados"):
    campos = CAMPOS[area]
    arquivo = pasta_dados / f"{area}.csv"
    dados = pd.read_csv(arquivo, dtype=str)
    dados = dados.loc[:, [*campos, ALVO]].drop_duplicates().reset_index(drop=True)
    if dados.isna().any().any() or dados[ALVO].str.strip().eq("").any():
        raise ValueError(f"{arquivo.name} contém campos vazios.")
    for campo, opcoes in campos.items():
        if not dados[campo].isin(opcoes).all():
            raise ValueError(f"{arquivo.name} contém valores desconhecidos em {campo}.")
    if dados.duplicated(subset=list(campos)).any():
        raise ValueError(f"{arquivo.name} tem rótulos diferentes para um mesmo perfil.")
    return dados


def treinar(area, pasta_dados=RAIZ / "dados", pasta_modelos=RAIZ / "modelos"):
    dados = carregar_dados(area, pasta_dados)
    entradas = dados[list(CAMPOS[area])]
    rotulos = dados[ALVO]
    contagens = rotulos.value_counts()
    if len(contagens) < 2 or contagens.min() < 4:
        raise ValueError(f"{area} precisa de pelo menos duas classes e quatro perfis por classe.")

    x_treino, x_teste, y_treino, y_teste = train_test_split(
        entradas, rotulos, test_size=0.25, random_state=42, stratify=rotulos
    )
    modelo = make_pipeline(
        OneHotEncoder(categories=list(CAMPOS[area].values())),
        DecisionTreeClassifier(max_depth=4, random_state=42),
    )
    baseline = DummyClassifier(strategy="most_frequent")
    modelo.fit(x_treino, y_treino)
    baseline.fit(x_treino, y_treino)
    previsoes = modelo.predict(x_teste)
    metricas = {
        "treino": len(x_treino),
        "teste": len(x_teste),
        "acuracia": accuracy_score(y_teste, previsoes),
        "f1_macro": f1_score(y_teste, previsoes, average="macro"),
        "acuracia_baseline": accuracy_score(y_teste, baseline.predict(x_teste)),
        "por_classe": classification_report(y_teste, previsoes, output_dict=True, zero_division=0),
    }
    pasta_modelos.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(dir=pasta_modelos, delete=False) as temporario:
        caminho_temporario = Path(temporario.name)
    try:
        joblib.dump(modelo, caminho_temporario)
        caminho_temporario.replace(pasta_modelos / f"{area}.joblib")
    finally:
        caminho_temporario.unlink(missing_ok=True)
    return metricas


if __name__ == "__main__":
    for area in CAMPOS:
        print(json.dumps({area: treinar(area)}, ensure_ascii=False, indent=2))
