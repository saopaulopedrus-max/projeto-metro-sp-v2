let grafoGlobal;
let mapaLeaflet;
let camadaRede;
let camadaRota;
let marcadores = [];
let coordenadas = new Map();
const COORDENADAS_URL = "https://gist.githubusercontent.com/thiagodsd/dac67b331cb04cfb85fe21610cdeb50a/raw/30e27385e8d77274b46b7028d6e0d497c90c3cbe/sp_metro_stations.json";

function normalizarNome(nome) {
  return String(nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function carregarCoordenadas() {
  try {
    const resp = await fetch(COORDENADAS_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const dados = await resp.json();
    Object.values(dados).forEach(est => {
      const lat = Number(est.location?.latitude), lng = Number(est.location?.longitude);
      if (est.title && Number.isFinite(lat) && Number.isFinite(lng)) coordenadas.set(normalizarNome(est.title), [lat, lng]);
    });
  } catch (e) {
    console.warn("Não foi possível carregar a base externa de coordenadas:", e);
  }
  // Complementos para estações de integração e nomes divergentes da base antiga.
  const complementos = {
    "Jardim São Paulo-Ayrton Senna": [-23.492233, -46.616687],
    "Japão-Liberdade": [-23.555535, -46.635956],
    "Palmeiras-Barra Funda": [-23.525429, -46.667],
    "Corinthians-Itaquera": [-23.5425, -46.4714],
    "Tatuapé": [-23.5407, -46.5765], "Brás": [-23.5461, -46.6164],
    "Luz": [-23.5362, -46.6333], "Paraíso": [-23.575922, -46.64141],
    "Ana Rosa": [-23.581376, -46.638388], "Santa Cruz": [-23.599225, -46.636659],
    "Sé": [-23.549291, -46.633471], "Consolação": [-23.556094, -46.662443],
    "Pinheiros": [-23.565934, -46.701087], "Santo Amaro": [-23.6542, -46.7113],
    "Tamanduateí": [-23.592985, -46.589293], "Vila Prudente": [-23.57979, -46.581287]
  };
  Object.entries(complementos).forEach(([nome, coord]) => coordenadas.set(normalizarNome(nome), coord));
}

function obterCoordenada(nome) { return coordenadas.get(normalizarNome(nome)); }

async function inicializarApp() {
  mapaLeaflet = L.map("map").setView([-23.5503, -46.6339], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(mapaLeaflet);
  camadaRede = L.layerGroup().addTo(mapaLeaflet);
  camadaRota = L.layerGroup().addTo(mapaLeaflet);

  [grafoGlobal] = await Promise.all([carregarGrafo(), carregarCoordenadas()]);
  if (!grafoGlobal) return alert("Não foi possível carregar as estações.");

  // O seletor inclui estações das linhas auxiliares para permitir destinos como Consolação.
  // A visualização da rede, porém, mantém somente as cinco linhas principais.
  const estacoes = [...new Set(Object.keys(grafoGlobal).map(id => id.split("::")[0]))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  ["origem", "destino"].forEach(id => preencherSelect(document.getElementById(id), estacoes, "Selecione a estação"));
  preencherSelect(document.getElementById("estacao-interditada"), estacoes, "Nenhuma");
  desenharRedePrincipal();
  mapaLeaflet.invalidateSize();
}

function preencherSelect(select, opcoes, primeiraOpcao) {
  // Origem e destino usam campos de pesquisa com sugestões; outros filtros continuam como select.
  if (select.tagName === "INPUT") {
    const lista = document.getElementById(select.getAttribute("list"));
    lista.replaceChildren();
    opcoes.forEach(estacao => lista.appendChild(new Option(estacao, estacao)));
    return;
  }
  select.replaceChildren(new Option(primeiraOpcao, ""));
  opcoes.forEach(estacao => select.add(new Option(estacao, estacao)));
}

function desenharRedePrincipal() {
  camadaRede.clearLayers();
  const segmentosVistos = new Set();
  Object.entries(grafoGlobal).forEach(([origemId, arestas]) => {
    const [origem, linha] = origemId.split("::");
    if (!LINHAS_PRINCIPAIS.has(linha)) return;
    arestas.forEach(a => {
      if (a.tipo !== "trecho") return;
      const destino = a.destino.split("::")[0];
      const chave = [origem, destino, linha].sort().join("|");
      if (segmentosVistos.has(chave)) return;
      segmentosVistos.add(chave);
      const p1 = obterCoordenada(origem), p2 = obterCoordenada(destino);
      if (p1 && p2) L.polyline([p1, p2], { color: a.cor, weight: 4, opacity: 0.58 }).addTo(camadaRede);
    });
  });
  const estacoes = new Set(Object.keys(grafoGlobal).map(id => id.split("::")[0]));
  estacoes.forEach(nome => {
    const p = obterCoordenada(nome);
    if (!p) return;
    const linhas = [...new Set(Object.keys(grafoGlobal).filter(id => id.startsWith(`${nome}::`)).map(id => id.split("::")[1]))];
    const ehBaldeacao = linhas.length > 1;
    const m = L.circleMarker(p, { radius: ehBaldeacao ? 6 : 3.5, color: ehBaldeacao ? "#ff7900" : "#243b53", weight: 1.5, fillColor: "#fff", fillOpacity: 1 })
      .bindTooltip(`${nome}${ehBaldeacao ? " • Baldeação" : ""}<br>${linhas.map(l => `Linha ${l} - ${LINHAS_DO_GRUPO[l]?.nome || ""}`).join("<br>")}`)
      .addTo(camadaRede);
    marcadores.push(m);
  });
}

function calcularEExibirRota() {
  const origem = document.getElementById("origem").value;
  const destino = document.getElementById("destino").value;
  const estacoesValidas = new Set(Object.keys(grafoGlobal).map(id => id.split("::")[0]));
  if (!origem || !destino) return alert("Pesquise e selecione uma estação de origem e uma de destino.");
  if (!estacoesValidas.has(origem) || !estacoesValidas.has(destino)) {
    return alert("Escolha uma estação válida nas sugestões da pesquisa.");
  }
  if (origem === destino) return alert("Origem e destino devem ser diferentes.");
  const linhasInterditadas = [...document.querySelectorAll(".linha-interditada:checked")].map(x => x.value);
  const estacaoInterditada = document.getElementById("estacao-interditada").value;
  const modoTempo = document.getElementById("chuva").checked ? "chuva" : document.getElementById("horario-pico").checked ? "pico" : "comum";
  const resultado = calcularRotaDijkstra(grafoGlobal, origem, destino, {
    modoTempo, linhasInterditadas, estacoesInterditadas: estacaoInterditada ? [estacaoInterditada] : []
  });
  const painel = document.getElementById("resultado"), tempo = document.getElementById("tempo-total"), lista = document.getElementById("lista-caminho");
  lista.replaceChildren(); painel.classList.remove("hidden"); camadaRota.clearLayers();
  if (!Number.isFinite(resultado.tempoTotal)) {
    tempo.textContent = "Não há rota disponível com as restrições selecionadas.";
    return;
  }
  const modo = document.getElementById("modo-transporte").value;
  const fatores = { metro: 1, carro: 1.2, moto: 0.8, onibus: 1.5, pe: 3.5 };
  const tempoFinal = Math.round(resultado.tempoTotal * (fatores[modo] || 1));
  const baldeacoes = resultado.caminho.filter((item, i) => i && item.linha !== resultado.caminho[i - 1].linha).length;
  tempo.textContent = `⏱️ ${tempoFinal} min estimados | 📍 ${resultado.caminho.length} estações | 🔄 ${baldeacoes} baldeações` +
    (document.getElementById("apenas-acessiveis").checked ? " | ⚠️ Não há dados suficientes para garantir acessibilidade total." : "");

  resultado.caminho.forEach((item, i) => {
    if (i && item.linha !== resultado.caminho[i - 1].linha) {
      const li = document.createElement("li");
      li.innerHTML = `<strong>🔄 Baldeação ${item.nomeBaldeacao ? `em ${item.nomeBaldeacao}` : `em ${item.estacao}`}: Linha ${item.linha} - ${item.nome}</strong>`;
      li.style.color = "#d65a00"; lista.append(li);
    }
    const li = document.createElement("li");
    li.textContent = `${item.estacao} — Linha ${item.linha} ${item.nome || ""}`;
    li.style.color = item.cor || "#243b53"; lista.append(li);
  });

  const pontos = resultado.caminho.map(x => obterCoordenada(x.estacao));
  // Desenha o pequeno deslocamento entre estações integradas com nomes diferentes,
  // como Paulista (Linha 4) e Consolação (Linha 2).
  resultado.caminho.forEach((item, i) => {
    if (i === 0 || item.linha === resultado.caminho[i - 1].linha) return;
    const anterior = obterCoordenada(resultado.caminho[i - 1].estacao);
    const atual = pontos[i];
    if (anterior && atual && resultado.caminho[i - 1].estacao !== item.estacao) {
      L.polyline([anterior, atual], { color: "#ff7900", weight: 4, opacity: 0.9, dashArray: "5 6" }).addTo(camadaRota);
    }
  });
  const trechos = [];
  for (let i = 0; i < pontos.length; i++) {
    if (!pontos[i]) continue;
    if (trechos.length && resultado.caminho[i].linha !== resultado.caminho[i - 1]?.linha) {
      // separa visualmente a mudança de linha sem apagar o trecho anterior
      trechos.push({ coord: pontos[i], cor: resultado.caminho[i].cor, troca: true });
    } else trechos.push({ coord: pontos[i], cor: resultado.caminho[i].cor, troca: false });
  }
  let grupo = [];
  trechos.forEach((p, i) => {
    if (p.troca && grupo.length > 1) { L.polyline(grupo, { color: trechos[i - 1].cor, weight: 7, opacity: 0.95 }).addTo(camadaRota); grupo = []; }
    grupo.push(p.coord);
    if (i === trechos.length - 1 || trechos[i + 1]?.troca) {
      if (grupo.length > 1) L.polyline(grupo, { color: p.cor, weight: 7, opacity: 0.95 }).addTo(camadaRota);
    }
  });
  resultado.caminho.forEach((item, i) => {
    const p = obterCoordenada(item.estacao); if (!p) return;
    const troca = i > 0 && item.linha !== resultado.caminho[i - 1].linha;
    L.circleMarker(p, { radius: troca ? 9 : 6, color: troca ? "#ff7900" : item.cor, weight: 3, fillColor: "#fff", fillOpacity: 1 })
      .bindTooltip(`${item.estacao}${troca ? " • BALDEAÇÃO" : ""}`).addTo(camadaRota);
  });
  const bounds = pontos.filter(Boolean);
  if (bounds.length) mapaLeaflet.fitBounds(bounds, { padding: [35, 35] });
}

document.getElementById("btn-calcular").addEventListener("click", calcularEExibirRota);
inicializarApp();



// O painel inicia compacto e só abre os campos quando a pessoa inicia uma pesquisa.
const painelPesquisa = document.querySelector(".container");
const botaoAbrirPesquisa = document.getElementById("btn-abrir-pesquisa");
const campoOrigem = document.getElementById("origem");

function abrirPesquisa() {
  painelPesquisa.classList.remove("compact", "panel-hidden");
  window.setTimeout(() => {
    if (campoOrigem) campoOrigem.focus();
    if (mapaLeaflet) mapaLeaflet.invalidateSize();
  }, 260);
}

botaoAbrirPesquisa.addEventListener("click", abrirPesquisa);

// O botão de menu permite recolher o painel expandido e voltar ao cartão compacto.
document.getElementById("btn-painel").addEventListener("click", () => {
  if (painelPesquisa.classList.contains("panel-hidden")) {
    painelPesquisa.classList.remove("panel-hidden");
    painelPesquisa.classList.add("compact");
  } else if (!painelPesquisa.classList.contains("compact")) {
    painelPesquisa.classList.add("compact");
  } else {
    painelPesquisa.classList.add("panel-hidden");
  }
  window.setTimeout(() => mapaLeaflet && mapaLeaflet.invalidateSize(), 280);
});

// Ao tocar nos campos (inclusive em dispositivos móveis), mantém o painel expandido.
[campoOrigem, document.getElementById("destino")].forEach(campo => {
  campo.addEventListener("focus", () => painelPesquisa.classList.remove("compact"));
});
