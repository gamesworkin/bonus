// CONFIGURAÇÃO DO FIREBASE (Substitua pelas chaves obtidas no console do Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyAQUCCvXQFuCcRHBqNqg4XxSENa8Xv0WeA",
    authDomain: "gamesbonus.firebaseapp.com",
    databaseURL: "https://gamesbonus-default-rtdb.firebaseio.com/games.json",
    projectId: "gamesbonus",
    storageBucket: "gamesbonus.firebasestorage.app",
    messagingSenderId: "1066854012332",
    appId: "1:1066854012332:web:0caad49aa18422b39b9609"
};

// Inicialização do Firebase
if (firebaseConfig.apiKey !== "AIzaSyAQUCCvXQFuCcRHBqNqg4XxSENa8Xv0WeA") {
    firebase.initializeApp(firebaseConfig);
}
const database = firebaseConfig.apiKey !== "AIzaSyAQUCCvXQFuCcRHBqNqg4XxSENa8Xv0WeA" ? firebase.database() : null;
const auth = firebaseConfig.apiKey !== "AIzaSyAQUCCvXQFuCcRHBqNqg4XxSENa8Xv0WeA" ? firebase.auth() : null;

// ELEMENTOS DA DOM
const gamesMosaic = document.getElementById('gamesMosaic');
const categoryMenu = document.getElementById('categoryMenu');
const platformFiltersContainer = document.getElementById('platformFiltersContainer');
const gameModal = document.getElementById('gameModal');
const loginModal = document.getElementById('loginModal');
const adminPanel = document.getElementById('adminPanel');
const patchForm = document.getElementById('patchForm');
const treeManager = document.getElementById('treeManager');

const btnToggleAdmin = document.getElementById('btnToggleAdmin');
const btnLogout = document.getElementById('btnLogout');

// ESTADOS DE FILTRO (Globais públicos)
let localData = {}; 
let currentCategory = 'all';
let currentPlatform = 'all';
let isAdmin = false;

// ==========================================
// 1. MONITOR DE AUTENTICAÇÃO (FIREBASE)
// ==========================================
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            isAdmin = true;
            btnToggleAdmin.innerHTML = `<i class="fa-solid fa-folder-tree"></i> Abrir Gerenciador`;
            btnLogout.classList.remove('hidden');
        } else {
            isAdmin = false;
            btnToggleAdmin.innerHTML = `<i class="fa-solid fa-lock"></i> Painel Admin`;
            btnLogout.classList.add('hidden');
            adminPanel.classList.add('hidden');
        }
        syncData();
    });
} else {
    syncData(); // Roda em Mock Local caso não tenha Firebase configurado
}

// Evento de Login
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;

    if (auth) {
        auth.signInWithEmailAndPassword(email, pass)
            .then(() => {
                loginModal.classList.remove('open');
                adminPanel.classList.remove('hidden');
                document.getElementById('loginForm').reset();
            })
            .catch(err => alert("Falha: " + err.message));
    } else {
        if (email === "admin@admin.com" && pass === "123456") {
            isAdmin = true;
            btnToggleAdmin.innerHTML = `<i class="fa-solid fa-folder-tree"></i> Abrir Gerenciador`;
            btnLogout.classList.remove('hidden');
            loginModal.classList.remove('open');
            adminPanel.classList.remove('hidden');
            syncData();
        } else {
            alert("Modo de testes local. Use: admin@admin.com / 123456");
        }
    }
});

// Evento de Saída (Logout)
btnLogout.addEventListener('click', () => {
    if (auth) auth.signOut();
    else {
        isAdmin = false;
        btnToggleAdmin.innerHTML = `<i class="fa-solid fa-lock"></i> Painel Admin`;
        btnLogout.classList.add('hidden');
        adminPanel.classList.add('hidden');
        syncData();
    }
});

btnToggleAdmin.addEventListener('click', () => {
    if (isAdmin) adminPanel.classList.remove('hidden');
    else loginModal.classList.add('open');
});

document.getElementById('btnCloseLoginModal').addEventListener('click', () => loginModal.classList.remove('open'));
document.getElementById('btnCloseGameModal').addEventListener('click', () => gameModal.classList.remove('open'));
document.getElementById('btnCloseAdmin').addEventListener('click', () => adminPanel.classList.add('hidden'));


// ==========================================
// 2. MOTOR DE PARTÍCULAS (MOUSE GLOW)
// ==========================================
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];

function resizeCanvas() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.size = Math.random() * 2.5 + 1;
        this.speedX = Math.random() * 1.6 - 0.8;
        this.speedY = Math.random() * 1.6 - 0.8;
        this.color = Math.random() > 0.5 ? '#00f0ff' : '#9d4edd';
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01;
    }
    update() { this.x += this.speedX; this.y += this.speedY; this.alpha -= this.decay; }
    draw() {
        ctx.save(); ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = 6; ctx.shadowColor = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.fill(); ctx.restore();
    }
}
window.addEventListener('mousemove', (e) => {
    for (let i = 0; i < 2; i++) particlesArray.push(new Particle(e.clientX, e.clientY));
});
function handleParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update(); particlesArray[i].draw();
        if (particlesArray[i].alpha <= 0) { particlesArray.splice(i, 1); i--; }
    }
    requestAnimationFrame(handleParticles);
}
handleParticles();


// ==========================================
// 3. CONEXÃO E PERSISTÊNCIA DE DADOS
// ==========================================
function syncData() {
    if (database) {
        database.ref('patches').on('value', (snapshot) => {
            localData = snapshot.val() || {};
            renderApp();
        });
    } else {
        localData = JSON.parse(localStorage.getItem('patchHubPlatformsMock')) || {};
        renderApp();
    }
}

function saveData(id, payload) {
    if (!isAdmin) return alert("Erro: Login necessário.");
    if (database) {
        if (id) database.ref(`patches/${id}`).set(payload);
        else database.ref('patches').push(payload);
    } else {
        const targetId = id || 'patch_' + Date.now();
        localData[targetId] = payload;
        localStorage.setItem('patchHubPlatformsMock', JSON.stringify(localData));
        syncData();
    }
}

window.deleteData = function(id) {
    if (!isAdmin) return alert("Erro: Permissão negada.");
    if (confirm("Deseja realmente deletar este item permanentemente?")) {
        if (database) {
            database.ref(`patches/${id}`).remove();
        } else {
            delete localData[id];
            localStorage.setItem('patchHubPlatformsMock', JSON.stringify(localData));
            syncData();
        }
    }
}


// ==========================================
// 4. RENDERIZAÇÃO PÚBLICA (FILTROS CRUZA)
// ==========================================
function renderApp() {
    gamesMosaic.innerHTML = '';
    
    const categories = new Set();
    const platforms = new Set();
    
    // Mapeamento e extração de filtros dinâmicos
    Object.keys(localData).forEach(key => {
        const item = localData[key];
        if (item.category) categories.add(item.category.trim());
        if (item.platform) platforms.add(item.platform.trim());

        // Regra de cruzamento de filtros (Categoria AND Plataforma)
        const matchCategory = (currentCategory === 'all' || item.category === currentCategory);
        const matchPlatform = (currentPlatform === 'all' || item.platform === currentPlatform);

        if (matchCategory && matchPlatform) {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <div class="game-cover-wrapper">
                    <img src="${item.cover}" alt="${item.title}" loading="lazy">
                    <div class="game-hover-desc">${item.description}</div>
                </div>
                <div class="game-title">${item.title}</div>
            `;
            card.addEventListener('click', () => openModal(item));
            gamesMosaic.appendChild(card);
        }
    });

    renderMenuFilters(categories, platforms);
    if (isAdmin) renderTreeManager();
}

// Constrói Menus Superiores Dinamicamente baseados no JSON
function renderMenuFilters(categories, platforms) {
    // 1. Menu Horizontal (Categorias)
    categoryMenu.innerHTML = `<li class="${currentCategory === 'all' ? 'active' : ''}" data-category="all">Todas as Categorias</li>`;
    categories.forEach(cat => {
        const li = document.createElement('li');
        li.className = currentCategory === cat ? 'active' : '';
        li.textContent = cat;
        li.setAttribute('data-category', cat);
        categoryMenu.appendChild(li);
    });

    // 2. Botões de Aspecto (Agora Plataformas)
    platformFiltersContainer.innerHTML = `<button class="btn-tab ${currentPlatform === 'all' ? 'active' : ''}" data-platform="all">Todas as Plataformas</button>`;
    platforms.forEach(plat => {
        const btn = document.createElement('button');
        btn.className = `btn-tab ${currentPlatform === plat ? 'active' : ''}`;
        btn.textContent = plat;
        btn.setAttribute('data-platform', plat);
        platformFiltersContainer.appendChild(btn);
    });
}

// Cliques nos filtros
categoryMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        currentCategory = e.target.getAttribute('data-category');
        renderApp();
    }
});

platformFiltersContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-tab')) {
        currentPlatform = e.target.getAttribute('data-platform');
        renderApp();
    }
});

function openModal(item) {
    document.getElementById('modalCover').src = item.cover;
    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalDescription').textContent = item.description;
    document.getElementById('modalDownloadBtn').href = item.download;
    
    // Insere Badges Dinâmicas no Modal
    document.getElementById('modalBadgeContainer').innerHTML = `
        <span class="badge">${item.platform}</span>
        <span class="badge purple">${item.category}</span>
    `;
    gameModal.classList.add('open');
}


// ==========================================
// 5. MOTOR DE GERENCIAMENTO EM ÁRVORE (STREAMHUB STYLE)
// ==========================================
function renderTreeManager() {
    treeManager.innerHTML = '';

    // Agrupar dados: Plataforma -> Categoria -> Jogos
    const structuredTree = {};

    Object.keys(localData).forEach(key => {
        const item = localData[key];
        const p = item.platform || "Não Classificado";
        const c = item.category || "Geral";

        if (!structuredTree[p]) structuredTree[p] = {};
        if (!structuredTree[p][c]) structuredTree[p][c] = [];

        structuredTree[p][c].push({ id: key, ...item });
    });

    // Construir Elementos HTML da Árvore Organizacional
    Object.keys(structuredTree).sort().forEach(platformName => {
        const platNode = document.createElement('div');
        platNode.className = 'tree-node-platform';
        
        platNode.innerHTML = `
            <div class="tree-handle">
                <h4><i class="fa-solid fa-layer-group" style="color:var(--accent-neon)"></i> ${platformName}</h4>
                <i class="fa-solid fa-chevron-down text-muted"></i>
            </div>
            <div class="tree-content" id="plat_content_${platformName.replace(/\s+/g, '')}"></div>
        `;

        const platContent = platNode.querySelector('.tree-content');
        
        // Clique para Expandir Plataforma
        platNode.querySelector('.tree-handle').addEventListener('click', () => {
            platContent.classList.toggle('open');
        });

        // Iterar Categorias daquela Plataforma
        Object.keys(structuredTree[platformName]).sort().forEach(catName => {
            const catNode = document.createElement('div');
            catNode.className = 'tree-node-category';
            catNode.innerHTML = `
                <div class="tree-cat-handle">
                    <span><i class="fa-regular fa-folder-open" style="color:var(--accent-purple)"></i> ${catName}</span>
                    <i class="fa-solid fa-angle-right" style="font-size:12px; opacity:0.5"></i>
                </div>
                <div class="tree-games-list tree-content"></div>
            `;

            const gamesListContainer = catNode.querySelector('.tree-games-list');
            
            // Clique para Expandir Categoria
            catNode.querySelector('.tree-cat-handle').addEventListener('click', (e) => {
                e.stopPropagation();
                gamesListContainer.classList.toggle('open');
            });

            // Listar jogos daquela Categoria/Plataforma
            structuredTree[platformName][catName].forEach(game => {
                const gameItem = document.createElement('div');
                gameItem.className = 'tree-game-item';
                gameItem.innerHTML = `
                    <div class="tree-game-info">
                        <img src="${game.cover}">
                        <span>${game.title}</span>
                    </div>
                    <div class="tree-actions">
                        <button class="btn-action btn-edit" data-id="${game.id}"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-action btn-delete" data-id="${game.id}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;

                // Eventos de Ação dos botões da árvore
                gameItem.querySelector('.btn-edit').addEventListener('click', (e) => {
                    e.stopPropagation();
                    editPatch(game.id);
                });
                gameItem.querySelector('.btn-delete').addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteData(game.id);
                });

                gamesListContainer.appendChild(gameItem);
            });

            platContent.appendChild(catNode);
        });

        treeManager.appendChild(platNode);
    });
}


// ==========================================
// 6. FORMULÁRIO OPERACIONAL ADMIN
// ==========================================
document.getElementById('btnNewPatch').addEventListener('click', () => {
    patchForm.reset();
    document.getElementById('patchId').value = '';
    document.getElementById('formTitle').textContent = "Adicionar Novo Conteúdo";
    document.getElementById('patchFormContainer').classList.remove('hidden');
});
document.getElementById('btnCancelForm').addEventListener('click', () => document.getElementById('patchFormContainer').classList.add('hidden'));

patchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('patchId').value;
    const payload = {
        title: document.getElementById('inputTitle').value.trim(),
        platform: document.getElementById('inputPlatform').value.trim(),
        category: document.getElementById('inputCategory').value.trim(),
        cover: document.getElementById('inputCover').value.trim(),
        download: document.getElementById('inputDownload').value.trim(),
        description: document.getElementById('inputDescription').value.trim()
    };
    saveData(id ? id : null, payload);
    document.getElementById('patchFormContainer').classList.add('hidden');
    patchForm.reset();
});

window.editPatch = function(key) {
    const item = localData[key];
    document.getElementById('patchId').value = key;
    document.getElementById('inputTitle').value = item.title;
    document.getElementById('inputPlatform').value = item.platform || '';
    document.getElementById('inputCategory').value = item.category;
    document.getElementById('inputCover').value = item.cover;
    document.getElementById('inputDownload').value = item.download;
    document.getElementById('inputDescription').value = item.description;
    
    document.getElementById('formTitle').textContent = "Editando: " + item.title;
    document.getElementById('patchFormContainer').classList.remove('hidden');
    adminPanel.scrollTo({ top: 0, behavior: 'smooth' });
};


// ==========================================
// 7. RESPALDO BACKUP (IMPORTAÇÃO / EXPORTAÇÃO JSON)
// ==========================================
document.getElementById('btnExportJSON').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "streamhub_patches_backup.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
});

document.getElementById('btnImportJSON').addEventListener('click', () => document.getElementById('fileImport').click());
document.getElementById('fileImport').addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const imported = JSON.parse(event.target.result);
            if (confirm("Esta ação irá injetar os itens do JSON no seu banco atual. Continuar?")) {
                Object.keys(imported).forEach(key => {
                    // Salva preservando ou gerando novos IDs dinâmicos
                    const item = imported[key];
                    if(item.title && item.category && item.platform) {
                        saveData(null, item);
                    }
                });
                alert('Injeção e sincronização concluídas com sucesso!');
            }
        } catch (err) { alert('Falha ao processar arquivo JSON de backup.'); }
    };
    if(e.target.files[0]) reader.readAsText(e.target.files[0]);
});
