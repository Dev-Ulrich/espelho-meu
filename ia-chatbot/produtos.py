"""Seleção do catálogo editorial de produtos da demo."""
import csv
from decimal import Decimal

from configuracao import RAIZ

with (RAIZ / "dados" / "produtos.csv").open(encoding="utf-8", newline="") as arquivo:
    CATALOGO = tuple(csv.DictReader(arquivo))

CABELO_CATEGORIAS = {
    "cabelo": "Finalização", "lavagem": "Lavagem e condicionamento",
    "tratamento": "Tratamento", "protecao": "Proteção térmica",
}

FORMATOS = {
    "liquido": "Líquido", "bastao": "Em bastão", "compacto": "Compacto",
    "solto": "Solto", "oleo": "Óleo finalizador", "mousse": "Mousse",
    "creme": "Creme para pentear", "gelatina": "Gelatina capilar",
    "kit_lavagem": "Kit de shampoo e condicionador", "condicionador": "Condicionador",
    "mascara": "Máscara capilar", "kit_tratamento": "Kit com máscara",
    "spray_termico": "Kit com protetor térmico", "spray": "Spray protetor térmico",
}
ACABAMENTOS = {"matte": "Matte", "natural": "Natural", "luminoso": "Luminoso", "semimatte": "Semimatte"}
COBERTURAS = {"baixa": "Leve", "media": "Média", "alta": "Alta"}


def faixa(preco):
    if not preco:
        return None
    valor = Decimal(preco)
    if valor <= 45:
        return "economico"
    return "intermediario" if valor <= 110 else "premium"


def pontuar(produto, respostas):
    if produto["categoria"] == "cabelo":
        leve = respostas["espessura"] == "fino" or respostas["volume"] == "baixo"
        preferidos = ("mousse", "oleo") if leve else ("creme", "gelatina")
        return 2 * (produto["formato"] in preferidos)
    if produto["categoria"] in CABELO_CATEGORIAS:
        return 0
    acabamento = respostas["acabamento"]
    acabamentos = produto["acabamentos"].split(";")
    compativel = acabamento in acabamentos or (acabamento == "matte" and "semimatte" in acabamentos)
    cobertura = respostas["cobertura"] in produto["coberturas"].split(";")
    pele = respostas["tipo_pele"]
    adequado = (pele == "oleosa" and "matte" in acabamentos) or (
        pele == "seca" and any(item in acabamentos for item in ("natural", "luminoso"))
    )
    return 4 * compativel + 2 * cobertura + adequado


def selecionar(respostas, categoria):
    formato = respostas.get(f"formato_{categoria}", "qualquer")
    cor = respostas.get("cor_po", "qualquer") if categoria == "po" else "qualquer"
    orcamento = respostas["orcamento"]
    selos = set(respostas["selos"])
    candidatos = []
    for produto in CATALOGO:
        if produto["categoria"] != categoria:
            continue
        if categoria in CABELO_CATEGORIAS and respostas["textura"] not in produto["texturas"].split(";"):
            continue
        ajustes = []
        pendentes = not selos.issubset(produto["selos"].split(";"))
        if pendentes:
            ajustes.append("Selos solicitados não confirmados na fonte")
        if formato != "qualquer" and produto["formato"] != formato:
            ajustes.append("Outro formato")
        if cor != "qualquer" and produto["cor"] != cor:
            ajustes.append("Outro tipo de pó")
        if orcamento != "todos" and faixa(produto["preco"]) != orcamento:
            ajustes.append("Fora da faixa selecionada" if produto["preco"] else "Preço a confirmar")
        candidatos.append((produto, ajustes, pendentes))

    candidatos.sort(key=lambda item: (item[2], len(item[1]), -pontuar(item[0], respostas)))
    exatos = [item for item in candidatos if not item[1]]
    return [apresentar(p, ajustes) for p, ajustes, _ in (exatos or candidatos)[:3]]


def apresentar(produto, ajustes):
    return {
        "nome": produto["nome"], "url": produto["url"], "ajustes": ajustes,
        "preco": f"R$ {produto['preco'].replace('.', ',')}" if produto["preco"] else None,
        "atributos": [
            FORMATOS[produto["formato"]],
            *[ACABAMENTOS[v] for v in produto["acabamentos"].split(";") if v],
            *["Cobertura " + COBERTURAS[v].lower() for v in produto["coberturas"].split(";") if v],
            *({"colorido": ["Com cor"], "translucido": ["Translúcido"]}.get(produto["cor"], [])),
        ],
    }
