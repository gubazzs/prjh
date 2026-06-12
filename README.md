# Tasky — Kanban para Devs

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)

## Sobre

**Tasky** é uma ferramenta de gerenciamento de tarefas no estilo Kanban, pensada para desenvolvedores que precisam de um board pessoal rápido, sem burocracia. Tudo roda no frontend — sem backend próprio, sem instalação, sem config.

## Telas

| Arquivo | Descrição |
|---|---|
| `inicial.html` | Login / cadastro com e-mail, Google e GitHub |
| `projetos.html` | Lista de projetos do usuário |
| `dashboard.html` | Board Kanban do projeto selecionado |

## Funcionalidades

### Autenticação
- Login e cadastro com e-mail/senha via Firebase Auth
- OAuth com Google e GitHub
- Sessão persistida via `sessionStorage`; logout limpa a sessão

### Projetos
- Crie quantos projetos quiser, cada um com nome, descrição e cor
- Edite ou exclua projetos a qualquer momento
- Reordene os cards de projeto arrastando (drag & drop)
- Contador de tarefas por projeto calculado em tempo real

### Board Kanban
- Colunas customizáveis: crie, renomeie, mude a cor e exclua
- Cards com drag & drop entre colunas e dentro da mesma coluna
- **Modal de detalhes** do card: título, descrição longa, prioridade e prazo
- Prioridade por card: Alta / Média / Baixa com badge colorido
- Prazo com indicação visual: verde (ok) → laranja (≤ 2 dias) → vermelho (vencido)
- Busca em tempo real por título e descrição
- Filtro por prioridade (Alta / Média / Baixa / Todas)
- Contador de cards visíveis por coluna (atualiza com o filtro)
- Exportar board como `.json` e importar de volta

### Dados
- Tudo salvo no `localStorage` separado por usuário e por projeto
- Migração automática de boards criados antes do sistema de projetos

## Tecnologias

| Categoria | Tech |
|---|---|
| Frontend | HTML5, CSS3, JavaScript ES6+ |
| Estilo | CSS Variables, Flexbox, Glassmorphism, Poppins |
| Ícones | Font Awesome 7.0.1 |
| Auth | Firebase Authentication |
| Armazenamento | localStorage / sessionStorage |
| Drag & Drop | HTML5 Drag and Drop API |

## Como rodar

Não há processo de build. Basta abrir o `inicial.html` num servidor local — qualquer um serve:

```bash
# Python
python3 -m http.server 8080

# Node (npx)
npx serve .

# VS Code
# instale a extensão Live Server e clique em "Go Live"
```

> Abrir diretamente via `file://` pode bloquear os módulos ES do Firebase. Use um servidor local.

## Estrutura

```
/
├── inicial.html          # login / cadastro
├── projetos.html         # lista de projetos
├── dashboard.html        # board kanban
├── imagens/
│   ├── favicon.ico
│   └── porco.jpg         # avatar padrão
└── src/
    ├── css/
    │   ├── style-inicial.css
    │   ├── style-projetos.css
    │   └── style-dashboard.css
    └── javascript/
        ├── projetos.js
        └── script.js
```
