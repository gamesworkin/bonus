// ============================================================================
// 1. IMPORTAÇÃO DOS MÓDULOS DO FIREBASE (SDK v9/v10 MODULAR)
// ============================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ============================================================================
// 2. CONFIGURAÇÃO DAS CREDENCIAIS DO FIREBASE
// ============================================================================
// Altere apenas os valores abaixo com as informações do seu console do Firebase
const firebaseConfig = {
     apiKey: "AIzaSyAQUCCvXQFuCcRHBqNqg4XxSENa8Xv0WeA",
    authDomain: "gamesbonus.firebaseapp.com",
    databaseURL: "https://gamesbonus-default-rtdb.firebaseio.com", 
    projectId: "gamesbonus",
    storageBucket: "gamesbonus.firebasestorage.app",
    messagingSenderId: "1066854012332",
    appId: "1:1066854012332:web:0caad49aa18422b39b9609"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o banco de dados Firestore
const db = getFirestore(app);

// Array global que armazenará todos os objetos de dados carregados do banco
let gamesData = [];

// ============================================================================
// 3. MAPEAMENTO E SELEÇÃO DE ELEMENTOS DO DOM
// ============================================================================
const gamesGrid = document.getElementById('gamesGrid');
const gameModal = document.getElementById('gameModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');

// ============================================================================
// 4. FUNÇÃO PARA CONTROLAR A BUSCA DE DADOS NO FIRESTORE
// ============================================================================
async function fetchGamesFromFirebase() {
    try {
        console.log("Iniciando a busca de patches no banco de dados...");
        
        // Conecta à coleção chamada 'jogos'. Caso sua coleção tenha outro nome, altere aqui.
        const querySnapshot = await getDocs(collection(db, "jogos")); 
        
        // Limpa o array local antes de colocar os novos dados atualizados
        gamesData = [];
        
        // Percorre cada documento retornado pelo banco de dados
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Cria o objeto estruturado tratando campos vazios com valores padrões (fallback)
            gamesData.push({
                id: doc.id,
                title: data.title || "Sem título informado",
                category: data.category || "Geral",
                platform: data.platform || "PC",
                cover: data.cover || "https://via.placeholder.com/200x250",
                description: data.description || "Nenhuma descrição detalhada foi fornecida para este item.",
                download: data.download || "#" // Armazena a URL de download direto configurada no banco
            });
        });
        
        console.log("Dados carregados com sucesso! Total de itens:", gamesData.length);
        
        // Chama a renderização visual dos cards após terminar o carregamento dos dados
        renderGames();
        
    } catch (error) {
        console.error("Ocorreu um erro crítico ao buscar os dados do Firebase: ", error);
        gamesGrid.innerHTML = `
            <div style="text-align: center; color: #ff3333; width: 100%; padding: 20px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 40px; margin-bottom: 10px;"></i>
                <p>Erro ao carregar a lista de patches. Por favor, tente novamente mais tarde.</p>
            </div>
        `;
    }
}

// ============================================================================
// 5. FUNÇÃO PARA RENDERIZAR OS CARDS NA TELA DO USUÁRIO
// ============================================================================
function renderGames() {
    // Limpa o container da grid antes de injetar os cards
    gamesGrid.innerHTML = '';
    
    // Verifica se a lista retornada do banco está vazia
    if (gamesData.length === 0) {
        gamesGrid.innerHTML = `
            <p style="text-align: center; color: #aaa; width: 100%; padding: 40px;">
                Nenhum patch ou mod disponível no momento.
            </p>
        `;
        return;
    }

    // Cria a estrutura HTML dinâmica para cada jogo da lista
    gamesData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'game-card';
        
        // Injeta a estrutura interna do card de forma limpa
        card.innerHTML = `
            <img src="${item.cover}" alt="${item.title}" class="game-cover" draggable="false">
            <div class="game-info">
                <span class="badge">${item.platform}</span>
                <h3 class="game-title" style="margin: 10px 0 0 0; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h3>
            </div>
        `;
        
        // Vincula o evento de clique para abrir o Modal passando o objeto inteiro do jogo selecionado
        card.addEventListener('click', () => openModal(item));
        
        // Adiciona o card finalizado dentro do container principal da grid
        gamesGrid.appendChild(card);
    });
}

// ============================================================================
// 6. FUNÇÃO PARA ABRIR O MODAL E MANIPULAR O DOWNLOAD DIRETO
// ============================================================================
function openModal(item) {
    // Altera os textos e imagens de exibição do modal baseado no card clicado
    document.getElementById('modalCover').src = item.cover;
    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalDescription').textContent = item.description;
    
    // Configura o link direto do download no elemento <a>
    modalDownloadBtn.href = item.download;
    
    // LÓGICA DE DOWNLOAD DIRETO:
    // Extrai de forma segura o nome do arquivo da URL (ex: 'traducao_re3.exe') removendo parâmetros de cache ou IDs extras (? ou #)
    // Isso força o sistema do usuário a abrir a caixinha nativa para salvar o arquivo na hora, sem sair da página.
    const fileName = item.download.split('/').pop().split('#')[0].split('?')[0] || "patch_download";
    modalDownloadBtn.setAttribute('download', fileName);

    // Injeta as tags de categorias de forma dinâmica dentro do modal
    document.getElementById('modalBadgeContainer').innerHTML = `
        <span class="badge">${item.platform}</span>
        <span class="badge purple">${item.category}</span>
    `;
    
    // Exibe o modal adicionando a classe CSS correspondente
    gameModal.classList.add('open');
}

// ============================================================================
// 7. FUNÇÃO PARA FECHAR O MODAL DE EXIBIÇÃO
// ============================================================================
function closeModal() {
    gameModal.classList.remove('open');
}

// Vincula o clique no botão 'X' para fechar o modal
closeModalBtn.addEventListener('click', closeModal);

// Fecha o modal caso o usuário clique na área escura (fora da caixa de conteúdo)
gameModal.addEventListener('click', (e) => {
    if (e.target === gameModal) {
        closeModal();
    }
});

// ============================================================================
// 8. SCRIPT INTEGRADO DE PROTEÇÃO E SEGURANÇA (ANTI-CÓPIA / ANTI-LINK)
// ============================================================================

// Intercepta e bloqueia o menu de contexto original (Botão direito do mouse) em toda a página
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Intercepta o teclado para mitigar inspeções do código fonte ou cópias de links por atalhos
document.addEventListener('keydown', (e) => {
    // Bloqueia de forma direta a tecla F12
    if (e.key === 'F12') {
        e.preventDefault();
    }
    
    // Bloqueia combinações para ferramentas de desenvolvimento: Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
    }
    
    // Bloqueia o atalho Ctrl+U utilizado para visualizar o código fonte estrutural da página
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
    }
    
    // Bloqueia o Ctrl+C para evitar cópia de textos e Ctrl+S para evitar que baixem o esqueleto da página
    if (e.ctrlKey && (e.key === 'c' || e.key === 's')) {
        e.preventDefault();
    }
});

// Desativa o recurso nativo de selecionar e arrastar textos na interface via cursor
document.addEventListener('selectstart', (e) => {
    e.preventDefault();
});

// ============================================================================
// 9. EVENTO DE INICIALIZAÇÃO DA APLICAÇÃO
// ============================================================================
// Executa a busca no Firebase assim que a árvore do DOM estiver completamente montada e pronta
document.addEventListener('DOMContentLoaded', () => {
    fetchGamesFromFirebase();
});
