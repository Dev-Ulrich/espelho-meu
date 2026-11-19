from pathlib import Path

RAIZ = Path(__file__).resolve().parent
ALVO = "recomendacao"

CAMPOS = {
    "cabelo": {
        "textura": ("liso", "ondulado", "cacheado", "crespo"),
        "comprimento": ("curto", "medio", "longo"),
        "manutencao": ("baixa", "media", "alta"),
    },
    "maquiagem": {
        "tipo_pele": ("seca", "mista", "oleosa"),
        "ocasiao": ("dia_a_dia", "trabalho", "evento"),
        "acabamento": ("natural", "matte", "luminoso"),
    },
}
