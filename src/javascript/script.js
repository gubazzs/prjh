// ==========================================
// 1. CONTROLE DE SESSÃO E LOGIN (SEMPRE NO TOPO)
// ==========================================
const usuarioLogado = JSON.parse(sessionStorage.getItem('usuario-tasky'));

// Se não houver usuário logado no sessionStorage, chuta de volta para a tela de login
if (!usuarioLogado) {
    window.location.href = 'inicial.html'; 
} else {
    // Altera as imagens do card para usar a foto real do Firebase do usuário logado
    // Se não tiver foto (cadastro por e-mail), mantém o porquinho padrão
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

// ==========================================
// 2. FUNÇÕES DE SALVAMENTO E CARREGAMENTO
// ==========================================

/* FUNÇÃO: SALVAR BOARD COMPLETO NO LOCALSTORAGE ESPECÍFICO POR USUÁRIO */
function salvarBoard() {
    if (!usuarioLogado) return;

    const colunas = [...document.querySelectorAll('.dashboard-column')].map(coluna => {
        const id = coluna.dataset.id;
        const cor = coluna.style.getPropertyValue('--column-color').trim() || '#8b5cf6';
        const titulo = coluna.querySelector('.dashboard-title h2').textContent;
        const cards = [...coluna.querySelectorAll('.dashboard-card')].map(card => {
            const badge = card.querySelector('.badge');
            return {
                id: card.dataset.cardId || Date.now().toString(),
                priority: badge ? badge.dataset.priority : 'low',
                priorityText: badge ? badge.querySelector('span').textContent : 'Baixa prioridade',
                title: card.querySelector('.title-card').textContent,
            };
        });
        
        return { id, cor, titulo, cards };
    });

    const chaveUsuario = `dashboard-data-${usuarioLogado.email}`;
    localStorage.setItem(chaveUsuario, JSON.stringify(colunas));
}

/* FUNÇÃO: CARREGAR BOARD DO LOCALSTORAGE ESPECÍFICO */
function carregarBoard() {
    if (!usuarioLogado) return;

    const chaveUsuario = `dashboard-data-${usuarioLogado.email}`;
    const dadosSalvos = localStorage.getItem(chaveUsuario);
    const container = document.querySelector('.dashboard');
    if (!container) return;
    
    const addColumnBtn = container.querySelector('.add-column');
    
    // SE NÃO HOUVER DADOS SALVOS (Primeira vez que o usuário entra)
    if (!dadosSalvos) {
        document.querySelectorAll('.dashboard-column').forEach(coluna => {
            const cardsContainer = coluna.querySelector('.dashboard-cards');
            
            // Ativa o drag and drop e os botões da coluna padrão do HTML
            if (cardsContainer) ativarDropColuna(cardsContainer);
            ativarBotoesColuna(coluna); // Ativa os botões e a cor de forma limpa
            
            // Ativa os comportamentos dos cards que já vierem fixos no HTML
            coluna.querySelectorAll('.dashboard-card').forEach(ativarDragCard);
            coluna.querySelectorAll('.badge').forEach(ativarPrioridade);
            coluna.querySelectorAll('.title-card').forEach(ativarTituloEditavel);
        });
        return;
    }
    
    // SE HOUVER DADOS SALVOS (Reconstrói o board do zero)
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
        ativarBotoesColuna(novaColuna); // Ativa botões e cor sem duplicar nada!
        
        colunaData.cards.forEach(cardData => {
            const card = document.createElement('div');
            card.classList.add('dashboard-card');
            card.dataset.cardId = cardData.id;
            
            card.innerHTML = `
                <div class="badge ${cardData.priority}" data-priority="${cardData.priority}">
                    <span>${cardData.priorityText}</span>
                    <i class="fa-solid fa-chevron-down"></i>
                </div>
                <p class="title-card">${cardData.title}</p>
                <div class="card-infos">
                    <div class="user">
                        <img src="${fotoUsuario}" alt="user">
                        <i class="fa-solid fa-trash delete-card"></i>
                    </div>
                </div>
            `;
            
            cardsContainer.appendChild(card);
            ativarDragCard(card);
            ativarPrioridade(card.querySelector('.badge'));
            ativarTituloEditavel(card.querySelector('.title-card'));
        });
    });
}

// ==========================================
// 3. SISTEMA DE DRAG AND DROP
// ==========================================
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.dashboard-card:not(.dragging)')];
    
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
            e.target.classList.contains('delete-card')) {
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

// ==========================================
// 4. MENUS, EDIÇÕES E EVENTOS DOS CARDS
// ==========================================
function ativarPrioridade(badge) {
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
                salvarBoard();
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

function criarCard(cardsContainer) {
    const card = document.createElement('div');
    card.classList.add('dashboard-card');
    card.dataset.cardId = Date.now().toString();
    
    const fotoUsuario = usuarioLogado.picture || 'imagens/porco.jpg';

    card.innerHTML = `
        <div class="badge low" data-priority="low">
            <span>Baixa prioridade</span>
            <i class="fa-solid fa-chevron-down"></i>
        </div>
        <p class="title-card">Nova tarefa</p>
        <div class="card-infos">
            <div class="user">
                <img src="${fotoUsuario}" alt="user">
                <i class="fa-solid fa-trash delete-card"></i>
            </div>
        </div>
    `;
    
    cardsContainer.appendChild(card);
    
    ativarDragCard(card);
    ativarPrioridade(card.querySelector('.badge'));
    ativarTituloEditavel(card.querySelector('.title-card'));
    
    const title = card.querySelector('.title-card');
    title.focus();
    document.getSelection().selectAllChildren(title);
    
    salvarBoard();
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

// Botão Global para adicionar colunas
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

// ==========================================
// CENTRAL DE CLIQUES GLOBAIS (UNIFICADA)
// ==========================================
const avatarBtn = document.getElementById('user-avatar');
const userDropdown = document.getElementById('user-dropdown');

document.addEventListener('click', (e) => {
    // 1. Fecha menus de prioridade abertos ao clicar em qualquer lugar
    document.querySelectorAll('.priority-menu').forEach(m => m.remove());
    
    // 2. Lógica para deletar o card se clicar na lixeira
    if (e.target.classList.contains('delete-card')) {
        e.stopPropagation();
        const card = e.target.closest('.dashboard-card');
        if (card) {
            card.remove();
            salvarBoard(); 
        }
        return;
    }

    // 3. Lógica unificada do Dropdown de Avatar
    if (avatarBtn && userDropdown) {
        if (avatarBtn.contains(e.target)) {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden'); // Abre/Fecha se clicar no botão do avatar
        } else {
            userDropdown.classList.add('hidden'); // Fecha se clicar fora de tudo
        }
    }
});

// Fecha o menu de prioridades no Scroll da página
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

// ==========================================
// 5. INICIALIZAÇÃO DA PÁGINA
// ==========================================
carregarBoard();