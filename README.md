# 🐾 AdotaPet — Sistema de Gestão de Adoção e Lar Temporário de Pets (Backend API)

Trabalho Prático da disciplina de **Análise e Projeto de Sistemas (APS)** — Professor `EullerF`.

O **AdotaPet** centraliza o fluxo de divulgação de cães e gatos resgatados por ONGs e protetores independentes, padronizando a triagem de candidatos à adoção definitiva ou lar temporário por meio da validação automática de regras de negócio (**RN01 a RN04**) e controle estruturado da ficha médica de cada animal.

---

## 🚀 Como Executar o Servidor e os Testes

### Pré-requisitos
* **Node.js** (v18 ou superior)
* **npm**

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar o servidor Backend
```bash
npm start
```
*(Ou `npm run dev` para execução em modo desenvolvimento com `nodemon`)*

* **API Health Check:** `http://localhost:3000/api/health`

### 3. Executar a suíte de testes automatizados (POO, Rotas e RN01 a RN04)
```bash
npm test
```

---

## 🏗️ Arquitetura em Camadas do Backend (RNF05)

```
adotapet/
├── server.js                      # Ponto de entrada da API Express
├── package.json
├── docs/                          # Documentação de Requisitos, Casos de Uso e Diagrama de Classes
├── tests/
│   └── backend.test.js            # Testes automatizados (POO, API REST, RN01-RN04, RNF02, RNF03)
└── src/
    ├── config/
    │   ├── constants.js           # Caminhos dos arquivos de dados e constantes
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
    │   ├── Adotante.js            # Valida maioridade civil (RN01)
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
| `GET` | `/api/animais` | Público | Lista animais com filtros opcionais (`?especie=Gato&porte=PEQUENO&status=DISPONIVEL`) — **RF04** |
| `GET` | `/api/animais/:id` | Público | Detalhes do animal, resumo clínico e ficha médica completa |
| `POST` | `/api/animais` | `GESTOR_ONG` | Cadastra novo animal (`Cachorro` ou `Gato`) e sua ficha médica — **UC07 / RF02 / RF03** |
| `PATCH` | `/api/animais/:id/ficha-medica` | `GESTOR_ONG` | Registra castração, vermifugação e adiciona vacinas — **RF03 / RN04** |
| `GET` | `/api/adotantes` | Público | Lista adotantes cadastrados |
| `POST` | `/api/adotantes` | Público | Cadastra adotante e questionário de perfil residencial — **RF01 / RF05 / UC03** |
| `PATCH` | `/api/adotantes/:id/perfil-residencial` | Público | Atualiza moradia e presença de telas de proteção — **RF05** |
| `GET` | `/api/solicitacoes` | Público | Lista solicitações enriquecidas com dados do pet, adotante e visita |
| `POST` | `/api/solicitacoes` | Público | Cria solicitação validando **RN01** (422), **RN02** (422) e **RN03** (409) — **UC02 / RF06** |
| `PATCH` | `/api/solicitacoes/:id/avaliar` | `GESTOR_ONG` | Aprova (validando **RN04**) ou recusa solicitação (exigindo justificativa) — **UC04 / RF07** |
| `POST` | `/api/solicitacoes/:id/visita` | `GESTOR_ONG` | Agenda visita presencial vinculada à solicitação — **UC06 / RF08** |
| `GET` | `/api/visitas` | Público | Lista visitas presenciais agendadas |
| `PATCH` | `/api/visitas/:id/confirmar` | `GESTOR_ONG` | Confirma realização de uma visita presencial |
