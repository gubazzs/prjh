/* FUNÇÃO PRA CALCULAR ONDE SOLTAR O CARD */
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

/* ATIVAR DRAG NAS COLUNAS - COM ORDENAÇÃO ENTRE COLUNAS */
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
    });
}

/* FUNÇÃO: ATIVAR DRAG NO CARD */
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

/* FUNÇÃO: ATIVAR MENU DE PRIORIDADE */
function ativarPrioridade(badge) {
    if (badge.querySelector('.priority-menu')) return;
    
    const menu = document.createElement('div');
    menu.classList.add('priority-menu');
    menu.innerHTML = `
        <div class="priority-option" data-priority="high">Alta prioridade</div>
        <div class="priority-option" data-priority="medium">Média prioridade</div>
        <div class="priority-option" data-priority="low">Baixa prioridade</div>
    `;
    badge.appendChild(menu);

    badge.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.priority-menu.active').forEach(m => {
            if (m !== menu) m.classList.remove('active');
        });
        menu.classList.toggle('active');
    });

    menu.querySelectorAll('.priority-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const newPriority = option.dataset.priority;
            const newText = option.textContent;
            
            badge.classList.remove('high', 'medium', 'low');
            badge.classList.add(newPriority);
            badge.dataset.priority = newPriority;
            badge.querySelector('span').textContent = newText;
            
            menu.classList.remove('active');
        });
    });
}

/* FUNÇÃO: ATIVAR TÍTULO EDITÁVEL */
function ativarTituloEditavel(title) {
    title.setAttribute('contenteditable', 'true');
    title.setAttribute('spellcheck', 'false');

    title.addEventListener('blur', (e) => {
        const novoTexto = e.target.textContent.trim();
        if (novoTexto === '') {
            e.target.textContent = 'Nova tarefa';
        }
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

/* FUNÇÃO: CRIAR CARD NOVO */
function criarCard(cardsContainer) {
    const card = document.createElement('div');
    card.classList.add('dashboard-card');
    
    card.innerHTML = `
        <div class="badge low" data-priority="low">
            <span>Baixa prioridade</span>
            <i class="fa-solid fa-chevron-down"></i>
        </div>
        <p class="title-card">Nova tarefa</p>
        <div class="card-infos">
            <div class="card-icons">
                <p><i class="fa-regular fa-comment">0</i></p>
                <p><i class="fa-solid fa-paperclip">0</i></p>
            </div>
            <div class="user">
                <img src="imagens/porco.jpg" alt="user">
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
}

/* FUNÇÃO: ATIVAR BOTÕES DA COLUNA */
function ativarBotoesColuna(coluna) {
    // Botão + adicionar card
    const addCardBtn = coluna.querySelector('.add-card');
    if (addCardBtn) {
        addCardBtn.addEventListener('click', (e) => {
            const cardsContainer = coluna.querySelector('.dashboard-cards');
            criarCard(cardsContainer);
        });
    }
    
    // Botão deletar coluna
    const deleteColumnBtn = coluna.querySelector('.delete-column');
    if (deleteColumnBtn) {
        deleteColumnBtn.addEventListener('click', () => {
            if (confirm('Deletar essa coluna e todos os cards?')) {
                coluna.remove();
            }
        });
    }
    
    // Título editável da coluna
    const tituloColuna = coluna.querySelector('.dashboard-title h2');
    if (tituloColuna) {
        tituloColuna.setAttribute('contenteditable', 'true');
        tituloColuna.setAttribute('spellcheck', 'false');
        
        tituloColuna.addEventListener('blur', (e) => {
            if (e.target.textContent.trim() === '') {
                e.target.textContent = 'Nova coluna';
            }
        });
        
        tituloColuna.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
            }
        });
    }
}

/* ADICIONAR COLUNA NOVA */
const addColumnBtn = document.querySelector('.add-column');
if (addColumnBtn) {
    addColumnBtn.addEventListener('click', () => {
        const container = document.querySelector('.dashboard');
        
        const novaColuna = document.createElement('div');
        novaColuna.classList.add('dashboard-column');
        novaColuna.dataset.id = Date.now();
        
        novaColuna.innerHTML = `
            <div class="dashboard-title">
                <h2>Nova coluna</h2>
                <div class="column-actions">
                    <button class="add-card">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                    <button class="delete-column">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="dashboard-cards"></div>
        `;
        
        container.insertBefore(novaColuna, addColumnBtn);
        
        // Ativa tudo na coluna nova
        const cardsContainer = novaColuna.querySelector('.dashboard-cards');
        ativarDropColuna(cardsContainer);
        ativarBotoesColuna(novaColuna);
        
        // Foca no título pra editar
        const tituloColuna = novaColuna.querySelector('h2');
        tituloColuna.focus();
        document.getSelection().selectAllChildren(tituloColuna);
    });
}

/* EVENTOS GLOBAIS - SÓ UMA VEZ */
document.addEventListener('click', (e) => {
    // Fecha menu de prioridade
    document.querySelectorAll('.priority-menu.active').forEach(m => {
        m.classList.remove('active');
    });
    
    // Deleta card
    if (e.target.classList.contains('delete-card')) {
        e.stopPropagation();
        const card = e.target.closest('.dashboard-card');
        card.remove();
    }
});

/* INICIALIZAÇÃO - RODA QUANDO A PÁGINA CARREGA */
document.querySelectorAll('.dashboard-cards').forEach(ativarDropColuna);
document.querySelectorAll('.dashboard-card').forEach(ativarDragCard);
document.querySelectorAll('.badge').forEach(ativarPrioridade);
document.querySelectorAll('.title-card').forEach(ativarTituloEditavel);
document.querySelectorAll('.dashboard-column').forEach(ativarBotoesColuna);