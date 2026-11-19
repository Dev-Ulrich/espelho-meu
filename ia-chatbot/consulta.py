"""Perguntas e regras explícitas para o fluxo progressivo da consultoria."""
from facial import LABELS
from comprimentos import REGUAS, ROTULOS
from esteticas import PERFIS


def pergunta(id, titulo, opcoes, ajuda="", quando=None, multipla=False):
    item = {"id": id, "titulo": titulo, "opcoes": dict(opcoes), "ajuda": ajuda, "multipla": multipla}
    if quando:
        item["quando"] = quando
    return item


PERGUNTAS = [
    pergunta("jornada", "O que você quer experimentar?", [("cabelo","Cabelo"),("maquiagem","Maquiagem"),("ambos","Cabelo e maquiagem")]),
]
CABELO = [
    pergunta("apresentacao","Qual estilo de referência você prefere?",[("masculino","Masculino"),("feminino","Feminino"),("ambos","Ver ambos")]),
    pergunta("textura","Como é a curvatura natural do seu cabelo?",[("liso","Tipo 1 · Liso"),("ondulado","Tipo 2 · Ondulado"),("cacheado","Tipo 3 · Cacheado"),("crespo","Tipo 4 · Crespo")],"Observe o cabelo seco, sem escova ou chapinha. Mais de uma curvatura pode aparecer no mesmo cabelo."),
    pergunta("subtipo","Qual desenho se aproxima mais dos seus fios?",[("a","A"),("b","B"),("c","C"),("nao_sei","Ainda não sei")],"As letras ajudam a descrever a curvatura e orientar a finalização.",{"textura":["liso","ondulado","cacheado","crespo"]}),
    pergunta("espessura","Como é a espessura de um fio isolado?",[("fino","Fino"),("medio","Médio"),("grosso","Grosso"),("nao_sei","Não sei")],"É a grossura de cada fio. Considere um fio solto, sem puxar o cabelo."),
    pergunta("volume","Qual é o volume aparente do seu cabelo?",[("baixo","Baixo"),("medio","Médio"),("alto","Alto"),("nao_sei","Não sei")],"Observe quanto espaço o cabelo ocupa seco e solto. O volume ajuda a escolher a distribuição de camadas e a quantidade inicial de finalizador."),
    pergunta("formato_manual","Qual formato facial você quer usar?",[("foto","Analisar uma foto"),*LABELS.items()],"A foto produz uma hipótese experimental. Você pode escolher um formato para comparar o resultado."),
    {
        **pergunta("comprimento", "Qual comprimento você deseja?", ROTULOS.items(),
                   "Compare com o cabelo seco, do jeito que costuma usar. Em cabelos ondulados, cacheados ou crespos, o comprimento aparente pode mudar com a finalização."),
        "reguas": REGUAS,
    },
    pergunta("manutencao","Quanto tempo você quer dedicar à manutenção?",[("baixa","Pouco"),("media","Moderado"),("alta","Bastante")]),
    pergunta("quer_penteados","Quer sugestões de penteados ao escolher um corte?",[("sim","Sim"),("nao","Não")]),
    pergunta("penteado","Como você prefere usar o cabelo?",[("solto","Solto"),("preso","Preso"),("semipreso","Semipreso"),("qualquer","Quero comparar")],"Alguns cortes curtos permitem apenas grampos ou mechas frontais presas.",{"quer_penteados":["sim"]}),
    pergunta("franja","Quer um corte com franja?",[("com","Sim"),("sem","Não"),("qualquer","Tanto faz")],"Essa escolha filtra os cortes. Ao escolher Não, cortes com franja saem da lista."),
    {
        **pergunta("estetica", "Que estética você gostaria de experimentar?",
                   [(codigo, nome) for codigo, (nome, _) in PERFIS.items()],
                   "Escolha o efeito visual que quer experimentar neste corte."),
        "descricoes": {codigo: descricao for codigo, (_, descricao) in PERFIS.items()},
    },
    pergunta("quer_cor","Você quer mudar a cor?",[("nao","Manter a cor atual"),("sim","Experimentar outras cores")]),
    pergunta("tecnica_cor","Qual mudança você imagina?",[("luzes","Luzes"),("mechas","Mechas localizadas"),("global","Coloração global")],quando={"quer_cor":["sim"]}),
    pergunta("cor","Que família de cores você prefere?",[("quente","Tons quentes"),("fria","Tons frios"),("fantasia","Cores fantasia"),("sugerir","Quero sugestões")],quando={"quer_cor":["sim"]}),
    pergunta("base_cor","Como é a cor atual do seu cabelo?",[("clara","Clara"),("media","Média"),("escura","Escura"),("colorida","Já colorido")],"A base atual orienta a expectativa de intensidade da cor.",{"quer_cor":["sim"]}),
]
MAQUIAGEM = [
    pergunta("tipo_pele","Como sua pele costuma ficar ao longo do dia?",[("normal","Normal"),("seca","Seca"),("mista","Mista"),("oleosa","Oleosa"),("nao_sei","Não sei")],"Seca costuma repuxar. Oleosa apresenta brilho em várias áreas. Mista costuma ter mais brilho na testa, nariz e queixo."),
    pergunta("sensibilidade","Sua pele costuma reagir a cosméticos?",[("sim","Sim"),("nao","Não"),("nao_sei","Não sei")],"Sensibilidade pode acompanhar qualquer tipo de pele. As indicações exigem conferir ingredientes e sua experiência anterior."),
]
COMUNS = [
    pergunta("tom","Como você descreve seu tom de pele?",[("claro","Claro"),("medio","Médio"),("escuro","Escuro")],"Tom descreve quão clara ou escura a pele parece. Ele ajuda a procurar a família de tonalidades no fabricante."),
    pergunta("subtom","Você conhece seu subtom?",[("quente","Quente"),("frio","Frio"),("neutro","Neutro"),("oliva","Oliva"),("nao_sei","Quero ajuda / não sei")],"Observe a pele sem maquiagem sob luz natural. Compare pequenas faixas de base quente, fria e neutra na transição rosto-pescoço e espere assentar. Escolha a que se mistura melhor. Veias e joias são pistas subjetivas. O subtom oliva pode aparecer em qualquer tom de pele."),
]
FINAL_MAKE = [
    pergunta("ocasiao","Para qual ocasião?",[("evento","Evento"),("trabalho","Trabalho / faculdade"),("dia_a_dia","Dia a dia")]),
    pergunta("acabamento","Qual acabamento você prefere?",[("matte","Matte"),("natural","Natural"),("luminoso","Luminoso / glow")]),
    pergunta("cobertura","Quanto você quer de cobertura?",[("baixa","Baixa"),("media","Média"),("alta","Alta")]),
    pergunta("produto","Quais produtos você quer comparar?",[("todos","Base, corretivo e pó"),("base","Base"),("corretivo","Corretivo"),("po","Pó")]),
    pergunta("formato_base","Qual formato de base você prefere?",[("qualquer","Sem preferência"),("liquido","Líquida"),("bastao","Bastão"),("compacto","Compacta")],quando={"produto":["todos","base"]}),
    pergunta("formato_corretivo","Qual formato de corretivo?",[("qualquer","Sem preferência"),("liquido","Líquido"),("bastao","Bastão")],quando={"produto":["todos","corretivo"]}),
    pergunta("formato_po","Como você prefere o pó?",[("qualquer","Sem preferência"),("compacto","Compacto"),("solto","Solto")],quando={"produto":["todos","po"]}),
    pergunta("cor_po","Pó com cor ou translúcido?",[("qualquer","Sem preferência"),("colorido","Com cor"),("translucido","Translúcido")],quando={"produto":["todos","po"]}),
]
FINAL = [
    pergunta("orcamento","Qual faixa de preço você prefere por produto?",[("todos","Comparar todas"),("economico","Econômico · até R$ 45"),("intermediario","Intermediário · de R$ 45,01 a R$ 110"),("premium","Premium · acima de R$ 110")]),
    pergunta("selos","Quais características você exige dos produtos?",[("vegano","Vegano"),("cruelty_free","Cruelty-free"),("nao_comedogenico","Não comedogênico"),("sem_parabenos","Sem parabenos"),("dermatologicamente_testado","Dermatologicamente testado")],"Marque só o que for indispensável. Quando faltar confirmação de um selo, a demo distingue referências para pesquisar de produtos que atendem ao filtro.",multipla=True),
]
GUIAS = {
    "textura": "Lave e deixe secar ao natural, sem escova, chapinha ou modelador. Observe mechas na frente, no topo e na nuca. Compare o desenho com os exemplos. Se houver mais de um tipo, escolha o que aparece na maior parte dos fios.",
    "subtipo": "Compare algumas mechas já secas, sem esticar os fios. Nos ondulados, cacheados e crespos, veja como as curvas mudam de A para C. No liso, compare o corpo do fio e as dobras nas pontas. Se estiver entre dois exemplos, use o mais comum no seu cabelo ou escolha ‘Ainda não sei’.",
    "espessura": "Pegue um fio solto e role-o entre o polegar e o indicador. Um fio fino costuma ser difícil de sentir. A grossura do fio é diferente do volume do cabelo todo.",
    "volume": "Deixe o cabelo seco e solto. Veja quanto ele se afasta da cabeça nas laterais e no topo. Compare com os desenhos. O volume pode mudar conforme o corte, o dia e a finalização.",
    "formato_manual": "Prenda o cabelo, olhe de frente no espelho e compare testa, maçãs do rosto e mandíbula. Observe também se o rosto é mais longo que largo. Se ficar em dúvida, peça a análise da foto.",
    "penteado": "Solto deixa os fios livres. Preso recolhe a maior parte do cabelo. Semipreso prende apenas uma parte, como o topo ou as mechas da frente.",
    "tecnica_cor": "Luzes costumam clarear várias mechas finas. Mechas localizadas destacam algumas áreas, como as laterais do rosto. Coloração global muda a cor em todo o cabelo.",
    "cor": "Tons quentes incluem cobre e caramelo. Tons frios incluem castanho acinzentado e loiro perolado. Cores fantasia incluem violeta, rosa e azul.",
    "subtom": "O subtom é a cor de fundo da pele. Use os dois testes em luz natural indireta, com a pele sem maquiagem. Os resultados são pistas. Veias verdes também podem aparecer em peles oliva, então o teste do pulso sozinho não distingue oliva de quente.",
    "acabamento": "Acabamento é o efeito de brilho depois de aplicar. Matte tem pouco brilho, natural mantém um aspecto parecido com o da pele e luminoso dá mais brilho em áreas como as maçãs do rosto.",
    "cobertura": "Cobertura é quanto a maquiagem disfarça marcas ou diferenças de cor. A leve deixa mais da pele à vista, a média uniformiza parcialmente e a alta cobre mais. É possível combinar cobertura leve com acabamento matte.",
    "produto": "A base uniformiza a pele. O corretivo cobre áreas pontuais. O pó ajuda a selar a maquiagem ou controlar o brilho.",
    "formato_base": "Base líquida vem em frasco ou bisnaga. Em bastão é sólida e vai direto na pele. Compacta vem prensada e pode ser aplicada com esponja ou pincel.",
    "formato_corretivo": "O corretivo líquido costuma vir com aplicador e espalha com facilidade. O bastão vai direto em pontos específicos.",
    "formato_po": "Pó compacto é prensado e prático para retoques. Pó solto vem em partículas livres e pode ser dosado aos poucos no pincel.",
    "cor_po": "Pó com cor acrescenta pigmento. O translúcido deposita pouco ou nenhum pigmento aparente, mas confira a variação e como fica na sua pele.",
    "orcamento": "A faixa vale por item. Usamos o preço de referência do catálogo. Promoções, tons e estoque podem mudar na loja.",
    "selos": "Vegano indica fórmula sem ingredientes de origem animal. Cruelty-free se refere a testes em animais. Não comedogênico indica que o produto foi formulado para reduzir a tendência de obstruir poros. Dermatologicamente testado não garante ausência de reações. Marque apenas o que você exige.",
}

PASSOS_SUBTOM = [
    "Veias do pulso. Em luz natural, observe a parte interna dos pulsos. Veias azuladas ou arroxeadas sugerem frio. Esverdeadas sugerem quente ou oliva. Uma mistura de azul e verde pode indicar neutro.",
    "Dourado ou prateado. Em luz natural e sem maquiagem, aproxime um acessório ou tecido dourado do rosto. Depois repita com um prateado. Se o dourado harmonizar mais, pode indicar quente. Se o prateado harmonizar mais, pode indicar frio. Se ambos funcionarem de forma parecida, pode indicar neutro.",
]

TODAS = PERGUNTAS + CABELO + MAQUIAGEM + COMUNS + FINAL_MAKE + FINAL
for item in TODAS:
    item["ajuda"] = GUIAS.get(item["id"], item["ajuda"])

MAPA = {p["id"]: p for p in TODAS}
MAPA["subtom"]["passos"] = PASSOS_SUBTOM
MAPA["subtom"]["nota_guia"] = (
    "Se os testes discordarem, as veias forem pouco visíveis ou você ficar em dúvida entre quente e oliva, use as pistas como orientação subjetiva; nenhum teste determina o subtom sozinho."
)


def caminho(respostas):
    jornada = respostas.get("jornada")
    perguntas = list(PERGUNTAS)
    if jornada in ("cabelo","ambos"):
        perguntas += CABELO
    if jornada in ("maquiagem","ambos"):
        perguntas += MAQUIAGEM
    if jornada in ("maquiagem","ambos") or (jornada == "cabelo" and respostas.get("quer_cor") == "sim"):
        perguntas += COMUNS
    if jornada in ("maquiagem","ambos"):
        perguntas += FINAL_MAKE
    if jornada:
        perguntas += FINAL
    return [p for p in perguntas if all(respostas.get(chave) in valores for chave,valores in p.get("quando",{}).items())]


def validar(respostas):
    if not isinstance(respostas,dict):
        raise ValueError("Envie as respostas do questionário.")
    ativos = caminho(respostas)
    validas = {}
    for p in ativos:
        valor = respostas.get(p["id"])
        if p["multipla"]:
            if not isinstance(valor, list) or any(not isinstance(v, str) or v not in p["opcoes"] for v in valor):
                raise ValueError("Revise a pergunta: " + p["titulo"])
            validas[p["id"]] = list(dict.fromkeys(valor))
        elif not isinstance(valor, str) or valor not in p["opcoes"]:
            raise ValueError("Responda à pergunta: " + p["titulo"])
        else:
            validas[p["id"]] = valor
    if any(k not in MAPA for k in respostas):
        raise ValueError("O questionário contém campos desconhecidos.")
    return validas
