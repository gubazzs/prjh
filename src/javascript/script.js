/* FUNÇÃO: SALVAR BOARD COMPLETO NO LOCALSTORAGE */
function salvarBoard() {
    const colunas = [...document.querySelectorAll('.dashboard-column')].map(coluna => {
        const id = coluna.dataset.id;
        const cor = coluna.style.getPropertyValue('--column-color').trim() || '#8b5cf6';
        const titulo = coluna.querySelector('.dashboard-title h2').textContent;
        const cards = [...coluna.querySelectorAll('.dashboard-card')].map(card => {
            const badge = card.querySelector('.badge');
            return {
                id: card.dataset.cardId || Date.now().toString(),
                priority: badge.dataset.priority,
                priorityText: badge.querySelector('span').textContent,
                title: card.querySelector('.title-card').textContent,
                comments: card.querySelector('.fa-comment').parentElement.textContent.trim(),
                attachments: card.querySelector('.fa-paperclip').parentElement.textContent.trim()
            }
        });
        
        return { id, cor, titulo, cards };
    });
    
    localStorage.setItem('dashboard-data', JSON.stringify(colunas));
}

/* FUNÇÃO: CARREGAR BOARD DO LOCALSTORAGE */
function carregarBoard() {
    const dadosSalvos = localStorage.getItem('dashboard-data');
    const container = document.querySelector('.dashboard');
    const addColumnBtn = container.querySelector('.add-column');
    
    if (!dadosSalvos) {
        document.querySelectorAll('.dashboard-column').forEach(coluna => {
            const cardsContainer = coluna.querySelector('.dashboard-cards');
            ativarDropColuna(cardsContainer);
            ativarBotoesColuna(coluna);
            ativarSeletorCor(coluna);
            coluna.querySelectorAll('.dashboard-card').forEach(ativarDragCard);
            coluna.querySelectorAll('.badge').forEach(ativarPrioridade);
            coluna.querySelectorAll('.title-card').forEach(ativarTituloEditavel);
        });
        return;
    }
    
    const colunas = JSON.parse(dadosSalvos);
    container.querySelectorAll('.dashboard-column').forEach(c => c.remove());
    
    colunas.forEach(colunaData => {
        const novaColuna = document.createElement('div');
        novaColuna.classList.add('dashboard-column');
        novaColuna.dataset.id = colunaData.id;
        novaColuna.style.setProperty('--column-color', colunaData.cor);
        
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
        
        container.insertBefore(novaColuna, addColumnBtn);
        
        const cardsContainer = novaColuna.querySelector('.dashboard-cards');
        ativarDropColuna(cardsContainer);
        ativarBotoesColuna(novaColuna);
        ativarSeletorCor(novaColuna);
        
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
                    <div class="card-icons">
                        <p><i class="fa-regular fa-comment"> ${cardData.comments}</i></p>
                        <p><i class="fa-solid fa-paperclip"> ${cardData.attachments}</i></p>
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
        });
    });
}

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
        salvarBoard();
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
    badge.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Remove menus antigos
        document.querySelectorAll('.priority-menu').forEach(m => m.remove());
        
        // Cria menu novo no BODY
        const menu = document.createElement('div');
        menu.classList.add('priority-menu', 'active');
        menu.innerHTML = `
            <div class="priority-option" data-priority="high">Alta prioridade</div>
            <div class="priority-option" data-priority="medium">Média prioridade</div>
            <div class="priority-option" data-priority="low">Baixa prioridade</div>
        `;
        document.body.appendChild(menu);
        
        // Calcula posição
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
        
        // Clique nas opções
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

// Fecha menu ao clicar fora ou scrollar
document.addEventListener('click', () => {
    document.querySelectorAll('.priority-menu').forEach(m => m.remove());
});

document.addEventListener('scroll', () => {
    document.querySelectorAll('.priority-menu').forEach(m => m.remove());
}, true);

/* FUNÇÃO: ATIVAR TÍTULO EDITÁVEL */
function ativarTituloEditavel(title) {
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

/* FUNÇÃO: CRIAR CARD NOVO */
function criarCard(cardsContainer) {
    const card = document.createElement('div');
    card.classList.add('dashboard-card');
    card.dataset.cardId = Date.now().toString();
    
    card.innerHTML = `
        <div class="badge low" data-priority="low">
            <span>Baixa prioridade</span>
            <i class="fa-solid fa-chevron-down"></i>
        </div>
        <p class="title-card">Nova tarefa</p>
        <div class="card-infos">
            <div class="card-icons">
                <p><i class="fa-regular fa-comment"> 0</i></p>
                <p><i class="fa-solid fa-paperclip"> 0</i></p>
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
    
    salvarBoard();
}

/* FUNÇÃO: ATIVAR SELETOR DE COR DA COLUNA */
function ativarSeletorCor(coluna) {
    const colorPicker = coluna.querySelector('.color-picker');
    if (!colorPicker) return;
    
    colorPicker.addEventListener('input', (e) => {
        const novaCor = e.target.value;
        coluna.style.setProperty('--column-color', novaCor);
        salvarBoard();
    });
}

/* FUNÇÃO: ATIVAR BOTÕES DA COLUNA */
function ativarBotoesColuna(coluna) {
    const addCardBtn = coluna.querySelector('.add-card');
    if (addCardBtn) {
        addCardBtn.addEventListener('click', (e) => {
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

/* ADICIONAR COLUNA NOVA */
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

/* EVENTOS GLOBAIS - SÓ UMA VEZ */
document.addEventListener('click', (e) => {
    document.querySelectorAll('.priority-menu.active').forEach(m => {
        m.classList.remove('active');
    });
    
    if (e.target.classList.contains('delete-card')) {
        e.stopPropagation();
        const card = e.target.closest('.dashboard-card');
        card.remove();
        salvarBoard();
    }
});

/* INICIALIZAÇÃO - RODA QUANDO A PÁGINA CARREGA */
carregarBoard();