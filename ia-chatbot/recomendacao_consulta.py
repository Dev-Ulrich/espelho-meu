"""Recomendações da demo a partir das respostas ativas do questionário."""
from consulta import MAPA
from esteticas import ESTILOS_PENTEADO
from facial import LABELS
from cortes import ranquear
from produtos import CABELO_CATEGORIAS, selecionar

VOLUME_CATALOGO = {"baixo": "fina", "medio": "media", "alto": "alta"}
PENTEADOS = {
    "curto": {
        "solto": "Modele o topo acompanhando a queda natural dos fios.",
        "preso": "Prenda as laterais com grampos, se as mechas alcançarem.",
        "semipreso": "Prenda algumas mechas frontais, se houver comprimento.",
    },
    "medio": {
        "solto": "Experimente usar solto com risca lateral.",
        "preso": "Experimente um coque baixo, se as mechas mais curtas alcançarem.",
        "semipreso": "Faça um semipreso com torção suave nas laterais.",
    },
    "longo": {
        "solto": "Use solto e finalize as pontas para destacar o movimento.",
        "preso": "Experimente um rabo baixo ou coque baixo.",
        "semipreso": "Prenda a parte superior e deixe as mechas de contorno soltas.",
    },
}
PENTEADOS_RASPADOS = {"buzz", "burr", "twa"}
PALETAS = {
    "quente": {
        "quente": ("Cobre dourado", "Caramelo mel"),
        "frio": ("Castanho canela", "Caramelo suave"),
        "neutro": ("Castanho dourado", "Cobre suave"),
        "oliva": ("Castanho bronze", "Caramelo tostado"),
    },
    "fria": {
        "quente": ("Castanho frio suave", "Bege frio"),
        "frio": ("Castanho acinzentado", "Loiro perolado"),
        "neutro": ("Castanho frio", "Bege acinzentado"),
        "oliva": ("Chocolate frio", "Castanho acinzentado"),
    },
    "fantasia": {
        "quente": ("Coral", "Terracota rosado"),
        "frio": ("Violeta", "Rosa framboesa"),
        "neutro": ("Rosa malva", "Azul jeans"),
        "oliva": ("Verde petróleo", "Roxo ameixa"),
    },
}
FOTO_CORTE = {
    "degrade-medio": (0, 0, "Degradê com topo texturizado"),
    "chanel-bico": (1, 0, "Bob curto com risca lateral"),
    "bro-flow": (0, 1, "Cabelo médio com ondas e volume"),
    "longo-cascata": (1, 1, "Cabelo longo em camadas"),
    "butterfly-longo": (1, 1, "Camadas longas com moldura frontal"),
    "afro-medio-redondo": (1, 2, "Afro arredondado"),
    "longo-afro": (1, 2, "Afro com volume lateral"),
}


def rotulo(campo, valor):
    return MAPA[campo]["opcoes"][valor]


def penteados(respostas, corte):
    if respostas["quer_penteados"] != "sim":
        return []
    if respostas["comprimento"] == "curtissimo" or corte["id"] in PENTEADOS_RASPADOS:
        return ["Use solto e acompanhe o desenho natural do topo. O comprimento limita penteados presos."]
    comprimento = "longo" if respostas["comprimento"] == "extra_longo" else respostas["comprimento"]
    opcoes = PENTEADOS[comprimento]
    preferencia = respostas["penteado"]
    estilos = opcoes if preferencia == "qualquer" else [preferencia]
    sugestoes = []
    for modo in estilos:
        perfil = next(
            ((nome, dica) for estetica, tipo, comprimentos, nome, dica in ESTILOS_PENTEADO
             if estetica == respostas["estetica"] and modo == tipo
             and comprimento in comprimentos.split(";")),
            None,
        )
        sugestao = f"{perfil[0]}. {perfil[1]}" if perfil else opcoes[modo]
        if "franja" in corte["efeitos"]:
            sugestao += " Deixe a franja livre para manter o desenho do corte."
        elif modo != "solto" and "movimento" in corte["efeitos"]:
            sugestao += " Evite puxar as camadas mais curtas ao prender."
        if modo == "solto" and respostas["textura"] in ("cacheado", "crespo"):
            sugestao += " Separe os fios com os dedos para preservar a definição."
        sugestoes.append(sugestao)
    return sugestoes


def coloracao(respostas):
    if respostas["quer_cor"] == "nao":
        return "Manter a cor atual."
    subtom = respostas["subtom"]
    familia = respostas["cor"]
    if familia == "sugerir":
        familia = "fria" if subtom in ("frio", "oliva") else "quente"
    paleta = PALETAS[familia][subtom if subtom in PALETAS[familia] else "neutro"]
    base = respostas["base_cor"]
    contexto = {
        "clara": "Em uma base clara, compare primeiro a intensidade em uma mecha.",
        "media": "Compare como a cor aparece sobre o tom atual antes de decidir.",
        "escura": "Em base escura, cores claras podem aparecer como reflexo sutil.",
        "colorida": "A cor anterior pode alterar o resultado. Compare em uma mecha.",
    }[base]
    return f"{rotulo('tecnica_cor', respostas['tecnica_cor'])} em {' ou '.join(paleta)}. {contexto}"


def cabelo(respostas, formato):
    cortes = ranquear(
        apresentacao=respostas["apresentacao"], textura=respostas["textura"],
        comprimento=respostas["comprimento"], formato=formato,
        manutencao=respostas["manutencao"], densidade=VOLUME_CATALOGO.get(respostas["volume"], ""),
        franja=respostas["franja"], estetica=respostas["estetica"],
        objetivo="", usar_regua=True,
    )
    for corte in cortes:
        corte["penteados"] = penteados(respostas, corte)
        corte["referencia"] = FOTO_CORTE.get(corte["id"])
    espessura = respostas["espessura"]
    textura = respostas["textura"]
    subtipo = respostas.get("subtipo")
    finalizador = {
        "liso": "Sérum leve para as pontas",
        "ondulado": "Mousse leve para definição",
        "cacheado": "Creme para pentear e gel de definição",
        "crespo": "Creme de pentear para definição e finalização",
    }[textura]
    if espessura == "fino" or respostas["volume"] == "baixo":
        finalizador += ". Comece com pouca quantidade para evitar pesar."
    elif espessura == "grosso" or subtipo == "c":
        finalizador += ". Aplique em pequenas seções para distribuir melhor."
    return {
        "cortes": cortes,
        "recomendacao": cortes[0]["nome"] if cortes else "Nenhum corte atende aos filtros.",
        "entradas": " · ".join([
            *(rotulo(campo, respostas[campo]) for campo in ("apresentacao", "textura", "comprimento", "franja")),
            LABELS.get(formato, "Rosto sem formato definido"),
            rotulo("estetica", respostas["estetica"]),
        ]),
        "coloracao": coloracao(respostas),
        "dica_produtos": finalizador,
        "produtos": {nome: selecionar(respostas, categoria) for categoria, nome in CABELO_CATEGORIAS.items()},
    }


def produtos_maquiagem(respostas):
    categorias = [codigo for codigo in MAPA["produto"]["opcoes"] if codigo != "todos"] if respostas["produto"] == "todos" else [respostas["produto"]]
    return {rotulo("produto", categoria): selecionar(respostas, categoria) for categoria in categorias}


def guia_tonalidade(respostas):
    tom = [rotulo(campo, respostas[campo]).lower() for campo in ("tom", "subtom") if respostas[campo] != "nao_sei"]
    perfil = " · ".join(tom)
    orientacao = "Escolha a variação na página da marca e compare amostras na linha da mandíbula em luz natural."
    return f"Perfil informado: {perfil}. {orientacao}" if perfil else orientacao


def maquiagem(respostas, prever, dicas, dicas_pele):
    acabamento = respostas["acabamento"]
    tipo_pele = respostas["tipo_pele"]
    look = "maquiagem luminosa" if acabamento == "luminoso" else f"maquiagem {acabamento}"
    sugestao_modelo = prever("maquiagem", respostas) if prever and tipo_pele in dicas_pele else None
    resultado = {
        "recomendacao": look,
        "referencia": acabamento,
        "sugestao_modelo": sugestao_modelo if sugestao_modelo != look else None,
        "entradas": " · ".join(rotulo(campo, respostas[campo]) for campo in ("tipo_pele", "ocasiao", "acabamento")),
        "aplicacao": dicas[acabamento],
        "pele_dica": dicas_pele.get(tipo_pele, "Aplique em camadas finas e ajuste conforme a pele."),
        "produtos": produtos_maquiagem(respostas),
        "dica_produtos": guia_tonalidade(respostas),
    }
    if respostas["sensibilidade"] == "sim":
        resultado["pele_dica"] += " Confira os ingredientes e prefira fórmulas que já tolera."
    return resultado
