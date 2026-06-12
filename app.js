// ============================================================================
// CONFIGURAÇÃO DO FIREBASE (SUBSTITUA PELOS SEUS DADOS REAIS DO CONSOLE)
// ATENÇÃO: No databaseURL NÃO coloque ".json" no final! Deixe terminar em .com ou rtdb.firebaseio.com
// ============================================================================
const firebaseConfig = {
    apiKey: "AIzaSyAQUCCvXQFuCcRHBqNqg4XxSENa8Xv0WeA",
    authDomain: "gamesbonus.firebaseapp.com",
    databaseURL: "https://gamesbonus-default-rtdb.firebaseio.com", 
    projectId: "gamesbonus",
    storageBucket: "gamesbonus.firebasestorage.app",
    messagingSenderId: "1066854012332",
    appId: "1:1066854012332:web:0caad49aa18422b39b9609"
};

// Inicialização Estrita
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// ELEMENTOS DOM
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

// ESTADO GLOBAL DO APP
let localData = {}; 
let currentCategory = 'all';
let currentPlatform = 'all';
let isAdmin = false;

// ==========================================
// 1. MONITOR DE FILTRAGEM E AUTENTICAÇÃO REAL
// ==========================================
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
    startDatabaseSync();
});

// Evento de Login Real no Firebase
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, pass)
        .then(() => {
            loginModal.classList.remove('open');
            adminPanel.classList.remove('hidden');
            document.getElementById('loginForm').reset();
        })
        .catch(err => {
            alert("Erro de Autenticação Firebase: " + err.message);
        });
});

// Logout
btnLogout.addEventListener('click', () => {
    auth.signOut().then(() => {
        location.reload();
    });
});

btnToggleAdmin.addEventListener('click', () => {
    if (isAdmin) adminPanel.classList.remove('hidden');
    else loginModal.classList.add('open');
});

document.getElementById('btnCloseLoginModal').addEventListener('click', () => loginModal.classList.remove('open'));
document.getElementById('btnCloseGameModal').addEventListener('click', () => gameModal.classList.remove('open'));
document.getElementById('btnCloseAdmin').addEventListener('click', () => adminPanel.classList.add('hidden'));


// ==========================================
// 2. SINCRONIZAÇÃO E OPERAÇÃO DO BANCO (CRUD)
// ==========================================
function startDatabaseSync() {
    database.ref('patches').on('value', (snapshot) => {
        localData = snapshot.val() || {};
        renderApp();
    });
}

function savePatchToFirebase(id, payload) {
    if (!isAdmin) return alert("Erro: Você não está autenticado.");
    if (id) {
        database.ref(`patches/${id}`).set(payload)
            .then(() => alert("Atualizado com sucesso!"));
    } else {
        database.ref('patches').push(payload)
            .then(() => alert("Cadastrado com sucesso!"));
    }
}

function deleteSinglePatch(id) {
    if (!isAdmin) return alert("Acesso negado.");
    if (confirm("Deletar este jogo permanentemente?")) {
        database.ref(`patches/${id}`).remove();
    }
}


// ==========================================
// 3. RENDERIZAÇÃO DA VITRINE PÚBLICA
// ==========================================
function renderApp() {
    gamesMosaic.innerHTML = '';
    const categories = new Set();
    const platforms = new Set();
    
    Object.keys(localData).forEach(key => {
        const item = localData[key];
        if (item.category) categories.add(item.category.trim());
        if (item.platform) platforms.add(item.platform.trim());

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

    renderFilters(categories, platforms);
    if (isAdmin) renderTreeManager();
}

function renderFilters(categories, platforms) {
    // Categorias Menu Superior
    categoryMenu.innerHTML = `<li class="${currentCategory === 'all' ? 'active' : ''}" data-category="all">Todas as Categorias</li>`;
    categories.forEach(cat => {
        const li = document.createElement('li');
        li.className = currentCategory === cat ? 'active' : '';
        li.textContent = cat;
        li.setAttribute('data-category', cat);
        categoryMenu.appendChild(li);
    });

    // Plataformas
    platformFiltersContainer.innerHTML = `<button class="btn-tab ${currentPlatform === 'all' ? 'active' : ''}" data-platform="all">Todas as Plataformas</button>`;
    platforms.forEach(plat => {
        const btn = document.createElement('button');
        btn.className = `btn-tab ${currentPlatform === plat ? 'active' : ''}`;
        btn.textContent = plat;
        btn.setAttribute('data-platform', plat);
        platformFiltersContainer.appendChild(btn);
    });
}

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
    document.getElementById('modalBadgeContainer').innerHTML = `
        <span class="badge">${item.platform}</span>
        <span class="badge purple">${item.category}</span>
    `;
    gameModal.classList.add('open');
}


// ============================================================================
// 4. ESTRUTURAÇÃO EM ÁRVORE AVANÇADA (CONTROLE TOTAL DE ATRIBUTOS)
// ============================================================================
function renderTreeManager() {
    treeManager.innerHTML = '';
    const tree = {};

    // Remapeia os dados estruturando por [Plataforma][Categoria] -> Jogos
    Object.keys(localData).forEach(key => {
        const item = localData[key];
        const p = item.platform || "Não Classificado";
        const c = item.category || "Geral";
        if (!tree[p]) tree[p] = {};
        if (!tree[p][c]) tree[p][c] = [];
        tree[p][c].push({ id: key, ...item });
    });

    // 1. LOOP DE PLATAFORMAS
    Object.keys(tree).sort().forEach(platName => {
        const platNode = document.createElement('div');
        platNode.className = 'tree-node-platform';
        platNode.innerHTML = `
            <div class="tree-handle">
                <h4><i class="fa-solid fa-layer-group" style="color:var(--accent-neon)"></i> ${platName}</h4>
                <div class="tree-controls-wrapper">
                    <div class="tree-actions">
                        <button class="btn-action btn-edit" title="Editar nome da Plataforma em todos os jogos" onclick="event.stopPropagation(); batchEditAttribute('platform', '${platName}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-action btn-export-mini" title="Exportar esta Plataforma" onclick="event.stopPropagation(); batchExportTree('${platName}', null)"><i class="fa-solid fa-download"></i></button>
                        <button class="btn-action btn-delete" title="Deletar todos os jogos desta plataforma" onclick="event.stopPropagation(); batchDeleteTree('${platName}', null)"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    <i class="fa-solid fa-chevron-down text-muted"></i>
                </div>
            </div>
            <div class="tree-content"></div>
        `;

        const platContent = platNode.querySelector('.tree-content');
        platNode.querySelector('.tree-handle').addEventListener('click', () => platContent.classList.toggle('open'));

        // 2. LOOP DE CATEGORIAS DENTRO DA PLATAFORMA
        Object.keys(tree[platName]).sort().forEach(catName => {
            const catNode = document.createElement('div');
            catNode.className = 'tree-node-category';
            catNode.innerHTML = `
                <div class="tree-cat-handle">
                    <span><i class="fa-regular fa-folder-open" style="color:var(--accent-purple)"></i> ${catName}</span>
                    <div class="tree-actions" onclick="event.stopPropagation();">
                        <button class="btn-action btn-edit" title="Editar nome da Categoria" onclick="batchEditAttribute('category', '${catName}', '${platName}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-action btn-export-mini" title="Exportar esta Categoria" onclick="batchExportTree('${platName}', '${catName}')"><i class="fa-solid fa-download"></i></button>
                        <button class="btn-action btn-delete" title="Deletar esta categoria nesta plataforma" onclick="batchDeleteTree('${platName}', '${catName}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="tree-games-list tree-content"></div>
            `;

            const gamesList = catNode.querySelector('.tree-games-list');
            catNode.querySelector('.tree-cat-handle').addEventListener('click', () => gamesList.classList.toggle('open'));

            // 3. LOOP DOS JOGOS INDIVIDUAIS
            tree[platName][catName].forEach(game => {
                const gameItem = document.createElement('div');
                gameItem.className = 'tree-game-item';
                gameItem.innerHTML = `
                    <div class="tree-game-info">
                        <img src="${game.cover}">
                        <span>${game.title}</span>
                    </div>
                    <div class="tree-actions">
                        <button class="btn-action btn-edit" onclick="triggerEditForm('${game.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-action btn-delete" onclick="deleteSinglePatch('${game.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                gamesList.appendChild(gameItem);
            });

            platContent.appendChild(catNode);
        });

        treeManager.appendChild(platNode);
    });
}


// ==========================================
// 5. FUNÇÕES DE EDICÃO, EXCLUSÃO E EXPORTAÇÃO EM MASSA
// ==========================================

// Modificar Atributos Globais (Mudar nome de plataforma ou categoria em lote)
window.batchEditAttribute = function(type, oldValue, contextPlatform = null) {
    const newValue = prompt(`Alterar o nome de ${type === 'platform' ? 'Plataforma' : 'Categoria'} de "${oldValue}" para:`, oldValue);
    if (!newValue || newValue.trim() === oldValue) return;

    const updates = {};
    Object.keys(localData).forEach(key => {
        const item = localData[key];
        if (type === 'platform' && item.platform === oldValue) {
            updates[`patches/${key}/platform`] = newValue.trim();
        } else if (type === 'category' && item.category === oldValue && (!contextPlatform || item.platform === contextPlatform)) {
            updates[`patches/${key}/category`] = newValue.trim();
        }
    });

    database.ref().update(updates).then(() => alert("Atualização em lote concluída!"));
};

// Exportação Filtrada por Galho
window.batchExportTree = function(platform, category) {
    const filtered = {};
    Object.keys(localData).forEach(key => {
        const item = localData[key];
        const matchP = item.platform === platform;
        const matchC = !category || item.category === category;
        if (matchP && matchC) filtered[key] = item;
    });

    const title = category ? `backup_${platform}_${category}` : `backup_${platform}`;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
};

// Exclusão em Massa por Galho da Árvore
window.batchDeleteTree = function(platform, category) {
    const scope = category ? `a categoria "${category}" da plataforma "${platform}"` : `a plataforma "${platform}" COMPLETA`;
    if (!confirm(`CUIDADO: Deseja apagar TODOS os patches pertencentes a ${scope}? Essa ação não tem volta.`)) return;

    const updates = {};
    Object.keys(localData).forEach(key => {
        const item = localData[key];
        const matchP = item.platform === platform;
        const matchC = !category || item.category === category;
        if (matchP && matchC) {
            updates[`patches/${key}`] = null; // Envia nulo para remover do nó do Realtime Database
        }
    });

    database.ref().update(updates).then(() => alert("Exclusão em massa realizada com sucesso."));
};


// ==========================================
// 6. FORMULÁRIO DE ENTRADA
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
    savePatchToFirebase(id ? id : null, payload);
    document.getElementById('patchFormContainer').classList.add('hidden');
    patchForm.reset();
});

window.triggerEditForm = function(key) {
    const item = localData[key];
    document.getElementById('patchId').value = key;
    document.getElementById('inputTitle').value = item.title;
    document.getElementById('inputPlatform').value = item.platform || '';
    document.getElementById('inputCategory').value = item.category;
    document.getElementById('inputCover').value = item.cover;
    document.getElementById('inputDownload').value = item.download;
    document.getElementById('inputDescription').value = item.description;
    
    document.getElementById('formTitle').textContent = "Editando Jogo: " + item.title;
    document.getElementById('patchFormContainer').classList.remove('hidden');
    adminPanel.scrollTo({ top: 0, behavior: 'smooth' });
};


// ==========================================
// 7. BACKUP TOTAL (IMPORTAÇÃO / EXPORTAÇÃO)
// ==========================================
document.getElementById('btnExportJSON').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "patchhub_database_full.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
});

document.getElementById('btnImportJSON').addEventListener('click', () => document.getElementById('fileImport').click());
document.getElementById('fileImport').addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            if (confirm("Injetar registros do JSON selecionado no banco do Firebase?")) {
                const updates = {};
                Object.keys(importedData).forEach(key => {
                    const item = importedData[key];
                    if(item.title) {
                        const newId = database.ref().child('patches').push().key;
                        updates[`patches/${newId}`] = item;
                    }
                });
                database.ref().update(updates).then(() => alert('Sincronização do JSON finalizada no Firebase!'));
            }
        } catch (err) { alert('Formato de JSON inválido.'); }
    };
    if(e.target.files[0]) reader.readAsText(e.target.files[0]);
});


// ==========================================
// 8. EFEITO DE GLOW DE PARTÍCULAS
// ==========================================
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas); resizeCanvas();

class Particle {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 1.2 - 0.6;
        this.speedY = Math.random() * 1.2 - 0.6;
        this.color = Math.random() > 0.5 ? '#00f0ff' : '#9d4edd';
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01;
    }
    update() { this.x += this.speedX; this.y += this.speedY; this.alpha -= this.decay; }
    draw() {
        ctx.save(); ctx.globalAlpha = this.alpha;
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
