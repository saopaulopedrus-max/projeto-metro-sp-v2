async function carregarGrafo() {
    const resposta = await fetch('dados/rede.json');
    const rede = await resposta.json();

    const grafo = {};

    function adicionarAresta(u, v, tempo, tipo, linha = null) {
        if (!grafo[u]) grafo[u] = [];
        grafo[u].push({ destino: v, tempo, tipo, linha });
    }

    rede.conexoes.forEach(c => {
        adicionarAresta(c.origem, c.destino, c.tempo, 'trem', c.linha);
        adicionarAresta(c.destino, c.origem, c.tempo, 'trem', c.linha);
    });

    rede.baldeacoes.forEach(b => {
        adicionarAresta(b.estacaoA, b.estacaoB, b.tempo, 'baldeacao');
        adicionarAresta(b.estacaoB, b.estacaoA, b.tempo, 'baldeacao');
    });

    return grafo;
}

