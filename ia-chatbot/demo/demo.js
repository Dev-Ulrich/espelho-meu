"use strict";

const el = (id) => document.getElementById(id);
const form = el("consulta");
const video = el("video");
const preview = el("previa");
const overlay = el("contorno");
const buttonsSimulation = document.querySelectorAll("[data-area]");
let stream;
let cameraAttempt = 0;
let photo;
let previewUrl;
let editedUrl;
let lastResult;
let selectedCut;
let revision = 0;

function stopCamera() {
  cameraAttempt++;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  video.srcObject = null;
  video.hidden = true;
  el("camera").disabled = false;
  el("capturar").hidden = true;
  el("capturar").disabled = true;
  el("fechar").hidden = true;
  preview.hidden = !photo;
  el("sem-foto").hidden = !!photo;
}

function invalidateSimulation() {
  el("comparacao").hidden = true;
  if (editedUrl) URL.revokeObjectURL(editedUrl);
  editedUrl = null;
}

function invalidate() {
  revision++;
  lastResult = null;
  selectedCut = null;
  el("resultado").hidden = true;
  invalidateSimulation();
  overlay.setAttribute("hidden", "");
}

function setPhoto(file) {
  if (file.size > 5 * 1024 * 1024) {
    el("arquivo").value = "";
    el("estado-foto").textContent = photo
      ? "O arquivo passa de 5 MB. A foto anterior continua selecionada."
      : "Selecione uma foto de até 5 MB.";
    return;
  }
  photo = file;
  stopCamera();
  invalidate();
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  preview.src = previewUrl;
  el("remover").hidden = false;
  el("estado-foto").textContent = "Foto pronta para análise.";
}

el("camera").addEventListener("click", async () => {
  const attempt = ++cameraAttempt;
  el("camera").disabled = true;
  el("estado-foto").textContent = "Aguardando permissão da câmera…";
  try {
    if (!navigator.mediaDevices) throw new Error("Câmera indisponível");
    const opened = await navigator.mediaDevices.getUserMedia({
      audio: false, video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
    });
    if (attempt !== cameraAttempt) {
      opened.getTracks().forEach((track) => track.stop());
      return;
    }
    stream = opened;
    video.srcObject = stream;
    video.hidden = false;
    preview.hidden = true;
    el("sem-foto").hidden = true;
    overlay.setAttribute("hidden", "");
    el("capturar").hidden = false;
    el("fechar").hidden = false;
    await video.play();
    if (attempt !== cameraAttempt) return;
    el("capturar").disabled = false;
    el("estado-foto").textContent = "Olhe para a câmera e tire a foto.";
  } catch {
    if (attempt !== cameraAttempt) return;
    stopCamera();
    el("estado-foto").textContent = "A câmera não abriu. Confira a permissão no navegador ou selecione uma foto.";
  }
});

el("capturar").addEventListener("click", () => {
  if (!video.videoWidth || !video.videoHeight) return;
  const attempt = cameraAttempt;
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.toBlob((blob) => {
    if (!blob || attempt !== cameraAttempt) return;
    el("arquivo").value = "";
    setPhoto(new File([blob], "camera.jpg", { type: "image/jpeg" }));
  }, "image/jpeg", 0.9);
});

el("fechar").addEventListener("click", () => {
  stopCamera();
  if (lastResult?.facial.contorno.length) drawOutline(lastResult.facial.contorno);
  el("estado-foto").textContent = photo ? "Foto pronta para análise." : "";
});
el("remover").addEventListener("click", () => {
  photo = null;
  el("arquivo").value = "";
  preview.removeAttribute("src");
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  stopCamera();
  invalidate();
  el("remover").hidden = true;
  el("estado-foto").textContent = "Foto removida.";
});
el("arquivo").addEventListener("change", (event) => {
  if (event.target.files[0]) setPhoto(event.target.files[0]);
});
window.addEventListener("pagehide", stopCamera);
const questionario = JSON.parse(el("questionario").textContent);
let respostas = {};
let etapa = 0;
let revisao = false;
let consultando = false;

function perguntasAtivas() {
  const cabelo = ["cabelo", "ambos"].includes(respostas.jornada);
  const maquiagem = ["maquiagem", "ambos"].includes(respostas.jornada);
  return [
    ...questionario.inicio,
    ...(cabelo ? questionario.cabelo : []),
    ...(maquiagem ? questionario.maquiagem : []),
    ...(maquiagem || (cabelo && respostas.quer_cor === "sim") ? questionario.comuns : []),
    ...(maquiagem ? questionario.final_make : []),
    ...(respostas.jornada ? questionario.final : []),
  ].filter((pergunta) => Object.entries(pergunta.quando ?? {}).every(
    ([campo, aceitos]) => aceitos.includes(respostas[campo]),
  ));
}

function mostrarEtapa(focar = true) {
  const perguntas = perguntasAtivas();
  const pergunta = revisao ? null : perguntas[etapa];
  el("alternativas").replaceChildren();
  el("voltar").hidden = etapa === 0 && !revisao;
  el("avancar").hidden = revisao;
  el("enviar").hidden = !revisao;
  el("estado").textContent = "";
  el("progresso").textContent = revisao ? "Questionário concluído" : "Pergunta " + (etapa + 1);
  el("pergunta-titulo").textContent = pergunta?.titulo ?? "Suas respostas estão prontas";
  el("pergunta-ajuda").textContent = pergunta?.ajuda ?? "";
  el("ajuda-grupo").hidden = !pergunta?.ajuda;
  el("ajuda-grupo").classList.remove("aberta", "fechada");
  el("pergunta-revisao").hidden = !revisao;
  const passos = pergunta?.passos ?? [];
  el("guia-pergunta").hidden = !passos.length;
  el("nota-guia-pergunta").textContent = pergunta?.nota_guia ?? "";
  el("passos-pergunta").replaceChildren(...passos.map((passo) => {
    const item = document.createElement("li");
    item.textContent = passo;
    return item;
  }));
  if (pergunta) {
    for (const [valor, rotulo] of Object.entries(pergunta.opcoes)) {
      const label = document.createElement("label");
      const escolha = document.createElement("input");
      escolha.type = pergunta.multipla ? "checkbox" : "radio";
      escolha.name = "alternativa";
      escolha.value = valor;
      escolha.required = !pergunta.multipla;
      escolha.checked = pergunta.multipla
        ? (respostas[pergunta.id] ?? []).includes(valor)
        : respostas[pergunta.id] === valor;
      const texto = document.createElement("span");
      const numero = pergunta.id === "subtipo" ? exemplos.subtipo[respostas.textura]?.[valor]?.[0] : null;
      texto.textContent = numero ?? rotulo;
      const visual = pergunta.reguas
        ? exemploComprimento(pergunta.reguas, valor, respostas.apresentacao)
        : exemploVisual(pergunta.id, valor, respostas);
      label.append(escolha, texto);
      const descricao = pergunta.descricoes?.[valor];
      if (visual) label.append(visual);
      if (descricao) {
        const textoDescricao = document.createElement("span");
        textoDescricao.className = "exemplo-visual";
        textoDescricao.textContent = descricao;
        label.append(textoDescricao);
      }
      el("alternativas").append(label);
    }
  }
  if (focar) el("pergunta-titulo").focus();
}

const ajudaGrupo = el("ajuda-grupo");
el("abrir-ajuda").addEventListener("click", () => {
  const aberta = ajudaGrupo.classList.toggle("aberta");
  ajudaGrupo.classList.toggle("fechada", !aberta);
});
ajudaGrupo.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    ajudaGrupo.classList.remove("aberta");
    ajudaGrupo.classList.add("fechada");
  }
});
ajudaGrupo.addEventListener("pointerleave", () => ajudaGrupo.classList.remove("fechada"));
document.addEventListener("pointerdown", (event) => {
  if (!ajudaGrupo.contains(event.target)) ajudaGrupo.classList.remove("aberta");
});
ajudaGrupo.addEventListener("focusout", () => ajudaGrupo.classList.remove("aberta", "fechada"));

el("voltar").addEventListener("click", () => {
  invalidate();
  etapa = revisao ? perguntasAtivas().length - 1 : Math.max(0, etapa - 1);
  revisao = false;
  mostrarEtapa();
});

el("exemplo").addEventListener("click", () => {
  respostas = {
    jornada: "ambos", apresentacao: "feminino", textura: "ondulado", subtipo: "a",
    espessura: "fino", volume: "medio", formato_manual: photo ? "foto" : "oval",
    comprimento: "longo", manutencao: "media", quer_penteados: "sim", penteado: "semipreso",
    franja: "sem", estetica: "elegante", quer_cor: "sim", tecnica_cor: "mechas",
    cor: "fantasia", base_cor: "escura", tipo_pele: "mista", sensibilidade: "nao",
    tom: "medio", subtom: "neutro", ocasiao: "trabalho", acabamento: "natural",
    cobertura: "baixa", produto: "todos", formato_base: "qualquer", formato_corretivo: "qualquer",
    formato_po: "qualquer", cor_po: "qualquer", orcamento: "todos", selos: [],
  };
  etapa = perguntasAtivas().length - 1;
  revisao = true;
  invalidate();
  mostrarEtapa();
});

mostrarEtapa(false);

function drawOutline(points) {
  overlay.querySelector("polygon").setAttribute("points", points.map(([x, y]) => `${x * 1000},${y * 1000}`).join(" "));
  overlay.style.width = `${preview.clientWidth}px`;
  overlay.style.height = `${preview.clientHeight}px`;
  overlay.toggleAttribute("hidden", preview.hidden || !preview.clientWidth);
}
new ResizeObserver(() => {
  if (lastResult?.facial.contorno.length) drawOutline(lastResult.facial.contorno);
}).observe(preview);

function fillDetails(id, entries) {
  const list = el(id);
  list.replaceChildren();
  for (const [name, value] of entries) {
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = name;
    if (Array.isArray(value)) {
      const options = document.createElement("ul");
      for (const option of value) {
        const li = document.createElement("li");
        li.textContent = option;
        options.append(li);
      }
      description.append(options);
    } else {
      description.textContent = value;
    }
    list.append(term, description);
  }
}

async function updateSimulation(current) {
  el("sim-controles").hidden = true;
  if (!photo) {
    el("sim-aviso").textContent = "Adicione uma foto e gere novas recomendações para simular.";
    return;
  }
  el("sim-aviso").textContent = "Verificando disponibilidade da edição de fotos…";
  try {
    const response = await fetch("/api/simulacoes/status");
    if (!response.ok) throw new Error();
    const { disponivel } = await response.json();
    if (current !== revision) return;
    el("sim-controles").hidden = !disponivel;
    el("sim-aviso").textContent = disponivel ? "" : "Edição disponível quando a OpenAI e o código da demo estiverem configurados.";
  } catch {
    if (current === revision) el("sim-aviso").textContent = "Não foi possível verificar a edição de fotos.";
  }
}

function renderReferencia(id, tipo, referencia, fonte) {
  const quadro = el(id);
  quadro.replaceChildren();
  if (referencia) {
    const [x, y, descricao] = referencia;
    const imagem = document.createElement("div");
    imagem.className = "imagem-referencia " + tipo;
    imagem.style.backgroundPosition = x + "% " + y + "%";
    imagem.setAttribute("role", "img");
    imagem.setAttribute("aria-label", descricao);
    const legenda = document.createElement("p");
    legenda.className = "nota";
    legenda.textContent = "Referência ilustrativa · " + descricao;
    quadro.append(imagem, legenda);
  } else if (fonte) {
    const link = document.createElement("a");
    link.textContent = "Ver referências visuais em " + fonte.titulo;
    link.href = fonte.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    quadro.append(link);
  }
}

function selecionarCorte(corte) {
  selectedCut = corte?.nome;
  el("corte-selecionado").textContent = selectedCut ?? "";
  el("penteado-selecionado").textContent = corte?.penteados.join(" ") ?? "";
  renderReferencia("referencia-corte", "cabelo", corte?.referencia?.map(
    (valor, indice) => indice === 0 ? valor * 100 : indice === 1 ? valor * 50 : valor,
  ), corte?.fontes[0]);
}

function renderCuts(cuts) {
  const list = el("cortes");
  list.replaceChildren();
  selecionarCorte(cuts[0]);
  el("cortes-vazio").hidden = cuts.length > 0;
  const maintenance = { baixa: "Baixa", media: "Média", alta: "Alta" };

  for (const cut of cuts) {
    const item = document.createElement("li");
    const title = document.createElement("h4");
    const context = document.createElement("p");
    const reason = document.createElement("p");
    const directions = document.createElement("p");
    title.textContent = cut.nome;
    context.className = "nota";
    const estilos = cut.esteticas.join(" / ");
    context.textContent = (estilos || cut.estilo) + " · Manutenção " + maintenance[cut.manutencao].toLowerCase();
    reason.textContent = (cut.combina_estetica ? "Combina com sua estética. " : "")
      + "Efeito visual: " + cut.motivo + ".";
    directions.textContent = cut.como_pedir;
    if (cut.apresentacoes.length > 1) context.textContent += " · Versátil";
    item.append(title, context, reason, directions);
    if (cut.penteados.length) {
      const sugestoes = document.createElement("details");
      const resumo = document.createElement("summary");
      resumo.textContent = "Penteados para este corte";
      const texto = document.createElement("p");
      texto.textContent = cut.penteados.join(" ");
      sugestoes.append(resumo, texto);
      item.append(sugestoes);
    }
    if (cut.observacoes.length) {
      const notes = document.createElement("p");
      notes.className = "nota";
      notes.textContent = cut.observacoes.join(" ");
      item.append(notes);
    }
    const references = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Referências";
    references.append(summary);
    const links = document.createElement("ul");
    for (const source of cut.fontes) {
      const row = document.createElement("li");
      const link = document.createElement("a");
      link.textContent = source.titulo;
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      row.append(link);
      links.append(row);
    }
    references.append(links);
    item.append(references);
    if (photo) {
      const choice = document.createElement("button");
      choice.type = "button";
      choice.className = "secundario escolher";
      choice.textContent = "Selecionar para simulação";
      choice.setAttribute("aria-pressed", String(cut.nome === selectedCut));
      choice.addEventListener("click", () => {
        invalidateSimulation();
        selecionarCorte(cut);
        for (const button of list.querySelectorAll(".escolher")) {
          button.setAttribute("aria-pressed", String(button === choice));
        }
      });
      item.append(choice);
    }
    list.append(item);
  }
}

function renderProdutos(id, grupos, dica) {
  const bloco = el(id);
  bloco.replaceChildren();
  if (!grupos) return;
  const titulo = document.createElement("h4");
  titulo.textContent = "Produtos sugeridos";
  const orientacao = document.createElement("p");
  orientacao.className = "nota";
  orientacao.textContent = dica + " Valores de referência. Confira preço e disponibilidade na loja.";
  bloco.append(titulo, orientacao);
  for (const [categoria, produtos] of Object.entries(grupos)) {
    const subtitulo = document.createElement("h5");
    subtitulo.textContent = categoria;
    bloco.append(subtitulo);
    if (!produtos.length) {
      const aviso = document.createElement("p");
      aviso.textContent = "Nenhum item deste catálogo atende aos filtros escolhidos.";
      bloco.append(aviso);
      continue;
    }
    if (produtos.some((produto) => produto.ajustes?.length)) {
      const aviso = document.createElement("p");
      aviso.className = "nota";
      aviso.textContent = "Nenhum item atende a todos os filtros. Veja referências para pesquisar e confira as diferenças abaixo.";
      bloco.append(aviso);
    }
    const lista = document.createElement("ul");
    for (const produto of produtos) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = produto.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = produto.nome;
      const detalhes = document.createElement("p");
      detalhes.className = "nota";
      detalhes.textContent = [...produto.atributos, produto.preco ?? "Consulte o preço na loja"].join(" · ");
      item.append(link, detalhes);
      if (produto.ajustes?.length) {
        const diferencas = document.createElement("p");
        diferencas.className = "nota aviso-produto";
        diferencas.textContent = produto.ajustes.join(" · ");
        item.append(diferencas);
      }
      lista.append(item);
    }
    bloco.append(lista);
  }
}

function showResult(result, current) {
  const { facial, cabelo, maquiagem } = result;
  el("painel-facial").hidden = !facial.formato;
  el("painel-cabelo").hidden = !cabelo;
  el("painel-make").hidden = !maquiagem;
  el("catalogo").hidden = !cabelo;
  el("sim-cabelo").hidden = !cabelo?.cortes.length;
  el("sim-make").hidden = !maquiagem;
  el("simulacao").hidden = !cabelo?.cortes.length && !maquiagem;
  el("formato").textContent = facial.formato;
  el("formato-origem").textContent = facial.origem === "foto"
    ? "Hipótese experimental obtida da foto."
    : (facial.detectado ? "Formato escolhido no questionário. Hipótese da foto: " + facial.detectado + "."
                        : "Formato escolhido no questionário.");
  el("medidas-detalhe").hidden = !facial.contorno.length;
  renderCuts(cabelo?.cortes ?? []);
  el("corte").textContent = cabelo?.recomendacao ?? "";
  el("make").textContent = maquiagem?.recomendacao ?? "";
  const acabamento = maquiagem?.referencia;
  const posicao = { natural: 0, matte: 50, luminoso: 100 };
  if (acabamento in posicao) {
    renderReferencia("referencia-make", "make", [posicao[acabamento], 0, maquiagem.recomendacao]);
  }
  const warnings = el("avisos");
  warnings.replaceChildren(...facial.avisos.map((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  }));
  warnings.hidden = !facial.avisos.length;
  const labels = {
    comprimento_sobre_macas: "Comprimento / maçãs",
    superior_sobre_macas: "Largura superior / maçãs",
    mandibula_sobre_macas: "Mandíbula / maçãs",
    angulo_mandibula_medio: "Ângulo médio da mandíbula",
    angulo_queixo: "Ângulo do queixo",
    arco_inferior_sobre_corda: "Arco inferior / maçãs",
  };
  fillDetails("medidas", Object.entries(labels).filter(([key]) => key in facial.medidas).map(([key, name]) => [
    name, facial.medidas[key].toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + (key.startsWith("angulo") ? "°" : ""),
  ]));
  if (cabelo) fillDetails("dicas-cabelo", [
    ["Filtros usados", cabelo.entradas], ["Formato facial", facial.dica],
    ["Coloração", cabelo.coloracao],
  ].filter(([, valor]) => valor));
  if (maquiagem) fillDetails("dicas-make", [
    ["Suas preferências", maquiagem.entradas], ["Aplicação", maquiagem.aplicacao], ["Tipo de pele", maquiagem.pele_dica],
    ...(maquiagem.sugestao_modelo ? [["Alternativa sugerida pelo modelo", maquiagem.sugestao_modelo]] : []),

  ]);
  renderProdutos("produtos-cabelo", cabelo?.produtos, cabelo?.dica_produtos);
  renderProdutos("produtos-make", maquiagem?.produtos, maquiagem?.dica_produtos);
  if (facial.contorno.length) drawOutline(facial.contorno);
  el("resultado").hidden = false;
  el("resultado-titulo").focus();
  void updateSimulation(current);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!revisao) {
    const pergunta = perguntasAtivas()[etapa];
    const marcadas = [...el("alternativas").querySelectorAll("input:checked")].map((item) => item.value);
    if (!pergunta.multipla && !marcadas.length) return;
    if (pergunta.id === "formato_manual" && marcadas[0] === "foto" && !photo) {
      el("estado").textContent = "Adicione uma foto ou escolha outra opção para continuar.";
      return;
    }
    respostas[pergunta.id] = pergunta.multipla ? marcadas : marcadas[0];
    const ativos = perguntasAtivas();
    const chaves = new Set(ativos.map((item) => item.id));
    respostas = Object.fromEntries(Object.entries(respostas).filter(([chave]) => chaves.has(chave)));
    etapa++;
    revisao = etapa >= ativos.length;
    mostrarEtapa();
    return;
  }
  if (consultando) return;
  if (!photo && respostas.formato_manual === "foto") {
    el("estado").textContent = "Adicione a foto solicitada no questionário ou volte para alterar o formato facial.";
    return;
  }
  stopCamera();
  invalidate();
  const current = revision;
  const payload = new FormData();
  payload.set("respostas", JSON.stringify(respostas));
  consultando = true;
  if (photo) payload.set("foto", photo);
  el("enviar").disabled = true;
  el("estado").textContent = photo ? "Analisando foto e preferências…" : "Comparando suas preferências…";
  try {
    const response = await fetch("/api/demo/analisar", { method: "POST", body: payload });
    const result = await response.json();
    if (current !== revision) return;
    if (!response.ok) throw new Error(result.erro || "A análise falhou.");
    lastResult = result;
    showResult(result, current);
    el("estado").textContent = "Análise concluída.";
  } catch (error) {
    if (current === revision) el("estado").textContent = error.message;
  } finally {
    consultando = false;
    el("enviar").disabled = false;
  }
});

for (const button of buttonsSimulation) {
  button.addEventListener("click", async () => {
    if (!lastResult || !photo) return;
    const code = el("codigo").value;
    if (!code) {
      el("sim-aviso").textContent = "Informe o código de demonstração.";
      el("codigo").focus();
      return;
    }
    const current = revision;
    const originalUrl = previewUrl;
    const area = button.dataset.area;
    const estilo = area === "cabelo" ? selectedCut : lastResult.maquiagem?.recomendacao;
    if (!estilo) return;
    const payload = new FormData();
    payload.set("estilo", estilo);
    payload.set("foto", photo);
    buttonsSimulation.forEach((item) => { item.disabled = true; });
    el("sim-aviso").textContent = "Gerando a simulação…";
    try {
      const response = await fetch(`/api/simulacoes/${area}`, {
        method: "POST", body: payload, headers: { "X-Simulacao-Codigo": code },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.erro || "A simulação falhou.");
      }
      const image = await response.blob();
      if (current !== revision || (area === "cabelo" && estilo !== selectedCut)) return;
      if (editedUrl) URL.revokeObjectURL(editedUrl);
      editedUrl = URL.createObjectURL(image);
      el("antes").src = originalUrl;
      el("depois").src = editedUrl;
      el("comparacao").hidden = false;
      el("sim-aviso").textContent = area === "cabelo" ? "Simulação de corte concluída." : "Simulação de maquiagem concluída.";
    } catch (error) {
      if (current === revision) el("sim-aviso").textContent = error.message;
    } finally {
      buttonsSimulation.forEach((item) => { item.disabled = false; });
    }
  });
}
