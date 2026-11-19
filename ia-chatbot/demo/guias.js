"use strict";

const exemplos = {
  textura: {
    liso: ["1", "O fio cai reto, com pouca ou nenhuma onda."],
    ondulado: ["2", "O fio desenha ondas abertas, em forma de S."],
    cacheado: ["3", "O fio forma voltas visíveis, como anéis ou molas."],
    crespo: ["4", "O fio tem voltas muito pequenas ou ângulos em zigue-zague."],
  },
  subtipo: {
    liso: { a: ["1A", "Reto da raiz às pontas, geralmente com pouco corpo."], b: ["1B", "Reto, com um pouco mais de corpo."], c: ["1C", "Mantém a forma lisa, com mais corpo e possíveis dobras nas pontas."] },
    ondulado: { a: ["2A", "Ondas suaves, mais visíveis no comprimento."], b: ["2B", "Ondas em S mais fáceis de perceber."], c: ["2C", "Ondas fortes e, às vezes, algumas voltas abertas."] },
    cacheado: { a: ["3A", "Anéis largos e soltos."], b: ["3B", "Espirais mais definidas e de diâmetro médio."], c: ["3C", "Espirais pequenas, próximas umas das outras."] },
    crespo: { a: ["4A", "Molinhas bem pequenas e reconhecíveis."], b: ["4B", "Dobras em zigue-zague, com ângulos visíveis."], c: ["4C", "Curvas muito fechadas, com desenho menos visível no conjunto."] },
  },
  espessura: { fino: ["fio-fino", "Um fio isolado é difícil de sentir entre os dedos."], medio: ["fio-medio", "Você sente o fio, mas ele não parece muito rígido."], grosso: ["fio-grosso", "Um fio isolado é fácil de sentir entre os dedos."] },
  volume: { baixo: ["volume-baixo", "Cabelo mais próximo das laterais da cabeça."], medio: ["volume-medio", "Cabelo ocupa espaço moderado em volta da cabeça."], alto: ["volume-alto", "Cabelo cria uma silhueta mais ampla ao redor da cabeça."] },
  formato_manual: {
    oval: ["rosto-oval", "Um pouco mais longo que largo, com mandíbula arredondada."],
    redondo: ["rosto-redondo", "Largura e comprimento próximos, com contorno suave."],
    quadrado: ["rosto-quadrado", "Testa e mandíbula de larguras próximas, com ângulos marcados."],
    oblongo: ["rosto-oblongo", "Mais longo que largo, com laterais relativamente retas."],
    coracao: ["rosto-coracao", "Testa mais larga e queixo afunilado."],
    diamante: ["rosto-diamante", "Maçãs mais largas, com testa e queixo estreitos."],
    triangular: ["rosto-triangular", "Mandíbula mais larga que a testa."],
  },
  franja: { com: ["com", "Mechas frontais caem sobre toda ou parte da testa."], sem: ["sem", "A frente fica aberta, sem franja cortada."] },
  subtom: {
    quente: ["subtom-quente", "Exemplo de fundo mais dourado ou pêssego."],
    frio: ["subtom-frio", "Exemplo de fundo mais rosado."],
    neutro: ["subtom-neutro", "Exemplo de equilíbrio entre dourado e rosado."],
    oliva: ["subtom-oliva", "Exemplo de fundo esverdeado ou acinzentado."],
  },
  tecnica_cor: {
    luzes: ["luzes", "Vários fios finos clareados e distribuídos pelo cabelo."],
    mechas: ["mechas", "Seções escolhidas ganham destaque de cor."],
    global: ["global", "A cor é aplicada ao cabelo todo."],
  },
  acabamento: {
    natural: ["make-natural", "A pele mantém um brilho discreto."],
    matte: ["make-matte", "A pele fica com pouco brilho aparente."],
    luminoso: ["make-luminoso", "O brilho aparece mais nos pontos altos do rosto."],
  },
};

function exemploVisual(campo, valor, respostas) {
  const opcoes = campo === "subtipo" ? exemplos.subtipo[respostas.textura] : exemplos[campo];
  const exemplo = opcoes?.[valor];
  if (!exemplo) return null;
  const [codigo, legenda] = exemplo;
  const quadro = document.createElement("span");
  quadro.className = "exemplo-visual";
  if (campo === "acabamento") {
    const foto = document.createElement("span");
    foto.className = "exemplo-acabamento " + codigo;
    foto.setAttribute("aria-hidden", "true");
    quadro.append(foto);
  } else {
    const desenho = document.createElement("img");
    desenho.src = "/demo-assets/guias/" + codigo + ".svg";
    desenho.alt = "";
    desenho.width = 72;
    desenho.height = 59;
    quadro.append(desenho);
  }
  const descricao = document.createElement("span");
  descricao.textContent = legenda;
  quadro.append(descricao);
  return quadro;
}

function exemploComprimento(reguas, valor, apresentacao) {
  const grupos = apresentacao === "ambos" ? Object.keys(reguas) : [apresentacao];
  const quadro = document.createElement("span");
  quadro.className = "exemplos-comprimento";
  for (const grupo of grupos) {
    const exemplo = document.createElement("span");
    exemplo.className = "exemplo-visual";
    const img = document.createElement("img");
    img.src = "/demo-assets/guias/comprimento-" + grupo + "-" + valor + ".svg";
    img.alt = "";
    img.width = 72;
    img.height = 83;
    const legenda = document.createElement("span");
    legenda.textContent = (grupos.length > 1 ? (grupo === "masculino" ? "Masculino · " : "Feminino · ") : "") + reguas[grupo][valor];
    exemplo.append(img, legenda);
    quadro.append(exemplo);
  }
  return quadro;
}
