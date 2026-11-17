let grafoGlobal = null;
let mapaLeaflet = null;
let camadaRota = null;

async function inicializarApp() {

    // Inicializa mapa
    mapaLeaflet = L.map("map").setView(
        [-23.5503, -46.6339],
        11
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "© OpenStreetMap"
        }
    ).addTo(mapaLeaflet);

    try {

        grafoGlobal = await carregarGrafo();

        if (!grafoGlobal) {
            console.error("Erro ao carregar rede.json");
            return;
        }

        const estacoes = Object.keys(grafoGlobal);

        const selectOrigem =
            document.getElementById("origem");

        const selectDestino =
            document.getElementById("destino");

        const selectInterditada =
            document.getElementById(
                "estacao-interditada"
            );

        selectOrigem.innerHTML =
            '<option value="">Selecione a Origem</option>';

        selectDestino.innerHTML =
            '<option value="">Selecione o Destino</option>';

        if (selectInterditada) {
            selectInterditada.innerHTML =
                '<option value="">Nenhuma</option>';
        }

        estacoes.forEach(estacao => {

            selectOrigem.innerHTML += `
                <option value="${estacao}">
                    ${estacao}
                </option>
            `;

            selectDestino.innerHTML += `
                <option value="${estacao}">
                    ${estacao}
                </option>
            `;

            if (selectInterditada) {
                selectInterditada.innerHTML += `
                    <option value="${estacao}">
                        ${estacao}
                    </option>
                `;
            }
        });

        console.log("Aplicação carregada.");

    } catch (erro) {
        console.error(
            "Falha ao inicializar:",
            erro
        );
    }
}

function obterCorLinha(linha) {
    return CORES_LINHAS[linha] || "#666666";
}

inicializarApp();
;
        selectOrigem.innerHTML += `<option value="${estacao}">${estacao}</option>`;
        selectDestino.innerHTML += `<option value="${estacao}">${estacao}</option>`;
;


// Escutador do botão Calcular Rota
document.getElementById('btn-calcular').addEventListener('click', () => {

    const origem =
        document.getElementById('origem').value;

    const destino =
        document.getElementById('destino').value;

    const modo =
        document.getElementById('modo-transporte').value;

    const selectInterditada =
    document.getElementById(
        'estacao-interditada'
    );
    
    const apenasAcessivel =
        document.getElementById('apenas-acessiveis').checked;

    const horarioPico =
        document.getElementById('horario-pico').checked;

    const chuva =
        document.getElementById('chuva').checked;
const linhasInterditadas = [];

document
    .querySelectorAll('.linha-interditada:checked')
    .forEach(item => {

        linhasInterditadas.push(
            item.value
        );

    });
    if (!origem || !destino) {
        alert("Por favor, selecione origem e destino!");
        return;
    }

    if (origem === destino) {
        alert("A origem e o destino devem ser diferentes!");
        return;
    }

    // Executa o algoritmo Dijkstra
   let modoTempo = "comum";

if (horarioPico) {
    modoTempo = "pico";
}

if (chuva) {
    modoTempo = "chuva";
}

const resultado =
    calcularRotaDijkstra(
        grafoGlobal,
        origem,
        destino,
        {
            modoTempo,
            linhasInterditadas
        }
    );

    const divResultado = document.getElementById('resultado');
    const divTempo = document.getElementById('tempo-total');
    const listaCaminho = document.getElementById('lista-caminho');

    listaCaminho.innerHTML = '';

    if (resultado.tempoTotal === Infinity) {
        divTempo.innerText = "Não há rota disponível entre essas estações.";
    } else {
        // Multiplicadores de velocidade por modo de transporte
        const multiplicadores = {
            metro: 1.0,
            carro: 1.2,
            moto: 0.8,
            onibus: 1.5,
            pe: 3.5
        };

        const fator = multiplicadores[modo] || 1.0;
        const tempoFinal = Math.round(resultado.tempoTotal * fator);

       const totalEstacoes =
    resultado.caminho.length;

const totalBaldeacoes =
    resultado.caminho.filter(
        item =>
            item.tipo &&
            item.tipo.toLowerCase() === "baldeacao"
    ).length;

divTempo.innerHTML = `
⏱️ Tempo total estimado (${modo.toUpperCase()}): ${tempoFinal} minutos <br>
📍 Estações percorridas: ${totalEstacoes}<br>
🔄 Baldeações: ${totalBaldeacoes}
`;

      let ultimaLinha = null;

resultado.caminho.forEach(item => {

    // Mostrar baldeação
    if (
        item.tipo &&
        item.tipo.toLowerCase() === "baldeacao"
    ) {

        const troca =
            document.createElement("li");

        troca.innerHTML =
            "<strong>🔄 BALDEAÇÃO</strong>";

        troca.style.color = "#ff6600";

        troca.style.marginTop = "10px";

        listaCaminho.appendChild(troca);
    }

    // Mostrar mudança de linha
    if (
        item.nomeLinha &&
        item.nomeLinha !== ultimaLinha
    ) {

        const cabecalho =
            document.createElement("li");

        cabecalho.innerHTML =
            `🚇 <strong>Linha ${item.nomeLinha}</strong>`;

        cabecalho.style.color =
            item.cor || "#000";

        cabecalho.style.fontWeight =
            "bold";

        cabecalho.style.marginTop =
            "8px";

        listaCaminho.appendChild(cabecalho);

        ultimaLinha =
            item.nomeLinha;
    }

    const li =
        document.createElement("li");

    li.textContent =
        item.estacao;

    listaCaminho.appendChild(li);

});
    }

    divResultado.classList.remove('hidden');
});

        const CORES_LINHAS = {
            "1":"#0153a0",  //linha1- azul 
            "3":"#ee372f", //linha3- vermelha
            "5":"#9b3894",  //linha5- lilas
            "10":"008a99#",   //linha10- turuquesa
            "11":"#f68369", //linha11-coral
            "Azul":"#0153a0",
            "Vermelha":"#ee372f",
            "Lilás":"#9b3894",
            "Turquesa":"#008a99",
            "Coral":"#f68369",
        };

        //função para obter a cor corresponde
        function obterCorLinha (linha){
            return CORES_LINHAS[linha] || "#666666"; //retorna cinza caso nao encontre

        }
            

// Executa o carregamento inicial
inicializarApp();