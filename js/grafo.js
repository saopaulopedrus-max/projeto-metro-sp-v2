// Função para carregar e estruturar o grafo a partir do arquivo rede.json
async function carregarGrafo() {
    try {
        const resposta = await fetch('dados/rede.json');
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        const grafo = {};

        // Função auxiliar interna para adicionar arestas no grafo
        function adicionarAresta(u, v, tempo, tipo, linha, nomeLinha) {
            if (!grafo[u]) {
                grafo[u] = [];
            }

            // Garante que a função obterCorLinha existe (definida no index.js)
            const cor = typeof obterCorLinha === 'function' ? obterCorLinha(linha || nomeLinha) : "#666666";

            grafo[u].push({
                destino: v,
                tempo: tempo,
                tipo: tipo,
                linha: linha,
                nomeLinha: nomeLinha,
                cor: cor
            });
        }

        // Processa os dados unificados do rede.json gerado anteriormente
        if (dados.rede_transporte && Array.isArray(dados.rede_transporte)) {
            dados.rede_transporte.forEach(item => {
                const origem = item.origem;
                const destino = item.destino;
                // Pega o tempo comum como peso principal para o Dijkstra
                const tempo = item.metricas ? item.metricas.tempo_comum_min : 3.0;
                const tipo = item.tipo; // "Metrô", "CPTM", "Baldeação", etc.
                const linhaNum = item.linha ? item.linha.numero : null;
                const linhaNome = item.linha ? item.linha.nome : null;

                if (tipo === "Baldeação") {
                    // Para baldeações, adiciona a aresta de transição
                    const linhaTransf = item.linha ? item.linha.linha_transferencia : null;
                    const nomeTransf = item.linha ? item.linha.nome_transferencia : null;
                    adicionarAresta(origem, destino, tempo, 'baldeacao', linhaTransf, nomeTransf);
                } else {
                    // Para trechos normais (Metrô/CPTM), adiciona ida e volta (grafo não-direcionado)
                    adicionarAresta(origem, destino, tempo, tipo, linhaNum, linhaNome);
                    adicionarAresta(destino, origem, tempo, tipo, linhaNum, linhaNome);
                }
            });
        }

        return grafo;

    } catch (erro) {
        console.error("Erro ao carregar os dados da rede:", erro);
        alert("Erro ao carregar o arquivo rede.json. Verifique o console.");
        return null;
    }
}