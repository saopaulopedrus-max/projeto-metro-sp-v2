function calcularRotaDijkstra(
    grafo,
    inicio,
    fim,
    opcoes = {}
) {

    const {
        modoTempo = "comum",
        linhasInterditadas = [],
        estacoesInterditadas = []
    } = opcoes;

    const distancias = {};
    const anteriores = {};
    const visitados = new Set();

    const nos = Object.keys(grafo);

    nos.forEach(no => {
        distancias[no] = Infinity;
        anteriores[no] = null;
    });

    distancias[inicio] = 0;

    while (true) {

        let noAtual = null;
        let menorDistancia = Infinity;

        nos.forEach(no => {

            if (
                !visitados.has(no) &&
                distancias[no] < menorDistancia
            ) {
                menorDistancia = distancias[no];
                noAtual = no;
            }

        });

        if (noAtual === null) {
            break;
        }

        if (noAtual === fim) {
            break;
        }

        visitados.add(noAtual);

        (grafo[noAtual] || []).forEach(vizinho => {

            if (visitados.has(vizinho.destino)) {
                return;
            }

            if (
                estacoesInterditadas.includes(
                    vizinho.destino
                )
            ) {
                return;
            }

            if (
                linhasInterditadas.includes(
                    String(vizinho.linha)
                )
            ) {
                return;
            }

            let tempoTrecho;

            switch (modoTempo) {

                case "pico":
                    tempoTrecho =
                        vizinho.tempoPico ??
                        vizinho.tempoComum;
                    break;

                case "chuva":
                    tempoTrecho =
                        vizinho.tempoChuva ??
                        vizinho.tempoComum;
                    break;

                default:
                    tempoTrecho =
                        vizinho.tempoComum;
            }

            let novaDistancia =
                distancias[noAtual] +
                tempoTrecho;

            if (
                vizinho.tipo &&
                vizinho.tipo.toLowerCase() === "baldeacao"
            ) {
                novaDistancia += 2;
            }

            if (
                novaDistancia <
                distancias[vizinho.destino]
            ) {

                distancias[vizinho.destino] =
                    novaDistancia;

                anteriores[vizinho.destino] = {
                    no: noAtual,
                    tipo: vizinho.tipo,
                    linha: vizinho.linha,
                    nomeLinha: vizinho.nomeLinha,
                    cor: vizinho.cor
                };
            }

        });

    }

    const caminho = [];

    let atual = fim;

    while (atual !== null) {

        caminho.unshift({
            estacao: atual,
            linha:
                anteriores[atual]?.linha || null,
            nomeLinha:
                anteriores[atual]?.nomeLinha || null,
            tipo:
                anteriores[atual]?.tipo || null,
            cor:
                anteriores[atual]?.cor || null
        });

        atual = anteriores[atual]
            ? anteriores[atual].no
            : null;
    }

    return {
        caminho,
        tempoTotal: distancias[fim]
    };
}