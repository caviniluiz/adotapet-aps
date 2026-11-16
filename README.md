# 🐾 AdotaPet — Sistema de Gestão de Adoção e Lar Temporário de Pets

Trabalho Prático da disciplina de **Análise e Projeto de Sistemas (APS)** — Professor `EullerF`.

O **AdotaPet** é uma aplicação web completa (**Frontend SPA + Backend API REST em Node.js/Express**) que centraliza o fluxo de divulgação de cães e gatos resgatados por ONGs e protetores independentes, padronizando a triagem de candidatos à adoção definitiva ou lar temporário por meio da validação automática de regras de negócio (**RN01 a RN04**) e controle estruturado da ficha médica de cada animal.

---

## 🚀 Como Executar a Aplicação e os Testes

### Pré-requisitos
* **Node.js** (v18 ou superior)
* **npm**
* Navegador moderno (**Google Chrome** ou **Mozilla Firefox** — RNF04)

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar a aplicação (Frontend SPA + Backend API)
```bash
npm start
```
*(Ou `npm run dev` para execução em modo desenvolvimento com `nodemon`)*

Acesse no navegador:
* **Aplicação Web (SPA):** `http://localhost:3000`
* **API Health Check:** `http://localhost:3000/api/health`

### 3. Executar a suíte de testes automatizados (POO, Rotas e RN01 a RN04)
```bash
npm test
```

---

## 🖥️ Fluxo de Uso na Interface Web (SPA)

1. **Catálogo Público & Filtros Assíncronos (UC01 / RF04 / RNF01):**
   * Na tela inicial, os animais são carregados diretamente da API (`GET /api/animais`).
   * Os filtros por nome, espécie, porte, sexo, modalidade e status consultam o servidor de forma assíncrona sem recarregar a página.
   * Clique em **"Ver Detalhes 🩺"** para consultar atributos específicos da espécie, ficha médica e vacinas aplicadas.
2. **Solicitação de Adoção e Questionário Residencial (UC02 `<<include>>` UC03 / RF05 / RF06):**
   * Em qualquer pet com status **`Disponível`**, clique em **"Adotar ❤️"** (ou **"Acolher 🏡"**) e preencha os dados pessoais e o perfil residencial.
   * O backend valida automaticamente a **RN01** (maioridade >= 18 anos), **RN02** (telas de proteção obrigatórias para gatos) e **RN03** (bloqueio de solicitações concorrentes).
   * Acompanhe suas solicitações na aba **"Solicitações"** do cabeçalho.
3. **Painel Administrativo do Gestor da ONG (UC04, UC06, UC07 / RNF03):**
   * No topo direito, altere o seletor **"Perfil"** para **`Gestor da ONG`**.
   * **Solicitações:** aprove (validando **RN04** — castração obrigatória para animais >= 6 meses), recuse informando justificativa, edite a ficha médica ou agende visitas presenciais (**UC06**).
   * **Animais & Fichas Médicas:** registre castração, vermifugação, observações clínicas e novas vacinas (**RF03**).
   * **Cadastrar Animal:** adicione novos cães ou gatos com campos dinâmicos por espécie e ficha médica inicial (**UC07 / RF02**).
   * **Visitas Presenciais:** acompanhe e confirme a realização das visitas agendadas (**RF08**).

---

## 🏗️ Arquitetura do Projeto (RNF05)

```
adotapet/
├── server.js                      # Ponto de entrada da API Express e servidor de arquivos estáticos
├── package.json
├── docs/                          # Documentação de Requisitos, Casos de Uso e Diagrama de Classes
├── tests/
│   └── backend.test.js            # Testes automatizados (POO, API REST, RN01-RN04, RNF02, RNF03)
├── public/                        # Frontend Single-Page Application (HTML5, CSS3, ES6 Modules)
│   ├── index.html                 # Estrutura SPA, filtros e modais
│   ├── css/
│   │   ├── global.css             # Design System, topbar, botões, badges, loading/spinners
│   │   ├── catalogo.css           # Hero banner, barra de filtros e cards de animais
│   │   ├── modal.css              # Modais de detalhes, adoção, ficha médica, visita e recusa
│   │   └── admin.css              # Abas, tabela de animais e cartões do Painel da ONG
│   └── js/
│       ├── api.js                 # Cliente HTTP (fetch) com header x-perfil e tratamento de regras
│       ├── state.js               # Estado global da SPA e persistência do adotante ativo
│       └── app.js                 # Controlador de views, filtros assíncronos, ações e renderização
└── src/
    ├── config/
    │   ├── constants.js           # Caminhos dos dados, parseBooleano e validadores de CPF/telefone
    │   └── authMiddleware.js      # Proteção de rotas restritas ao Gestor da ONG (RNF03)
    ├── data/                      # Persistência em arquivos JSON locais (Seed incluso)
    │   ├── animais.json
    │   ├── adotantes.json
    │   ├── solicitacoes.json
    │   └── visitas.json
    ├── models/                    # Classes de domínio POO (Diagrama de Classes 4.5)
    │   ├── AbrigoONG.js           # Agregação 1:N com Animal
    │   ├── Animal.js              # Classe abstrata base (Composição 1:1 com FichaMedica)
    │   ├── Cachorro.js            # Herda de Animal
    │   ├── Gato.js                # Herda de Animal
    │   ├── FichaMedica.js         # Composição 1:N com RegistroVacina (valida RN04)
    │   ├── RegistroVacina.js
    │   ├── Adotante.js            # Valida maioridade civil (RN01) e formato CPF/telefone
    │   ├── SolicitacaoAdocao.js   # Valida compatibilidade (RN01, RN02, RN03) e parecer (RN04)
    │   └── VisitaPresencial.js
    ├── repositories/
    │   └── jsonRepository.js      # Leitura/escrita JSON com re-instanciação POO
    ├── services/                  # Regras de negócio e orquestração dos Casos de Uso
    │   ├── animaisService.js
    │   ├── adotantesService.js
    │   ├── adocaoService.js
    │   └── visitasService.js
    └── routes/                    # Controladores REST da API
        ├── animaisRoutes.js
        ├── adotantesRoutes.js
        ├── solicitacoesRoutes.js
        └── visitasRoutes.js
```

---

## 📡 Endpoints da API REST

> **Nota sobre RNF03 (Segurança):** Rotas restritas ao **Gestor da ONG** exigem o envio do header HTTP `x-perfil: GESTOR_ONG`.

| Método | Rota | Perfil | Descrição / Regras Aplicadas |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Público | Health check do servidor (`status: "UP"`, versão e uptime) |
| `GET` | `/api/auth/perfis` | Público | Lista os perfis disponíveis na aplicação (`ADOTANTE` e `GESTOR_ONG`) |
| `GET` | `/api/animais` | Público | Lista animais com filtros opcionais (`?especie=Gato&porte=PEQUENO&status=DISPONIVEL`) — **RF04** |
| `GET` | `/api/animais/:id` | Público | Detalhes do animal, resumo clínico e ficha médica completa |
| `POST` | `/api/animais` | `GESTOR_ONG` | Cadastra novo animal (`Cachorro` ou `Gato`) e sua ficha médica — **UC07 / RF02 / RF03** |
| `PATCH` | `/api/animais/:id/ficha-medica` | `GESTOR_ONG` | Registra castração, vermifugação e adiciona vacinas — **RF03 / RN04** |
| `GET` | `/api/adotantes` | Público | Lista adotantes cadastrados |
| `POST` | `/api/adotantes` | Público | Cadastra adotante e questionário de perfil residencial — **RF01 / RF05 / UC03** |
| `PATCH` | `/api/adotantes/:id/perfil-residencial` | Público | Atualiza moradia e presença de telas de proteção — **RF05** |
| `GET` | `/api/solicitacoes` | `GESTOR_ONG` / `?adotanteId=` | Lista todas (para Gestor) ou solicitações filtradas por `adotanteId` |
| `POST` | `/api/solicitacoes` | Público | Cria solicitação validando **RN01** (422), **RN02** (422) e **RN03** (409) — **UC02 / RF06** |
| `PATCH` | `/api/solicitacoes/:id/avaliar` | `GESTOR_ONG` | Aprova (validando **RN04**) ou recusa solicitação (exigindo justificativa) — **UC04 / RF07** |
| `POST` | `/api/solicitacoes/:id/visita` | `GESTOR_ONG` | Agenda visita presencial vinculada à solicitação `PENDENTE` — **UC06 / RF08** |
| `GET` | `/api/visitas` | Público | Lista visitas presenciais agendadas |
| `POST` | `/api/visitas` | `GESTOR_ONG` | Agenda visita informando `solicitacaoId` (requer status `PENDENTE`) — **UC06 / RF08** |
| `PATCH` | `/api/visitas/:id/confirmar` | `GESTOR_ONG` | Confirma realização de uma visita presencial |
