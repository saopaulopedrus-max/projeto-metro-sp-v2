async function carregarGrafo() {

    try {

        const resposta =
            await fetch('dados/redejsoncompleto.json');

        if (!resposta.ok) {
            throw new Error(
                `Erro HTTP: ${resposta.status}`
            );
        }

        const dados =
            await resposta.json();

        console.log("JSON CARREGADO");

        const grafo = {};

        function adicionarAresta(
            u,
            v,
            tempoComum,
            tempoPico,
            tempoChuva,
            tipo,
            linha,
            nomeLinha
        ) {

            if (!grafo[u]) {
                grafo[u] = [];
            }

            const cor =
                typeof obterCorLinha === "function"
                    ? obterCorLinha(
                        linha || nomeLinha
                    )
                    : "#666666";

            grafo[u].push({
                destino: v,

                tempoComum,
                tempoPico,
                tempoChuva,

                tipo,
                linha,
                nomeLinha,
                cor
            });
        }

        if (
            dados.rede_transporte &&
            Array.isArray(
                dados.rede_transporte
            )
        ) {

            dados.rede_transporte
                .forEach(item => {

                const origem =
                    item.origem;

                const destino =
                    item.destino;

                const tempoComum =
                    item.metricas
                        ?.tempo_comum_min
                    || 3.0;

                const tempoPico =
                    item.metricas
                        ?.tempo_pico_min
                    || tempoComum;

                const tempoChuva =
                    item.metricas
                        ?.tempo_chuva_min
                    || tempoComum;

                const tipo =
                    item.tipo;

                const linhaNum =
                    item.linha
                        ? item.linha.numero
                        : null;

                const linhaNome =
                    item.linha
                        ? item.linha.nome
                        : null;

                if (
                    tipo ===
                    "Baldeação"
                ) {

                    const linhaTransf =
                        item.linha
                        ? item.linha
                            .linha_transferencia
                        : null;

                    const nomeTransf =
                        item.linha
                        ? item.linha
                            .nome_transferencia
                        : null;

                    adicionarAresta(
                        origem,
                        destino,
                        tempoComum,
                        tempoPico,
                        tempoChuva,
                        "baldeacao",
                        linhaTransf,
                        nomeTransf
                    );

                } else {

                    adicionarAresta(
                        origem,
                        destino,
                        tempoComum,
                        tempoPico,
                        tempoChuva,
                        tipo,
                        linhaNum,
                        linhaNome
                    );

                    adicionarAresta(
                        destino,
                        origem,
                        tempoComum,
                        tempoPico,
                        tempoChuva,
                        tipo,
                        linhaNum,
                        linhaNome
                    );
                }
            });
        }

        console.log(
            "GRAFO CRIADO"
        );

        console.log(grafo);

        return grafo;

    } catch (erro) {

        console.error(
            "Erro ao carregar os dados da rede:",
            erro
        );

        return null;
    }
}