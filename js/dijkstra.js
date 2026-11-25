function calcularRotaDijkstra(grafo, inicio, fim, opcoes = {}) {
  const { modoTempo = "comum", linhasInterditadas = [], estacoesInterditadas = [] } = opcoes;
  const bloqueadas = new Set(linhasInterditadas.map(String));
  const fechadas = new Set(estacoesInterditadas);
  if (fechadas.has(inicio) || fechadas.has(fim)) return { caminho: [], tempoTotal: Infinity };

  const nos = Object.keys(grafo);
  const origens = nos.filter(id => id.startsWith(`${inicio}::`) && !bloqueadas.has(id.split("::").at(-1)));
  const destinos = new Set(nos.filter(id => id.startsWith(`${fim}::`) && !bloqueadas.has(id.split("::").at(-1))));
  const dist = new Map(origens.map(id => [id, 0]));
  const anterior = new Map();
  const visitados = new Set();
  let final = null;

  while (true) {
    let atual = null, menor = Infinity;
    for (const no of nos) {
      const d = dist.get(no) ?? Infinity;
      if (!visitados.has(no) && d < menor) { menor = d; atual = no; }
    }
    if (!atual || !Number.isFinite(menor)) break;
    if (destinos.has(atual)) { final = atual; break; }
    visitados.add(atual);
    for (const aresta of grafo[atual] || []) {
      const [estacaoDestino, linhaDestino] = aresta.destino.split("::");
      if (visitados.has(aresta.destino) || fechadas.has(estacaoDestino) || bloqueadas.has(linhaDestino)) continue;
      const custo = Number(aresta[modoTempo] ?? aresta.comum ?? 3);
      const nova = menor + custo;
      if (nova < (dist.get(aresta.destino) ?? Infinity)) {
        dist.set(aresta.destino, nova);
        anterior.set(aresta.destino, { no: atual, aresta });
      }
    }
  }
  if (!final) return { caminho: [], tempoTotal: Infinity };

  const caminho = [];
  let cursor = final;
  while (cursor) {
    const [estacao, linha] = cursor.split("::");
    const meta = LINHAS_DO_GRUPO[linha] || {};
    const prev = anterior.get(cursor);
    caminho.unshift({ estacao, linha, nome: meta.nome, cor: meta.cor, tipo: prev?.aresta.tipo || "inicio", nomeBaldeacao: prev?.aresta.tipo === "baldeacao" ? prev.aresta.nomeBaldeacao : null });
    cursor = prev?.no;
  }
  return { caminho, tempoTotal: dist.get(final) };
}
