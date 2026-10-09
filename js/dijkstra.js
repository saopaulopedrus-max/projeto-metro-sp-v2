function calcularRotaDijkstra(grafo, inicio, fim) {
    const distancias = {}
    const anteriores = {}
    const visitados = new Set();
    const nos = Object.keys(grafo)
//dist-guarda o tempo acumulado do inicio até cada estação
//anteriores guarda o passo anterior de cada estação para podermos reconstituir  o caminho completo no final
//visitados 
    nos.forEach(no => {
        distancia[no] = Infinity;
        anteriores[no] = null;
    });
    distancia[inicio] = 0;

    //loop principal/ infinity por enquanto antes de colococar a distancia real
        while (true){
        let noAtual = null;
        let menosDistancia = Infinity;
    // procura entre todas as estações não visitadas qual o tempo menor
        nos.forEach(no => {
            if (!visitados.has(no) && distancias[no] <menorDistancia){
                menorDistancia = distancias[no];
                noAtual = no;
        
            }
        });
//paragem: se não houver mias nós acessíveis ou se chegámos ao destino
        if (noAtual === null || noAtual === fim) break;

        visitados.add(noAtual);

 //relaxamento das arestas (atualização das distâncias dos vizinhos )
        (grafo[noAtual] || []).forEach(vizinho => {
            if (!visitados.has(vizinho.destino)){
                const novaDistancia < distancias[noAtual] + vizinho.tempo;
                if (novaDistancia < distancias[vizinho.destino]) {
                    distancias[vizinho.destino] = novaDistancia;
                    anteriores[vizinho.destino] = { no: noAtual, tipo: vizinho.tipo}
                }
              }
            }
        });
    }
    //Reconstrução do caminho do destino até a origem
    const caminho = [];
    let passo = fim;

    while (passo) {
        caminho.unshift(passo);
        passo = anteriores[passo] ? anteriores[passo].no : null;
    }

    return{ caminho, tempoTotal: distancias[fim] };
}



