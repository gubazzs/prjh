const usuarioLogado = JSON.parse(sessionStorage.getItem('usuario-tasky'));
const projetoId = new URLSearchParams(location.search).get('project');

if (!usuarioLogado) { window.location.href = 'inicial.html'; }
else if (!projetoId) { window.location.href = 'projetos.html'; }

const projetos = JSON.parse(localStorage.getItem(`tasky-projects-${usuarioLogado.email}`)) || [];
const projeto = projetos.find(p => p.id === projetoId);
if (!projeto) { window.location.href = 'projetos.html'; }

document.getElementById('back-btn').href = `dashboard.html?project=${projetoId}`;

const nameEl = document.getElementById('project-name');
nameEl.textContent = projeto.name;
nameEl.style.setProperty('--proj-color', projeto.color || '#58a6ff');
document.title = `Tasky · Analytics · ${projeto.name}`;
document.getElementById('analytics-subtitle').textContent = `Board: ${projeto.name}`;

const colunas = JSON.parse(localStorage.getItem(`dashboard-data-${usuarioLogado.email}-${projetoId}`)) || [];

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

let totalCards = 0, totalHigh = 0, totalMedium = 0, totalLow = 0;
let vencidos = [], proximosVencer = 0;

colunas.forEach(col => {
    (col.cards || []).forEach(card => {
        totalCards++;
        if (card.priority === 'high') totalHigh++;
        else if (card.priority === 'medium') totalMedium++;
        else totalLow++;

        if (card.dueDate) {
            const prazo = new Date(card.dueDate + 'T00:00:00');
            const dias = Math.round((prazo - hoje) / 86400000);
            if (dias < 0) vencidos.push({ title: card.title, coluna: col.titulo, dias: Math.abs(dias) });
            else if (dias <= 2) proximosVencer++;
        }
    });
});

// KPIs
const kpis = [
    { label: 'Total de tarefas', value: totalCards, icon: 'fa-list-check', color: '#58a6ff' },
    { label: 'Alta prioridade', value: totalHigh, icon: 'fa-fire', color: '#d573b6' },
    { label: 'Vencidas', value: vencidos.length, icon: 'fa-triangle-exclamation', color: '#f87171' },
    { label: 'Vencem em breve', value: proximosVencer, icon: 'fa-clock', color: '#fea065' },
];

const kpiGrid = document.getElementById('kpi-grid');
kpis.forEach(kpi => {
    const el = document.createElement('div');
    el.className = 'kpi-card';
    el.innerHTML = `
        <div class="kpi-icon" style="color:${kpi.color}; background:${kpi.color}22;">
            <i class="fa-solid ${kpi.icon}"></i>
        </div>
        <div>
            <div class="kpi-value" style="color:${kpi.color};">${kpi.value}</div>
            <div class="kpi-label">${kpi.label}</div>
        </div>
    `;
    kpiGrid.appendChild(el);
});

// Cards por coluna
const columnChart = document.getElementById('column-chart');
const maxColunaCards = Math.max(...colunas.map(c => (c.cards || []).length), 1);

if (colunas.length === 0) {
    columnChart.innerHTML = '<p class="empty-chart">Nenhuma coluna ainda.</p>';
} else {
    colunas.forEach(col => {
        const count = (col.cards || []).length;
        const pct = Math.round((count / maxColunaCards) * 100);
        const el = document.createElement('div');
        el.className = 'bar-row';
        el.innerHTML = `
            <span class="bar-label" title="${col.titulo}">${col.titulo}</span>
            <div class="bar-track">
                <div class="bar-fill" style="width:${pct}%; background:${col.cor || '#58a6ff'}; box-shadow:0 0 8px ${col.cor || '#58a6ff'}66;"></div>
            </div>
            <span class="bar-value">${count}</span>
        `;
        columnChart.appendChild(el);
    });
}

// Prioridade
const prioData = [
    { label: 'Alta', count: totalHigh, color: '#d573b6' },
    { label: 'Média', count: totalMedium, color: '#fea065' },
    { label: 'Baixa', count: totalLow, color: '#58a6ff' },
];
const maxPrio = Math.max(...prioData.map(p => p.count), 1);
const priorityChart = document.getElementById('priority-chart');

prioData.forEach(p => {
    const pct = Math.round((p.count / maxPrio) * 100);
    const el = document.createElement('div');
    el.className = 'bar-row';
    el.innerHTML = `
        <span class="bar-label">${p.label}</span>
        <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%; background:${p.color}; box-shadow:0 0 8px ${p.color}66;"></div>
        </div>
        <span class="bar-value">${p.count}</span>
    `;
    priorityChart.appendChild(el);
});

// Vencidos
const overdueSection = document.getElementById('overdue-section');
const overdueList = document.getElementById('overdue-list');

if (vencidos.length === 0) {
    overdueSection.style.display = 'none';
} else {
    vencidos.sort((a, b) => b.dias - a.dias).forEach(card => {
        const el = document.createElement('div');
        el.className = 'overdue-item';
        el.innerHTML = `
            <i class="fa-solid fa-circle-exclamation" style="color:#f87171;"></i>
            <div class="overdue-info">
                <span class="overdue-title">${card.title}</span>
                <span class="overdue-meta">${card.coluna} · venceu há ${card.dias} dia${card.dias !== 1 ? 's' : ''}</span>
            </div>
        `;
        overdueList.appendChild(el);
    });
}
