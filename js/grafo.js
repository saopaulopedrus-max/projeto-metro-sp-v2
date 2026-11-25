const LINHAS_DO_GRUPO = {
  "1": { nome: "Azul", cor: "#0153a0" },
  "2": { nome: "Verde", cor: "#008a45" },
  "3": { nome: "Vermelha", cor: "#ee372f" },
  "4": { nome: "Amarela", cor: "#f5c400" },
  "5": { nome: "Lilás", cor: "#9b3894" },
  "6": { nome: "Laranja", cor: "#f58220" },
  "7": { nome: "Rubi", cor: "#b51f36" },
  "8": { nome: "Diamante", cor: "#00a6d2" },
  "9": { nome: "Esmeralda", cor: "#00a86b" },
  "10": { nome: "Turquesa", cor: "#008a99" },
  "11": { nome: "Coral", cor: "#f68369" },
  "12": { nome: "Safira", cor: "#1674c8" },
  "13": { nome: "Jade", cor: "#3d9b68" },
  "15": { nome: "Prata", cor: "#8c969d" },
  "17": { nome: "Ouro", cor: "#d7a900" }
};
const LINHAS_PRINCIPAIS = new Set(["1", "3", "5", "10", "11"]);

async function carregarGrafo() {
  try {
    const resposta = await fetch("dados/redejsoncompleto.json");
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const { rede_transporte: dados } = await resposta.json();
    if (!Array.isArray(dados)) throw new Error("Formato de rede inválido.");
    const grafo = {};
    const adicionar = (id, aresta) => (grafo[id] ??= []).push(aresta);

    dados.forEach(item => {
      if (item.situacao === "prevista") return;
      const linha = item.linha || {};
      const numero = String(linha.numero ?? "");
      const metricas = item.metricas || {};
      const tempo = {
        comum: Number(metricas.tempo_comum_min ?? 3),
        pico: Number(metricas.tempo_pico_min ?? metricas.tempo_comum_min ?? 3),
        chuva: Number(metricas.tempo_chuva_min ?? metricas.tempo_comum_min ?? 3)
      };
      if (item.tipo === "Baldeação") {
        const outra = String(linha.linha_transferencia ?? "");
        if (!LINHAS_DO_GRUPO[numero] || !LINHAS_DO_GRUPO[outra]) return;
        const a = `${item.origem}::${numero}`;
        const b = `${item.destino}::${outra}`;
        const aresta = { tipo: "baldeacao", nomeBaldeacao: item.nome_baldeacao || (item.origem === item.destino ? item.origem : `${item.origem} / ${item.destino}`), linhaOrigem: numero, linhaDestino: outra, ...tempo };
        adicionar(a, { destino: b, ...aresta });
        // Evita depender de o JSON repetir a integração nos dois sentidos.
        adicionar(b, { destino: a, ...aresta, linhaOrigem: outra, linhaDestino: numero });
        return;
      }
      if (!LINHAS_DO_GRUPO[numero]) return;
      const meta = LINHAS_DO_GRUPO[numero];
      const trecho = { tipo: "trecho", linha: numero, nomeLinha: meta.nome, cor: meta.cor, ...tempo };
      adicionar(`${item.origem}::${numero}`, { destino: `${item.destino}::${numero}`, ...trecho });
      adicionar(`${item.destino}::${numero}`, { destino: `${item.origem}::${numero}`, ...trecho });
    });
    return grafo;
  } catch (erro) {
    console.error("Falha ao carregar a rede:", erro);
    return null;
  }
}
