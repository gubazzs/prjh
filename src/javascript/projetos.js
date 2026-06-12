//CONTROLE DE SESSÃO (igual ao dashboard)
const usuarioLogado = JSON.parse(sessionStorage.getItem('usuario-tasky'));

if (!usuarioLogado) {
    window.location.href = 'inicial.html';
}

//Preenche avatar/menu do usuário
const userPhoto = (usuarioLogado && usuarioLogado.picture) || 'imagens/porco.jpg';
const avatarImg = document.getElementById('user-avatar');
const dropImg = document.getElementById('dropdown-avatar');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');

if (usuarioLogado) {
    if (avatarImg) avatarImg.src = userPhoto;
    if (dropImg) dropImg.src = userPhoto;
    if (userName) userName.textContent = usuarioLogado.name;
    if (userEmail) userEmail.textContent = usuarioLogado.email;
}

//CHAVES DE ARMAZENAMENTO
const CHAVE_PROJETOS = `tasky-projects-${usuarioLogado.email}`;
const chaveBoard = (projetoId) => `dashboard-data-${usuarioLogado.email}-${projetoId}`;

//PALETA DE CORES
const CORES = ['#58a6ff', '#d573b6', '#6ed0bc', '#fea065', '#a78bfa', '#f87171', '#34d399', '#fbbf24'];

//FUNÇÕES DE DADOS
function lerProjetos() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_PROJETOS)) || [];
    } catch {
        return [];
    }
}

function salvarProjetos(projetos) {
    localStorage.setItem(CHAVE_PROJETOS, JSON.stringify(projetos));
}

//MIGRAÇÃO: board antigo (sem projeto) vira "Meu primeiro projeto"
function migrarBoardAntigo() {
    if (localStorage.getItem(CHAVE_PROJETOS)) return; //já existe estrutura de projetos

    const chaveAntiga = `dashboard-data-${usuarioLogado.email}`;
    const boardAntigo = localStorage.getItem(chaveAntiga);

    if (boardAntigo) {
        const id = Date.now().toString();
        const projeto = {
            id,
            name: 'Meu primeiro projeto',
            description: 'Tarefas que você já tinha no Tasky.',
            color: '#58a6ff',
            createdAt: Date.now()
        };
        salvarProjetos([projeto]);
        localStorage.setItem(chaveBoard(id), boardAntigo);
        localStorage.removeItem(chaveAntiga);
    } else {
        salvarProjetos([]); //inicializa vazio
    }
}

//RENDERIZAÇÃO
const grid = document.getElementById('projetos-grid');
const emptyState = document.getElementById('empty-state');

function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
}

function contarTarefas(projetoId) {
    try {
        const colunas = JSON.parse(localStorage.getItem(chaveBoard(projetoId))) || [];
        return colunas.reduce((total, col) => total + (col.cards ? col.cards.length : 0), 0);
    } catch {
        return 0;
    }
}

function renderizar() {
    const projetos = lerProjetos();
    grid.innerHTML = '';

    if (projetos.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    projetos.forEach(proj => {
        const total = contarTarefas(proj.id);
        const card = document.createElement('div');
        card.className = 'projeto-card';
        card.dataset.id = proj.id;
        card.setAttribute('draggable', 'true');
        card.style.setProperty('--proj-color', proj.color);

        card.innerHTML = `
            <div class="proj-actions">
                <button class="proj-share" title="Compartilhar"><i class="fa-solid fa-share-nodes"></i></button>
                <button class="proj-edit" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="proj-delete" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="proj-icon"><i class="fa-solid fa-diagram-project"></i></div>
            <h3>${escapar(proj.name)}</h3>
            <p>${escapar(proj.description) || '<em style="opacity:.6">Sem descrição</em>'}</p>
            <div class="projeto-meta">
                <i class="fa-regular fa-square-check"></i>
                ${total} ${total === 1 ? 'tarefa' : 'tarefas'}
            </div>
        `;

        //abrir board ao clicar no card (exceto nos botões de ação)
        card.addEventListener('click', (e) => {
            if (e.target.closest('.proj-actions')) return;
            window.location.href = `dashboard.html?project=${proj.id}`;
        });

        card.querySelector('.proj-share').addEventListener('click', (e) => {
            e.stopPropagation();
            abrirShareModal(proj);
        });

        card.querySelector('.proj-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModal(proj);
        });

        card.querySelector('.proj-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            excluirProjeto(proj);
        });

        grid.appendChild(card);
    });
}

function excluirProjeto(proj) {
    if (!confirm(`Excluir o projeto "${proj.name}" e todas as suas tarefas?`)) return;
    const projetos = lerProjetos().filter(p => p.id !== proj.id);
    salvarProjetos(projetos);
    localStorage.removeItem(chaveBoard(proj.id));
    renderizar();
}

//MODAL DE CRIAR / EDITAR
const modal = document.getElementById('projeto-modal');
const modalTitle = document.getElementById('modal-title');
const form = document.getElementById('projeto-form');
const inputId = document.getElementById('projeto-id');
const inputNome = document.getElementById('projeto-nome');
const inputDesc = document.getElementById('projeto-desc');
const corOpcoes = document.getElementById('cor-opcoes');
let corSelecionada = CORES[0];

//monta a paleta de cores
CORES.forEach(cor => {
    const bolinha = document.createElement('div');
    bolinha.className = 'cor-bolinha';
    bolinha.style.background = cor;
    bolinha.style.color = cor;
    bolinha.dataset.cor = cor;
    bolinha.addEventListener('click', () => {
        corSelecionada = cor;
        document.querySelectorAll('.cor-bolinha').forEach(b => b.classList.remove('ativa'));
        bolinha.classList.add('ativa');
    });
    corOpcoes.appendChild(bolinha);
});

function marcarCor(cor) {
    corSelecionada = cor;
    document.querySelectorAll('.cor-bolinha').forEach(b => {
        b.classList.toggle('ativa', b.dataset.cor === cor);
    });
}

function abrirModal(proj = null) {
    if (proj) {
        modalTitle.textContent = 'Editar projeto';
        inputId.value = proj.id;
        inputNome.value = proj.name;
        inputDesc.value = proj.description || '';
        marcarCor(proj.color || CORES[0]);
    } else {
        modalTitle.textContent = 'Novo projeto';
        inputId.value = '';
        inputNome.value = '';
        inputDesc.value = '';
        marcarCor(CORES[0]);
    }
    modal.classList.remove('hidden');
    setTimeout(() => inputNome.focus(), 50);
}

function fecharModal() {
    modal.classList.add('hidden');
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = inputNome.value.trim();
    if (!nome) return;

    const projetos = lerProjetos();
    const id = inputId.value;

    if (id) {
        //edição
        const proj = projetos.find(p => p.id === id);
        if (proj) {
            proj.name = nome;
            proj.description = inputDesc.value.trim();
            proj.color = corSelecionada;
        }
    } else {
        //criação
        projetos.push({
            id: Date.now().toString(),
            name: nome,
            description: inputDesc.value.trim(),
            color: corSelecionada,
            createdAt: Date.now()
        });
    }

    salvarProjetos(projetos);
    fecharModal();
    renderizar();
});

//EVENTOS DE UI
document.getElementById('novo-projeto-btn').addEventListener('click', () => abrirModal());
document.getElementById('empty-novo-btn').addEventListener('click', () => abrirModal());
document.getElementById('modal-close').addEventListener('click', fecharModal);
document.getElementById('modal-cancelar').addEventListener('click', fecharModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) fecharModal();
});

//MENU DO AVATAR
const avatarBtn = document.getElementById('user-avatar');
const userDropdown = document.getElementById('user-dropdown');

document.addEventListener('click', (e) => {
    if (avatarBtn && userDropdown) {
        if (avatarBtn.contains(e.target)) {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        } else {
            userDropdown.classList.add('hidden');
        }
    }
});

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('usuario-tasky');
        window.location.href = 'inicial.html';
    });
}

// ============================================
// COMPARTILHAMENTO DE PROJETOS
// ============================================
function codificar(obj) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

function decodificar(str) {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
}

function gerarLink(proj) {
    const board = JSON.parse(localStorage.getItem(chaveBoard(proj.id))) || [];
    const payload = { projeto: proj, board };
    const encoded = codificar(payload);
    return `${location.href.split('?')[0]}?import=${encoded}`;
}

function abrirShareModal(proj) {
    const modal = document.getElementById('share-modal');
    document.getElementById('share-modal-title').textContent = `Compartilhar "${proj.name}"`;

    const info = document.getElementById('share-project-info');
    info.innerHTML = `
        <div class="share-proj-preview" style="--proj-color: ${proj.color}">
            <div class="share-proj-dot"></div>
            <div>
                <strong>${escapar(proj.name)}</strong>
                <span>${contarTarefas(proj.id)} tarefa${contarTarefas(proj.id) !== 1 ? 's' : ''}</span>
            </div>
        </div>
    `;

    const link = gerarLink(proj);
    document.getElementById('share-link-input').value = link;
    document.getElementById('share-copied').classList.add('hidden');
    modal.classList.remove('hidden');
}

document.getElementById('share-close').addEventListener('click', () => {
    document.getElementById('share-modal').classList.add('hidden');
});

document.getElementById('share-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('share-modal')) {
        document.getElementById('share-modal').classList.add('hidden');
    }
});

document.getElementById('share-copy-btn').addEventListener('click', () => {
    const input = document.getElementById('share-link-input');
    navigator.clipboard.writeText(input.value).then(() => {
        const hint = document.getElementById('share-copied');
        hint.classList.remove('hidden');
        setTimeout(() => hint.classList.add('hidden'), 2500);
    });
});

// IMPORTAÇÃO VIA LINK
const importParam = new URLSearchParams(location.search).get('import');

if (importParam && usuarioLogado) {
    try {
        const { projeto, board } = decodificar(importParam);
        if (!projeto?.name) throw new Error();

        const preview = document.getElementById('import-project-preview');
        preview.innerHTML = `
            <div class="share-proj-preview" style="--proj-color: ${projeto.color || '#58a6ff'}">
                <div class="share-proj-dot"></div>
                <div>
                    <strong>${escapar(projeto.name)}</strong>
                    <span>${(board || []).reduce((t, c) => t + (c.cards?.length || 0), 0)} tarefa${board?.reduce((t,c)=>t+(c.cards?.length||0),0) !== 1 ? 's' : ''} · ${(board||[]).length} coluna${(board||[]).length !== 1 ? 's' : ''}</span>
                </div>
            </div>
        `;

        document.getElementById('import-share-modal').classList.remove('hidden');

        document.getElementById('import-confirmar').addEventListener('click', () => {
            const novoId = Date.now().toString();
            const projetos = lerProjetos();
            projetos.push({ ...projeto, id: novoId, createdAt: Date.now() });
            salvarProjetos(projetos);
            localStorage.setItem(chaveBoard(novoId), JSON.stringify(board || []));
            history.replaceState(null, '', location.pathname);
            document.getElementById('import-share-modal').classList.add('hidden');
            renderizar();
        });

        document.getElementById('import-ignorar').addEventListener('click', () => {
            history.replaceState(null, '', location.pathname);
            document.getElementById('import-share-modal').classList.add('hidden');
        });
    } catch {
        history.replaceState(null, '', location.pathname);
    }
}

// ============================================
// ORDENAÇÃO POR DRAG & DROP
// ============================================
function ativarOrdenacao() {
    const grid = document.getElementById('projetos-grid');
    let dragging = null;
    let mousedownEl = null;

    document.addEventListener('mousedown', e => { mousedownEl = e.target; });

    grid.addEventListener('dragstart', e => {
        const card = e.target.closest('.projeto-card');
        if (!card) return;
        if (mousedownEl?.closest('.proj-actions')) { e.preventDefault(); return; }
        dragging = card;
        requestAnimationFrame(() => card.classList.add('dragging-proj'));
    });

    grid.addEventListener('dragend', () => {
        if (!dragging) return;
        dragging.classList.remove('dragging-proj');
        const ids = [...grid.querySelectorAll('.projeto-card')].map(c => c.dataset.id);
        const projetos = lerProjetos();
        salvarProjetos(ids.map(id => projetos.find(p => p.id === id)).filter(Boolean));
        dragging = null;
    });

    grid.addEventListener('dragover', e => {
        e.preventDefault();
        if (!dragging) return;
        const target = e.target.closest('.projeto-card');
        if (!target || target === dragging) return;
        const cards = [...grid.querySelectorAll('.projeto-card')];
        if (cards.indexOf(dragging) > cards.indexOf(target)) {
            grid.insertBefore(dragging, target);
        } else {
            grid.insertBefore(dragging, target.nextSibling);
        }
    });
}

//INICIALIZAÇÃO
migrarBoardAntigo();
renderizar();
ativarOrdenacao();
