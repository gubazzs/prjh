
/* arrastar cards de uma coluna pra outra */
document.querySelectorAll('.dashboard-card').forEach(card => {
    card.addEventListener('dragstart', e => {
        e.currentTarget.classList.add('dragging');
    })

    card.addEventListener('dragend', e => {
        e.currentTarget.classList.remove('dragging')
    })
})

document.querySelectorAll('.dashboard-cards').forEach(column => {
    column.addEventListener('dragover', e => {
        e.preventDefault();
        e.currentTarget.classList.add('cards-hover');
    })

    column.addEventListener('dragleave', e => {
        e.currentTarget.classList.remove('cards-hover');
    })

    column.addEventListener('drop', e => {
        e.currentTarget.classList.remove('cards-hover');

        const dragCard = document.querySelector('.dashboard-card.dragging')
        e.currentTarget.appendChild(dragCard);
    })

})

/*Criar menu de prioridade */
document.querySelectorAll('.dashboard-card').forEach(card => {
    card.addEventListener('dragstart', e => {
        e.currentTarget.classList.add('dragging');
    })

    card.addEventListener('dragend', e => {
        e.currentTarget.classList.remove('dragging')
    })
})

document.querySelectorAll('.dashboard-cards').forEach(column => {
    column.addEventListener('dragover', e => {
        e.preventDefault();
        e.currentTarget.classList.add('cards-hover');
    })

    column.addEventListener('dragleave', e => {
        e.currentTarget.classList.remove('cards-hover');
    })

    column.addEventListener('drop', e => {
        e.currentTarget.classList.remove('cards-hover');
        const dragCard = document.querySelector('.dashboard-card.dragging')
        e.currentTarget.appendChild(dragCard);
    })
})

/* Criar menu de prioridade pra cada badge */
document.querySelectorAll('.badge').forEach(badge => {
    const menu = document.createElement('div');
    menu.classList.add('priority-menu');
    menu.innerHTML = `
        <div class="priority-option" data-priority="high">Alta prioridade</div>
        <div class="priority-option" data-priority="medium">Média prioridade</div>
        <div class="priority-option" data-priority="low">Baixa prioridade</div>
    `;
    badge.appendChild(menu);

    /* ABRE E FECHA O MENU AO CLICAR */
    badge.addEventListener('click', (e) => {
        e.stopPropagation();
        
        document.querySelectorAll('.priority-menu.active').forEach(m => {
            if (m !== menu) m.classList.remove('active');
        });
        
        menu.classList.toggle('active');
    });

    /* troca ao escolher a prioridade */
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
});

/* Fecha menu se clicar fora */
document.addEventListener('click', () => {
    document.querySelectorAll('.priority-menu.active').forEach(m => {
        m.classList.remove('active');
    });
});