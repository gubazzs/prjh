# Tasky - Kanban Dashboard

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## 📋 Sobre o projeto

**Tasky** é um dashboard de gerenciamento de tarefas no estilo Kanban. A ideia é ter um quadro visual simples e rápido pra organizar suas tarefas em colunas como "A Fazer", "Fazendo" e "Concluído". Tudo salva no navegador, sem precisar de backend.

## 🎯 Objetivo

Criar uma ferramenta de produtividade minimalista e bonita que funcione 100% no frontend. Foco em UX fluida com drag-and-drop, personalização de cores e login social pra deixar o board com a cara do usuário.

## 👥 Público-alvo

- Desenvolvedores/estudantes que querem um board pessoal sem cadastro complicado
- Pequenos times/freelancers que precisam organizar demandas visuais  
- Pessoas que curtem apps glassmorphism/dark mode e querem algo leve

## 🖥️ Telas disponíveis

| Tela | Descrição |
| --- | --- |
| `inicial.html` | Tela de login com email/senha, Google e GitHub. Avatar personalizado |
| `dashboard.html` | Board principal com colunas, cards arrastáveis, menu de usuário |

## ✨ Funcionalidades principais

- **Login Social**: Google OAuth + GitHub API + Login de teste
- **Drag & Drop**: Arraste cards entre colunas e reordene dentro da coluna
- **Prioridades**: Badge de Alta/Média/Baixa prioridade com menu dropdown
- **Colunas Customizáveis**: Crie/delete colunas, edite título, mude a cor
- **Cards Editáveis**: Título editável inline clicando no texto
- **Persistência**: Tudo salvo no `localStorage` - fecha o navegador e continua igual
- **Menu de Usuário**: Avatar no header com dropdown + logout
- **UI Glassmorphism**: Visual dark com blur e efeitos neon

## 🛠️ Tecnologias utilizadas

| Categoria | Tech |
| --- | --- |
| **Frontend** | HTML5, CSS3, JavaScript ES6+ |
| **Estilo** | CSS Variables, Flexbox, Glassmorphism, Font Poppins |
| **Ícones** | Font Awesome 7.0.1 |
| **Auth** | Google Identity Services, GitHub API |
| **Armazenamento** | localStorage API |
| **Drag & Drop** | HTML5 Drag and Drop API |

## 🚀 Como rodar

1. Clone o repositório:
```bash
git clone https://github.com/dev-Riann/Projeto-FrontEnd