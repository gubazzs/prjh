/* DRAG DAS COLUNAS - SÓ UMA VEZ */
document.querySelectorAll('.dashboard-cards').forEach(column => {
    column.addEventListener('dragover', e => {
        e.preventDefault();
        e.currentTarget.classList.add('cards-hover');
    });

    column.addEventListener('dragleave', e => {
        e.currentTarget.classList.remove('cards-hover');
    });

    column.addEventListener('drop', e => {
        e.currentTarget.classList.remove('cards-hover');
        const dragCard = document.querySelector('.dashboard-card.dragging');
        if (dragCard) e.currentTarget.appendChild(dragCard);
    });
});

/* FUNÇÃO PRA ATIVAR DRAG NO CARD */
function ativarDragCard(card) {
    card.addEventListener('dragstart', e => {
        if (e.target.classList.contains('title-card') || 
            e.target.closest('.badge') || 
            e.target.classList.contains('delete-card')) {
            e.preventDefault();
            return;
        }
        e.currentTarget.classList.add('dragging');
    });

    card.addEventListener('dragend', e => {
        e.currentTarget.classList.remove('dragging');
    });
}

/* FUNÇÃO PRA ATIVAR MENU DE PRIORIDADE */
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

/* FUNÇÃO PRA ATIVAR TÍTULO EDITÁVEL */
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

/* FECHA MENU SE CLICAR FORA */
document.addEventListener('click', () => {
    document.querySelectorAll('.priority-menu.active').forEach(m => {
        m.classList.remove('active');
    });
});

/* DELETAR CARD */
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-card')) {
        e.stopPropagation();
        const card = e.target.closest('.dashboard-card');
        card.remove();
    }
});

/* ADICIONAR CARD NOVO */
document.querySelectorAll('.add-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const column = e.target.closest('.dashboard-column');
        const cardsContainer = column.querySelector('.dashboard-cards');
        
        const card = document.createElement('div');
        card.classList.add('dashboard-card');
        card.setAttribute('draggable', 'true');
        
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
    });
});

/* ATIVA NOS CARDS QUE JÁ EXISTEM */
document.querySelectorAll('.dashboard-card').forEach(card => {
    ativarDragCard(card);
});
document.querySelectorAll('.badge').forEach(ativarPrioridade);
document.querySelectorAll('.title-card').forEach(ativarTituloEditavel);

/* DELETAR CARD - NOVO E ANTIGO */
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-card')) {
        e.stopPropagation();
        const card = e.target.closest('.dashboard-card');
        card.remove();
    }
});