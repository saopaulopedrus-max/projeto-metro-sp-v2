let grafoGlobal = null;
let mapaLeaflet = null;
let camadaRota = null;

// Inicializa a aplicação
async function inicializarApp() {
    // 1. Inicializa o mapa Leaflet centrado em SP
    mapaLeaflet = L.map('map').setView([-23.5503, -46.6339], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(mapaLeaflet);

    // 2. Carrega os dados do Grafo
    grafoGlobal = await carregarGrafo();
    if (!grafoGlobal) return;

    const estacoes = Object.keys(grafoGlobal);
    const selectOrigem = document.getElementById('origem');
    const selectDestino = document.getElementById('destino');

    selectOrigem.innerHTML = '<option value="">Selecione a Origem</option>';
    selectDestino.innerHTML = '<option value="">Selecione o Destino</option>';

    estacoes.forEach(estacao => {
        selectOrigem.innerHTML += `<option value="${estacao}">${estacao}</option>`;
        selectDestino.innerHTML += `<option value="${estacao}">${estacao}</option>`;
    });
}

// Escutador do botão Calcular Rota
document.getElementById('btn-calcular').addEventListener('click', () => {
    const origem = document.getElementById('origem').value;
    const destino = document.getElementById('destino').value;
    const modo = document.getElementById('modo-transporte').value;
    const apenasAcessivel = document.getElementById('apenas-acessiveis').checked;

    if (!origem || !destino) {
        alert("Por favor, selecione origem e destino!");
        return;
    }

    if (origem === destino) {
        alert("A origem e o destino devem ser diferentes!");
        return;
    }

    // Executa o algoritmo Dijkstra
    const resultado = calcularRotaDijkstra(grafoGlobal, origem, destino);

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

        divTempo.innerText = `⏱️ Tempo total estimado (${modo.toUpperCase()}): ${tempoFinal} minutos`;

        resultado.caminho.forEach(estacao => {
            const li = document.createElement('li');
            li.innerText = estacao;
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