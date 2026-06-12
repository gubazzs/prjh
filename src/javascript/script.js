//CONTROLE DE SESSÃO E LOGIN (SEMPRE NO TOPO)
const usuarioLogado = JSON.parse(sessionStorage.getItem('usuario-tasky'));

//PROJETO ATUAL (vem da URL: dashboard.html?project=ID)
const projetoId = new URLSearchParams(location.search).get('project');

//se não houver usuário logado no sessionStorage, chuta de volta para a tela de login
if (!usuarioLogado) {
    window.location.href = 'inicial.html';
} else if (!projetoId) {
    //sem projeto selecionado, volta para a lista de projetos
    window.location.href = 'projetos.html';
} else {
    //carrega os dados do projeto (nome + cor) para o header
    let projetoAtual = null;
    try {
        const todos = JSON.parse(localStorage.getItem(`tasky-projects-${usuarioLogado.email}`)) || [];
        projetoAtual = todos.find(p => p.id === projetoId) || null;
    } catch { projetoAtual = null; }

    //se o projeto não existe mais, volta para a lista
    if (!projetoAtual) {
        window.location.href = 'projetos.html';
    }

    const projectNameEl = document.getElementById('project-name');
    if (projectNameEl && projetoAtual) {
        projectNameEl.textContent = projetoAtual.name;
        projectNameEl.style.setProperty('--proj-color', projetoAtual.color || '#58a6ff');
        document.title = `Tasky · ${projetoAtual.name}`;
    }

    //Altera as imagens do card para usar a foto real do Firebase do usuário logado
    
    //Se não tiver foto (cadastro por e-mail), mantém o porquinho padrão
    const userPhoto = usuarioLogado.picture || 'imagens/porco.jpg';
    
    const avatarImg = document.getElementById('user-avatar');
    const dropImg = document.getElementById('dropdown-avatar');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');

    if (avatarImg) avatarImg.src = userPhoto;
    if (dropImg) dropImg.src = userPhoto;
    if (userName) userName.textContent = usuarioLogado.name;
    if (userEmail) userEmail.textContent = usuarioLogado.email;
}

//FUNÇÕES DE SALVAMENTO E CARREGAMENTO


//FUNÇÃO: SALVAR BOARD COMPLETO NO LOCALSTORAGE ESPECÍFICO POR USUÁRIO
function salvarBoard() {
    if (!usuarioLogado) return;

    const colunas = [...document.querySelectorAll('.dashboard-column')].map(coluna => {
        const id = coluna.dataset.id;
        const cor = coluna.style.getPropertyValue('--column-color').trim() || '#8b5cf6';
        const titulo = coluna.querySelector('.dashboard-title h2').textContent;
        const cards = [...coluna.querySelectorAll('.dashboard-card')].map(card => {
            const badge = card.querySelector('.badge');
            const dueInput = card.querySelector('.due-input');
            return {
                id: card.dataset.cardId || Date.now().toString(),
                priority: badge ? badge.dataset.priority : 'low',
                priorityText: badge ? badge.querySelector('span').textContent : 'Baixa prioridade',
                title: card.querySelector('.title-card').textContent,
                dueDate: dueInput ? dueInput.value : '',
                description: card.dataset.description || '',
            };
        });

        return { id, cor, titulo, cards };
    });

    const chaveUsuario = `dashboard-data-${usuarioLogado.email}-${projetoId}`;
    localStorage.setItem(chaveUsuario, JSON.stringify(colunas));
    atualizarContadores();
}

//FUNÇÃO: CARREGAR BOARD DO LOCALSTORAGE ESPECÍFICO
function carregarBoard() {
    if (!usuarioLogado) return;

    const chaveUsuario = `dashboard-data-${usuarioLogado.email}-${projetoId}`;
    const dadosSalvos = localStorage.getItem(chaveUsuario);
    const container = document.querySelector('.dashboard');
    if (!container) return;
    
    const addColumnBtn = container.querySelector('.add-column');
    
    //SE NÃO HOUVER DADOS SALVOS (Primeira vez que o usuário entra)
    if (!dadosSalvos) {
        document.querySelectorAll('.dashboard-column').forEach(coluna => {
            const cardsContainer = coluna.querySelector('.dashboard-cards');
            
            //Ativa o drag and drop e os botões da coluna padrão do HTML
            if (cardsContainer) ativarDropColuna(cardsContainer);
            ativarBotoesColuna(coluna); // Ativa os botões e a cor de forma limpa
            
            //ativa os comportamentos dos cards que já vierem fixos no HTML
            coluna.querySelectorAll('.dashboard-card').forEach(ativarCard);
        });
        atualizarContadores();
        return;
    }
    
    //SE HOUVER DADOS SALVOS (Reconstrói o board do zero)
    const colunas = JSON.parse(dadosSalvos);
    container.querySelectorAll('.dashboard-column').forEach(c => c.remove());
    
    colunas.forEach(colunaData => {
        const novaColuna = document.createElement('div');
        novaColuna.classList.add('dashboard-column');
        novaColuna.dataset.id = colunaData.id;
        novaColuna.style.setProperty('--column-color', colunaData.cor);
        
        const fotoUsuario = usuarioLogado.picture || 'imagens/porco.jpg';
        
        novaColuna.innerHTML = `
            <div class="dashboard-title">
                <div class="title-left">
                    <input type="color" class="color-picker" value="${colunaData.cor}" title="Mudar cor da coluna">
                    <h2>${colunaData.titulo}</h2>
                    <span class="card-count">0</span>
                </div>
                <div class="column-actions">
                    <button class="add-card"><i class="fa-solid fa-plus"></i></button>
                    <button class="delete-column"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <div class="dashboard-cards"></div>
        `;
        
        if (addColumnBtn) {
            container.insertBefore(novaColuna, addColumnBtn);
        } else {
            container.appendChild(novaColuna);
        }
        
        const cardsContainer = novaColuna.querySelector('.dashboard-cards');
        ativarDropColuna(cardsContainer);
        ativarBotoesColuna(novaColuna); //ativa botões e cor sem duplicar nada
        
        colunaData.cards.forEach(cardData => {
            const card = document.createElement('div');
            card.classList.add('dashboard-card');
            card.dataset.cardId = cardData.id;
            card.dataset.description = cardData.description || '';

            card.innerHTML = `
                <div class="badge ${cardData.priority}" data-priority="${cardData.priority}">
                    <span>${cardData.priorityText}</span>
                    <i class="fa-solid fa-chevron-down"></i>
                </div>
                <p class="title-card">${cardData.title}</p>
                <i class="fa-solid fa-expand open-card-detail" title="Ver detalhes"></i>
                <div class="card-infos">
                    <label class="card-due" data-empty="${cardData.dueDate ? 'false' : 'true'}">
                        <i class="fa-regular fa-calendar"></i>
                        <input type="date" class="due-input" value="${cardData.dueDate || ''}">
                        <span class="due-clear" title="Limpar prazo"><i class="fa-solid fa-xmark"></i></span>
                    </label>
                    <div class="user">
                        <img src="${fotoUsuario}" alt="user">
                        <i class="fa-solid fa-trash delete-card"></i>
                    </div>
                </div>
            `;

            cardsContainer.appendChild(card);
            ativarCard(card);
        });
    });
}


//sistema de drag and drop
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.dashboard-card:not(.dragging):not(.filtered-out)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function ativarDropColuna(column) {
    column.addEventListener('dragover', e => {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        if (!dragging) return;
        
        e.currentTarget.classList.add('cards-hover');
        const afterElement = getDragAfterElement(column, e.clientY);
        
        if (afterElement == null) {
            column.appendChild(dragging);
        } else {
            column.insertBefore(dragging, afterElement);
        }
    });

    column.addEventListener('dragleave', e => {
        if (e.target === e.currentTarget) {
            e.currentTarget.classList.remove('cards-hover');
        }
    });

    column.addEventListener('drop', e => {
        e.currentTarget.classList.remove('cards-hover');
        salvarBoard();
    });
}

function ativarDragCard(card) {
    card.setAttribute('draggable', 'true');
    
    card.addEventListener('dragstart', e => {
        if (e.target.classList.contains('title-card') ||
            e.target.closest('.badge') ||
            e.target.closest('.card-due') ||
            e.target.classList.contains('delete-card') ||
            e.target.classList.contains('open-card-detail')) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
        e.currentTarget.classList.add('dragging');
    });

    card.addEventListener('dragend', e => {
        e.currentTarget.classList.remove('dragging');
    });
}


//menus, edições e eventos de card
function ativarPrioridade(badge, noSave = false) {
    if (!badge) return;
    badge.addEventListener('click', (e) => {
        e.stopPropagation();

        document.querySelectorAll('.priority-menu').forEach(m => m.remove());

        const menu = document.createElement('div');
        menu.classList.add('priority-menu', 'active');
        menu.innerHTML = `
            <div class="priority-option" data-priority="high">Alta prioridade</div>
            <div class="priority-option" data-priority="medium">Média prioridade</div>
            <div class="priority-option" data-priority="low">Baixa prioridade</div>
        `;
        document.body.appendChild(menu);

        const badgeRect = badge.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const spaceBelow = window.innerHeight - badgeRect.bottom;

        menu.style.left = `${badgeRect.left}px`;
        menu.style.width = `${Math.max(badgeRect.width, 170)}px`;

        if (spaceBelow < menuRect.height + 10 && badgeRect.top > menuRect.height + 10) {
            menu.style.top = `${badgeRect.top - menuRect.height - 6}px`;
        } else {
            menu.style.top = `${badgeRect.bottom + 6}px`;
        }

        menu.querySelectorAll('.priority-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const newPriority = option.dataset.priority;
                const newText = option.textContent;

                badge.classList.remove('high', 'medium', 'low');
                badge.classList.add(newPriority);
                badge.dataset.priority = newPriority;
                badge.querySelector('span').textContent = newText;

                menu.remove();
                if (!noSave) salvarBoard();
            });
        });
    });
}

function ativarTituloEditavel(title) {
    if (!title) return;
    title.setAttribute('contenteditable', 'true');
    title.setAttribute('spellcheck', 'false');

    title.addEventListener('blur', (e) => {
        const novoTexto = e.target.textContent.trim();
        if (novoTexto === '') {
            e.target.textContent = 'Nova tarefa';
        }
        salvarBoard();
    });

    title.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    });

    title.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
}

function criarCard(cardsContainer, tituloInicial = 'Nova tarefa') {
    const card = document.createElement('div');
    card.classList.add('dashboard-card');
    card.dataset.cardId = Date.now().toString();

    const fotoUsuario = usuarioLogado.picture || 'imagens/porco.jpg';

    card.dataset.description = '';
    card.innerHTML = `
        <div class="badge low" data-priority="low">
            <span>Baixa prioridade</span>
            <i class="fa-solid fa-chevron-down"></i>
        </div>
        <p class="title-card">${tituloInicial}</p>
        <i class="fa-solid fa-expand open-card-detail" title="Ver detalhes"></i>
        <div class="card-infos">
            <label class="card-due" data-empty="true">
                <i class="fa-regular fa-calendar"></i>
                <input type="date" class="due-input" value="">
                <span class="due-clear" title="Limpar prazo"><i class="fa-solid fa-xmark"></i></span>
            </label>
            <div class="user">
                <img src="${fotoUsuario}" alt="user">
                <i class="fa-solid fa-trash delete-card"></i>
            </div>
        </div>
    `;

    cardsContainer.appendChild(card);

    ativarCard(card);

    if (tituloInicial === 'Nova tarefa') {
        const title = card.querySelector('.title-card');
        title.focus();
        document.getSelection().selectAllChildren(title);
    }

    salvarBoard();
    aplicarFiltro();
}

function ativarSeletorCor(coluna) {
    const colorPicker = coluna.querySelector('.color-picker');
    if (!colorPicker) return;
    
    colorPicker.addEventListener('input', (e) => {
        const novaCor = e.target.value;
        coluna.style.setProperty('--column-color', novaCor);
        salvarBoard();
    });
}

function ativarBotoesColuna(coluna) {
    const addCardBtn = coluna.querySelector('.add-card');
    if (addCardBtn) {
        addCardBtn.addEventListener('click', () => {
            const cardsContainer = coluna.querySelector('.dashboard-cards');
            criarCard(cardsContainer);
        });
    }
    
    const deleteColumnBtn = coluna.querySelector('.delete-column');
    if (deleteColumnBtn) {
        deleteColumnBtn.addEventListener('click', () => {
            if (confirm('Deletar essa coluna e todos os cards?')) {
                coluna.remove();
                salvarBoard();
            }
        });
    }
    
    const tituloColuna = coluna.querySelector('.dashboard-title h2');
    if (tituloColuna) {
        tituloColuna.setAttribute('contenteditable', 'true');
        tituloColuna.setAttribute('spellcheck', 'false');
        
        tituloColuna.addEventListener('blur', (e) => {
            if (e.target.textContent.trim() === '') {
                e.target.textContent = 'Nova coluna';
            }
            salvarBoard();
        });
        
        tituloColuna.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
            }
        });
    }

    ativarSeletorCor(coluna);
}

//botão Global para adicionar colunas
const addColumnBtn = document.querySelector('.add-column');
if (addColumnBtn) {
    addColumnBtn.addEventListener('click', () => {
        const container = document.querySelector('.dashboard');
        
        const novaColuna = document.createElement('div');
        novaColuna.classList.add('dashboard-column');
        novaColuna.dataset.id = Date.now();
        novaColuna.style.setProperty('--column-color', '#8b5cf6');
        
        novaColuna.innerHTML = `
            <div class="dashboard-title">
                <div class="title-left">
                    <input type="color" class="color-picker" value="#8b5cf6" title="Mudar cor da coluna">
                    <h2>Nova coluna</h2>
                    <span class="card-count">0</span>
                </div>
                <div class="column-actions">
                    <button class="add-card"><i class="fa-solid fa-plus"></i></button>
                    <button class="delete-column"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <div class="dashboard-cards"></div>
        `;
        
        container.insertBefore(novaColuna, addColumnBtn);
        
        const cardsContainer = novaColuna.querySelector('.dashboard-cards');
        ativarDropColuna(cardsContainer);
        ativarBotoesColuna(novaColuna);
        
        const tituloColuna = novaColuna.querySelector('h2');
        tituloColuna.focus();
        document.getSelection().selectAllChildren(tituloColuna);
        
        salvarBoard();
    });
}


//central de cliques
const avatarBtn = document.getElementById('user-avatar');
const userDropdown = document.getElementById('user-dropdown');

document.addEventListener('click', (e) => {
    //fecha menus de prioridade abertos ao clicar em qualquer lugar
    document.querySelectorAll('.priority-menu').forEach(m => m.remove());

    //abre modal de detalhes do card
    if (e.target.classList.contains('open-card-detail')) {
        e.stopPropagation();
        const card = e.target.closest('.dashboard-card');
        if (card) abrirModalCard(card);
        return;
    }

    //lógica para deletar o card se clicar na lixeira
    if (e.target.classList.contains('delete-card')) {
        e.stopPropagation();
        const card = e.target.closest('.dashboard-card');
        if (card) {
            card.remove();
            salvarBoard(); 
        }
        return;
    }

    //lógica unificada do Dropdown de Avatar
    if (avatarBtn && userDropdown) {
        if (avatarBtn.contains(e.target)) {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden'); //abre/fecha se clicar no botão do avatar
        } else {
            userDropdown.classList.add('hidden'); //fecha se clicar fora de tudo
        }
    }
});

//fecha o menu de prioridades no Scroll da página
document.addEventListener('scroll', () => {
    document.querySelectorAll('.priority-menu').forEach(m => m.remove());
}, true);

// Evento de Logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('usuario-tasky');
        window.location.href = 'inicial.html'; 
    });
}


//ATIVA TODOS OS COMPORTAMENTOS DE UM CARD (drag, prioridade, título, prazo)
function ativarCard(card) {
    ativarDragCard(card);
    ativarPrioridade(card.querySelector('.badge'));
    ativarTituloEditavel(card.querySelector('.title-card'));
    ativarPrazo(card);
}

//PRAZO (DUE DATE)
function atualizarPrazoCard(card) {
    const wrap = card.querySelector('.card-due');
    const input = card.querySelector('.due-input');
    if (!wrap || !input) return;

    wrap.classList.remove('due-overdue', 'due-soon', 'due-ok');

    if (!input.value) {
        wrap.dataset.empty = 'true';
        return;
    }
    wrap.dataset.empty = 'false';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const prazo = new Date(input.value + 'T00:00:00');
    const dias = Math.round((prazo - hoje) / 86400000);

    if (dias < 0) wrap.classList.add('due-overdue');
    else if (dias <= 2) wrap.classList.add('due-soon');
    else wrap.classList.add('due-ok');
}

function ativarPrazo(card) {
    const input = card.querySelector('.due-input');
    const clear = card.querySelector('.due-clear');

    if (input) {
        input.addEventListener('mousedown', e => e.stopPropagation());
        input.addEventListener('change', () => {
            atualizarPrazoCard(card);
            salvarBoard();
        });
    }
    if (clear) {
        clear.addEventListener('click', e => {
            e.stopPropagation();
            e.preventDefault();
            if (input) input.value = '';
            atualizarPrazoCard(card);
            salvarBoard();
        });
    }
    atualizarPrazoCard(card);
}

//CONTADOR DE CARDS POR COLUNA
function atualizarContadores() {
    document.querySelectorAll('.dashboard-column').forEach(coluna => {
        const span = coluna.querySelector('.card-count');
        if (span) span.textContent = coluna.querySelectorAll('.dashboard-card:not(.filtered-out)').length;
    });
}

//BUSCA / FILTRO
const searchInput = document.getElementById('search-input');
const priorityFilter = document.getElementById('priority-filter');

function aplicarFiltro() {
    const termo = (searchInput?.value || '').toLowerCase().trim();
    const prio = priorityFilter?.value || 'all';

    document.querySelectorAll('.dashboard-card').forEach(card => {
        const titulo = card.querySelector('.title-card')?.textContent.toLowerCase() || '';
        const desc = (card.dataset.description || '').toLowerCase();
        const cardPrio = card.querySelector('.badge')?.dataset.priority || 'low';
        const matchTexto = !termo || titulo.includes(termo) || desc.includes(termo);
        const matchPrio = prio === 'all' || cardPrio === prio;
        const visivel = matchTexto && matchPrio;

        card.classList.toggle('filtered-out', !visivel);
        card.setAttribute('draggable', visivel ? 'true' : 'false');
    });

    atualizarContadores();
}

if (searchInput) searchInput.addEventListener('input', aplicarFiltro);
if (priorityFilter) priorityFilter.addEventListener('change', aplicarFiltro);

//EXPORTAR / IMPORTAR BOARD EM JSON
function exportarBoard() {
    if (!usuarioLogado) return;
    salvarBoard();
    const chave = `dashboard-data-${usuarioLogado.email}-${projetoId}`;
    const dados = localStorage.getItem(chave) || '[]';
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasky-board-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importarBoard(file) {
    if (!file || !usuarioLogado) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const dados = JSON.parse(e.target.result);
            if (!Array.isArray(dados)) throw new Error('formato inesperado');
            const chave = `dashboard-data-${usuarioLogado.email}-${projetoId}`;
            localStorage.setItem(chave, JSON.stringify(dados));
            location.reload();
        } catch (err) {
            alert('Não consegui importar esse arquivo: ' + err.message);
        }
    };
    reader.readAsText(file);
}

const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importInput = document.getElementById('import-input');

if (exportBtn) exportBtn.addEventListener('click', exportarBoard);
if (importBtn && importInput) {
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', e => {
        if (e.target.files[0]) importarBoard(e.target.files[0]);
    });
}

// ============================================
// LINK DE ANALYTICS
// ============================================
const analyticsLink = document.getElementById('analytics-link');
if (analyticsLink && projetoId) {
    analyticsLink.href = `analytics.html?project=${projetoId}`;
}

// ============================================
// MODAL: GITHUB ISSUES IMPORT
// ============================================
const githubModal = document.getElementById('github-modal');
const githubBtn = document.getElementById('github-btn');
const githubFetchBtn = document.getElementById('github-fetch-btn');
const githubIssuesList = document.getElementById('github-issues-list');
const githubFooter = document.getElementById('github-footer');
const githubSelectedCount = document.getElementById('github-selected-count');

const MOCK_ISSUES = [
    { number: 42, title: 'Adicionar autenticação via OAuth', labels: ['feature'] },
    { number: 38, title: 'Corrigir bug no cálculo de prazo dos cards', labels: ['bug'] },
    { number: 35, title: 'Melhorar performance do drag & drop', labels: ['enhancement'] },
    { number: 29, title: 'Escrever testes unitários para o board', labels: ['feature'] },
    { number: 21, title: 'Documentar endpoints da API', labels: ['docs'] },
    { number: 17, title: 'Adicionar dark/light mode toggle', labels: ['enhancement'] },
];

function abrirGithubModal() {
    githubModal.classList.remove('hidden');
    githubIssuesList.classList.add('hidden');
    githubIssuesList.innerHTML = '';
    githubFooter.classList.add('hidden');
    document.getElementById('github-repo-url').value = '';
}

function fecharGithubModal() { githubModal.classList.add('hidden'); }

function atualizarGithubCount() {
    const checked = githubIssuesList.querySelectorAll('input[type="checkbox"]:checked').length;
    githubSelectedCount.textContent = `${checked} selecionada${checked !== 1 ? 's' : ''}`;
    githubFooter.classList.toggle('hidden', checked === 0);
}

githubBtn?.addEventListener('click', abrirGithubModal);
document.getElementById('github-modal-close')?.addEventListener('click', fecharGithubModal);
githubModal?.addEventListener('click', e => { if (e.target === githubModal) fecharGithubModal(); });

githubFetchBtn?.addEventListener('click', () => {
    const url = document.getElementById('github-repo-url').value.trim();
    if (!url) return;

    githubFetchBtn.textContent = 'Buscando...';
    githubFetchBtn.disabled = true;

    setTimeout(() => {
        githubFetchBtn.textContent = 'Buscar';
        githubFetchBtn.disabled = false;
        githubIssuesList.innerHTML = '';
        githubIssuesList.classList.remove('hidden');

        MOCK_ISSUES.forEach(issue => {
            const el = document.createElement('div');
            el.className = 'github-issue-item';
            el.innerHTML = `
                <input type="checkbox" data-issue="${issue.number}">
                <div class="issue-info">
                    <div class="issue-title">${issue.title}</div>
                    <div class="issue-meta">
                        <span>#${issue.number}</span>
                        ${issue.labels.map(l => `<span class="issue-label ${l}">${l}</span>`).join('')}
                    </div>
                </div>
            `;
            const checkbox = el.querySelector('input');
            el.addEventListener('click', e => {
                if (e.target !== checkbox) checkbox.checked = !checkbox.checked;
                el.classList.toggle('selected', checkbox.checked);
                atualizarGithubCount();
            });
            githubIssuesList.appendChild(el);
        });
        atualizarGithubCount();
    }, 800);
});

document.getElementById('github-add-btn')?.addEventListener('click', () => {
    const checked = [...githubIssuesList.querySelectorAll('input[type="checkbox"]:checked')];
    if (checked.length === 0) return;

    const primeiraColunaCards = document.querySelector('.dashboard-column .dashboard-cards');
    if (!primeiraColunaCards) return;

    checked.forEach(cb => {
        const issueNum = cb.dataset.issue;
        const issueEl = MOCK_ISSUES.find(i => i.number == issueNum);
        if (issueEl) criarCard(primeiraColunaCards, issueEl.title);
    });

    fecharGithubModal();
});

// ============================================
// MODAL: STANDUP GENERATOR
// ============================================
const standupModal = document.getElementById('standup-modal');
const standupBtn = document.getElementById('standup-btn');

function gerarTextoStandup() {
    const colunas = [...document.querySelectorAll('.dashboard-column')];
    const data = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const nomeProjeto = document.getElementById('project-name')?.textContent || 'Projeto';

    let texto = `📋 Standup — ${data}\n`;
    texto += `Projeto: ${nomeProjeto}\n`;
    texto += '─'.repeat(36) + '\n\n';

    let totalCards = 0;
    colunas.forEach(col => {
        const titulo = col.querySelector('.dashboard-title h2')?.textContent || 'Coluna';
        const cards = [...col.querySelectorAll('.dashboard-card:not(.filtered-out)')];
        if (cards.length === 0) return;
        totalCards += cards.length;

        texto += `${titulo} (${cards.length})\n`;
        cards.forEach(card => {
            const title = card.querySelector('.title-card')?.textContent || '';
            const prio = card.querySelector('.badge')?.dataset.priority || 'low';
            const emoji = prio === 'high' ? '🔴' : prio === 'medium' ? '🟡' : '🟢';
            texto += `  ${emoji} ${title}\n`;
        });
        texto += '\n';
    });

    if (totalCards === 0) texto += 'Nenhum card no board ainda.\n';
    texto += '─'.repeat(36) + '\n';
    texto += 'Bloqueios: Nenhum';

    return texto;
}

function abrirStandupModal() {
    document.getElementById('standup-content').textContent = gerarTextoStandup();
    document.getElementById('standup-copied').classList.add('hidden');
    standupModal.classList.remove('hidden');
}

standupBtn?.addEventListener('click', abrirStandupModal);
document.getElementById('standup-modal-close')?.addEventListener('click', () => standupModal.classList.add('hidden'));
standupModal?.addEventListener('click', e => { if (e.target === standupModal) standupModal.classList.add('hidden'); });

document.getElementById('standup-copy-btn')?.addEventListener('click', () => {
    const texto = document.getElementById('standup-content').textContent;
    navigator.clipboard.writeText(texto).then(() => {
        const hint = document.getElementById('standup-copied');
        hint.classList.remove('hidden');
        setTimeout(() => hint.classList.add('hidden'), 2000);
    });
});

// ============================================
// MODAL DE DETALHES DO CARD
// ============================================
const cardModal = document.getElementById('card-modal');
const cardModalBadgeEl = cardModal ? cardModal.querySelector('.card-modal-badge') : null;
const cardModalTitleEl = cardModal ? cardModal.querySelector('.card-modal-title') : null;
const cardModalDescEl = document.getElementById('card-modal-desc');
const cardModalDateEl = document.getElementById('card-modal-date');
let cardModalAtivo = null;

if (cardModalBadgeEl) ativarPrioridade(cardModalBadgeEl, true);

function abrirModalCard(card) {
    if (!cardModal) return;
    cardModalAtivo = card;

    const badge = card.querySelector('.badge');
    const dueInput = card.querySelector('.due-input');

    cardModalBadgeEl.classList.remove('high', 'medium', 'low');
    cardModalBadgeEl.classList.add(badge.dataset.priority);
    cardModalBadgeEl.dataset.priority = badge.dataset.priority;
    cardModalBadgeEl.querySelector('span').textContent = badge.querySelector('span').textContent;

    cardModalTitleEl.textContent = card.querySelector('.title-card').textContent;
    cardModalDescEl.value = card.dataset.description || '';
    cardModalDateEl.value = dueInput ? dueInput.value : '';

    cardModal.classList.remove('hidden');
    setTimeout(() => cardModalTitleEl.focus(), 50);
}

function fecharModalCard() {
    if (!cardModal || !cardModalAtivo) return;

    const badge = cardModalAtivo.querySelector('.badge');
    const dueInput = cardModalAtivo.querySelector('.due-input');

    badge.classList.remove('high', 'medium', 'low');
    badge.classList.add(cardModalBadgeEl.dataset.priority);
    badge.dataset.priority = cardModalBadgeEl.dataset.priority;
    badge.querySelector('span').textContent = cardModalBadgeEl.querySelector('span').textContent;

    const novoTitulo = cardModalTitleEl.textContent.trim();
    cardModalAtivo.querySelector('.title-card').textContent = novoTitulo || 'Nova tarefa';

    cardModalAtivo.dataset.description = cardModalDescEl.value.trim();

    if (dueInput) {
        dueInput.value = cardModalDateEl.value;
        atualizarPrazoCard(cardModalAtivo);
    }

    salvarBoard();
    cardModal.classList.add('hidden');
    cardModalAtivo = null;
}

document.getElementById('card-modal-close')?.addEventListener('click', fecharModalCard);

cardModal?.addEventListener('click', e => {
    if (e.target === cardModal) fecharModalCard();
});

document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (cardModal && !cardModal.classList.contains('hidden')) fecharModalCard();
    if (githubModal && !githubModal.classList.contains('hidden')) fecharGithubModal();
    if (standupModal && !standupModal.classList.contains('hidden')) standupModal.classList.add('hidden');
});

document.getElementById('card-modal-delete')?.addEventListener('click', () => {
    if (!cardModalAtivo) return;
    cardModalAtivo.remove();
    salvarBoard();
    cardModal.classList.add('hidden');
    cardModalAtivo = null;
});

//impede que o título do modal quebre linha com Enter
cardModalTitleEl?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); cardModalTitleEl.blur(); }
});

//inicialização da página
carregarBoard();
aplicarFiltro();