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
const gameModal = document.getElementById('gameModal');
const loginModal = document.getElementById('loginModal');
const adminPanel = document.getElementById('adminPanel');
const patchForm = document.getElementById('patchForm');
const adminTableBody = document.getElementById('adminTableBody');

const btnToggleAdmin = document.getElementById('btnToggleAdmin');
const btnLogout = document.getElementById('btnLogout');

// Estado da aplicação
let localData = {}; 
let currentCategory = 'all';
let isAdmin = false;

// ==========================================
// 1. MONITOR DE AUTENTICAÇÃO (FIREBASE AUTH)
// ==========================================
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Usuário admin está logado
            isAdmin = true;
            btnToggleAdmin.innerHTML = `<i class="fa-solid fa-folder-gear"></i> Abrir Painel`;
            btnLogout.classList.remove('hidden');
        } else {
            // Usuário comum (deslogado)
            isAdmin = false;
            btnToggleAdmin.innerHTML = `<i class="fa-solid fa-lock"></i> Painel Admin`;
            btnLogout.classList.add('hidden');
            adminPanel.classList.add('hidden'); // Esconde o painel se deslogar
        }
        syncData();
    });
} else {
    // Modo offline simulado/mockado por segurança
    syncData();
}

// Lógica de Login
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
            .catch(err => {
                alert("Falha na autenticação: " + err.message);
            });
    } else {
        // Mock de testes para rodar local sem chaves do Firebase
        if (email === "admin@admin.com" && pass === "123456") {
            isAdmin = true;
            btnToggleAdmin.innerHTML = `<i class="fa-solid fa-folder-gear"></i> Abrir Painel`;
            btnLogout.classList.remove('hidden');
            loginModal.classList.remove('open');
            adminPanel.classList.remove('hidden');
        } else {
            alert("Use o login demonstrativo: admin@admin.com / 123456");
        }
    }
});

// Lógica de Logout
btnLogout.addEventListener('click', () => {
    if (auth) {
        auth.signOut();
    } else {
        isAdmin = false;
        btnToggleAdmin.innerHTML = `<i class="fa-solid fa-lock"></i> Painel Admin`;
        btnLogout.classList.add('hidden');
        adminPanel.classList.add('hidden');
        syncData();
    }
});

// Ações para abrir o painel (Pede login se não estiver logado)
btnToggleAdmin.addEventListener('click', () => {
    if (isAdmin) {
        adminPanel.classList.remove('hidden');
    } else {
        loginModal.classList.add('open');
    }
});

// Fechar Modais
document.getElementById('btnCloseLoginModal').addEventListener('click', () => loginModal.classList.remove('open'));
document.getElementById('btnCloseGameModal').addEventListener('click', () => gameModal.classList.remove('open'));
document.getElementById('btnCloseAdmin').addEventListener('click', () => adminPanel.classList.add('hidden'));


// ==========================================
// 2. MOTOR DE PARTÍCULAS DO MOUSE (BRILHOS)
// ==========================================
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.color = Math.random() > 0.5 ? '#00f0ff' : '#9d4edd';
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.015;
    }
    update() {
        this.x += this.speedX; this.y += this.speedY;
        this.alpha -= this.decay;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = 8; ctx.shadowColor = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.fill();
        ctx.restore();
    }
}

window.addEventListener('mousemove', (e) => {
    for (let i = 0; i < 2; i++) {
        particlesArray.push(new Particle(e.clientX, e.clientY));
    }
});

function handleParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
        if (particlesArray[i].alpha <= 0) {
            particlesArray.splice(i, 1);
            i--;
        }
    }
    requestAnimationFrame(handleParticles);
}
handleParticles();


// ==========================================
// 3. ALTERNADOR DE PROPORÇÕES (PS2 / PS1)
// ==========================================
document.getElementById('setViewPS2').addEventListener('click', function() {
    gamesMosaic.className = 'games-mosaic view-ps2';
    this.classList.add('active');
    document.getElementById('setViewPS1').classList.remove('active');
});

document.getElementById('setViewPS1').addEventListener('click', function() {
    gamesMosaic.className = 'games-mosaic view-ps1';
    this.classList.add('active');
    document.getElementById('setViewPS2').classList.remove('active');
});
gamesMosaic.className = 'games-mosaic view-ps2';


// ==========================================
// 4. OPERAÇÕES DE DADOS (DATABASE)
// ==========================================
function syncData() {
    if (database) {
        database.ref('patches').on('value', (snapshot) => {
            localData = snapshot.val() || {};
            renderApp();
        });
    } else {
        localData = JSON.parse(localStorage.getItem('patchHubMock')) || {};
        renderApp();
    }
}

function saveData(id, payload) {
    if (!isAdmin) return alert("Ação bloqueada: Você precisa estar logado!");
    if (database) {
        if (id) database.ref(`patches/${id}`).set(payload);
        else database.ref('patches').push(payload);
    } else {
        const targetId = id || 'local_' + Date.now();
        localData[targetId] = payload;
        localStorage.setItem('patchHubMock', JSON.stringify(localData));
        syncData();
    }
}

window.deleteData = function(id) {
    if (!isAdmin) return alert("Ação bloqueada: Você precisa estar logado!");
    if (confirm("Tem certeza que deseja remover este item?")) {
        if (database) {
            database.ref(`patches/${id}`).remove();
        } else {
            delete localData[id];
            localStorage.setItem('patchHubMock', JSON.stringify(localData));
            syncData();
        }
    }
}


// ==========================================
// 5. RENDERIZAÇÃO DINÂMICA
// ==========================================
function renderApp() {
    gamesMosaic.innerHTML = '';
    adminTableBody.innerHTML = '';
    
    const categories = new Set();
    
    Object.keys(localData).forEach(key => {
        const item = localData[key];
        if (item.category) categories.add(item.category.trim());

        if (currentCategory === 'all' || item.category === currentCategory) {
            // Render Mosaico Público
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <div class="game-cover-wrapper">
                    <img src="${item.cover}" alt="${item.title}">
                    <div class="game-hover-desc">${item.description}</div>
                </div>
                <div class="game-title">${item.title}</div>
            `;
            card.addEventListener('click', () => openModal(item));
            gamesMosaic.appendChild(card);
        }

        // Render Tabela Admin (Se for administrador logado)
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${item.cover}"></td>
            <td><strong>${item.title}</strong></td>
            <td><span class="neon-text">${item.category}</span></td>
            <td>
                <button class="btn-action btn-edit" onclick="editPatch('${key}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-action btn-delete" onclick="deleteData('${key}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        adminTableBody.appendChild(row);
    });

    renderMenu(categories);
}

function renderMenu(categories) {
    categoryMenu.innerHTML = `<li class="${currentCategory === 'all' ? 'active' : ''}" data-category="all">Todos os Patches</li>`;
    categories.forEach(cat => {
        const li = document.createElement('li');
        li.className = currentCategory === cat ? 'active' : '';
        li.textContent = cat;
        li.setAttribute('data-category', cat);
        categoryMenu.appendChild(li);
    });
}

categoryMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        currentCategory = e.target.getAttribute('data-category');
        renderApp();
    }
});

function openModal(item) {
    document.getElementById('modalCover').src = item.cover;
    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalDescription').textContent = item.description;
    document.getElementById('modalDownloadBtn').href = item.download;
    gameModal.classList.add('open');
}


// ==========================================
// 6. FORMULÁRIO E AÇÕES DO PAINEL ADMIN
// ==========================================
document.getElementById('btnNewPatch').addEventListener('click', () => {
    patchForm.reset();
    document.getElementById('patchId').value = '';
    document.getElementById('patchFormContainer').classList.remove('hidden');
});
document.getElementById('btnCancelForm').addEventListener('click', () => document.getElementById('patchFormContainer').classList.add('hidden'));

patchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('patchId').value;
    const payload = {
        title: document.getElementById('inputTitle').value,
        cover: document.getElementById('inputCover').value,
        download: document.getElementById('inputDownload').value,
        category: document.getElementById('inputCategory').value,
        description: document.getElementById('inputDescription').value
    };
    saveData(id ? id : null, payload);
    document.getElementById('patchFormContainer').classList.add('hidden');
    patchForm.reset();
});

window.editPatch = function(key) {
    const item = localData[key];
    document.getElementById('patchId').value = key;
    document.getElementById('inputTitle').value = item.title;
    document.getElementById('inputCover').value = item.cover;
    document.getElementById('inputDownload').value = item.download;
    document.getElementById('inputCategory').value = item.category;
    document.getElementById('inputDescription').value = item.description;
    document.getElementById('patchFormContainer').classList.remove('hidden');
};


// ==========================================
// 7. IMPORTAÇÃO / EXPORTAÇÃO JSON
// ==========================================
document.getElementById('btnExportJSON').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "patchhub_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

document.getElementById('btnImportJSON').addEventListener('click', () => document.getElementById('fileImport').click());
document.getElementById('fileImport').addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            Object.keys(importedData).forEach(key => {
                saveData(null, importedData[key]);
            });
            alert('Importação realizada com sucesso!');
        } catch (err) {
            alert('Erro ao ler arquivo JSON.');
        }
    };
    if(e.target.files[0]) reader.readAsText(e.target.files[0]);
});
