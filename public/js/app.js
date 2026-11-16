/* ============================================================
   APP — Lógica de interface da SPA AdotaPet
   (Integração completa com API REST: carga inicial, catálogo,
    solicitação de adoção, painel do gestor da ONG e loading)
   ============================================================ */

import { state, setAdotanteAtivoId } from './state.js';
import { api } from './api.js';

/* ==================== MAPAS / CONSTANTES ==================== */

const STATUS_ANIMAL_LABEL = {
    DISPONIVEL: 'Disponível',
    EM_ANALISE: 'Em análise',
    ADOTADO: 'Adotado',
    EM_LAR_TEMPORARIO: 'Em lar temporário'
};

const STATUS_ANIMAL_BADGE = {
    DISPONIVEL: 'badge-disponivel',
    EM_ANALISE: 'badge-analise',
    ADOTADO: 'badge-adotado',
    EM_LAR_TEMPORARIO: 'badge-temporario'
};

const STATUS_SOLICITACAO_LABEL = {
    PENDENTE: 'Pendente',
    APROVADA: 'Aprovada',
    RECUSADA: 'Recusada'
};

const STATUS_SOLICITACAO_BADGE = {
    PENDENTE: 'badge-analise',
    APROVADA: 'badge-disponivel',
    RECUSADA: 'badge-recusada'
};

const STATUS_VISITA_LABEL = {
    AGENDADA: 'Agendada',
    REALIZADA: 'Realizada',
    CANCELADA: 'Cancelada'
};

const STATUS_VISITA_BADGE = {
    AGENDADA: 'badge-temporario',
    REALIZADA: 'badge-disponivel',
    CANCELADA: 'badge-recusada'
};

const MORADIA_LABEL = {
    CASA: 'Casa',
    APARTAMENTO: 'Apartamento',
    CHACARA: 'Chácara / Sítio'
};

const MODALIDADE_LABEL = {
    ADOCAO_DEFINITIVA: 'Adoção Definitiva',
    LAR_TEMPORARIO: 'Lar Temporário'
};

const PORTE_LABEL = {
    PEQUENO: 'Pequeno',
    MEDIO: 'Médio',
    GRANDE: 'Grande'
};

const ENERGIA_LABEL = {
    BAIXO: 'Energia baixa',
    MEDIO: 'Energia média',
    ALTO: 'Energia alta'
};

// Fotos padrão (Unsplash) quando o cadastro não informa URL
const FOTOS_DEFAULT = {
    Cachorro: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
    Gato: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80'
};

/* ==================== HELPERS ==================== */

const $ = (id) => document.getElementById(id);

function formatarIdade(idadeMeses) {
    if (idadeMeses < 12) {
        return `${idadeMeses} ${idadeMeses === 1 ? 'mês' : 'meses'}`;
    }
    const anos = Math.floor(idadeMeses / 12);
    const resto = idadeMeses % 12;
    return resto === 0 ? `${anos} ${anos === 1 ? 'ano' : 'anos'}` : `${anos} a ${resto} m`;
}

function formatarDataHora(valor) {
    if (!valor) return '—';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return valor;
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatarData(valor) {
    if (!valor) return '—';
    const d = new Date(`${valor}T12:00:00`);
    if (Number.isNaN(d.getTime())) return valor;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function escapar(texto) {
    return String(texto ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

function aplicarMascaraCPF(valor) {
    const d = String(valor || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

function aplicarMascaraTelefone(valor) {
    const d = String(valor || '').replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

function validarCPF(cpf) {
    const digitos = String(cpf || '').replace(/\D/g, '');
    if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += Number(digitos[i]) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== Number(digitos[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += Number(digitos[i]) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    return resto === Number(digitos[10]);
}

function validarTelefone(telefone) {
    const digitos = String(telefone || '').replace(/\D/g, '');
    return (digitos.length === 10 || digitos.length === 11) && !/^(\d)\1+$/.test(digitos);
}

function buscarAnimal(id) {
    return (
        state.animais.find(a => Number(a.id) === Number(id)) ||
        state.todosAnimais.find(a => Number(a.id) === Number(id))
    );
}

function showToast(mensagem, tipo = 'success') {
    const container = $('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensagem;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 320);
    }, 3200);
}

/* ==================== NAVEGAÇÃO DA SPA ==================== */

function showView(viewId) {
    document.querySelectorAll('.spa-view').forEach(v => v.classList.add('hidden'));

    const alvo = $(viewId);
    if (alvo) alvo.classList.remove('hidden');

    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
        link.classList.toggle('active', link.dataset.view === viewId);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function switchPerfil(tipo) {
    state.perfilAtivo = tipo;
    const navOng = $('nav-painel-ong');

    if (tipo === 'GESTOR_ONG') {
        navOng.classList.remove('hidden');
        if ($('view-painel-ong').classList.contains('hidden')) {
            showView('view-painel-ong');
        }
    } else {
        navOng.classList.add('hidden');
        if (!$('view-painel-ong').classList.contains('hidden')) {
            showView('view-catalogo');
        }
    }

    try {
        await sincronizarEstadoAPI();
    } catch (erro) {
        showToast(erro.message || 'Erro ao atualizar dados para o perfil selecionado.', 'error');
        renderAll();
    }
}

/* ==================== MODAIS ==================== */

function openModal(id) {
    $(id).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    $(id).classList.add('hidden');
    document.body.style.overflow = '';
    const alerta = $(id).querySelector('.alert-danger');
    if (alerta) alerta.classList.add('hidden');
}

function mostrarErroModal(idAlerta, msg) {
    const alerta = $(idAlerta);
    alerta.textContent = msg;
    alerta.classList.remove('hidden');
    alerta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function obterMinhasSolicitacoes() {
    if (!state.adotanteAtivoId) return [];
    return state.solicitacoes.filter(s => Number(s.adotanteId) === Number(state.adotanteAtivoId));
}

async function executarComLoading(botao, textoLoading, acaoAsync) {
    const htmlOriginal = botao ? botao.innerHTML : null;
    const disabledOriginal = botao ? botao.disabled : false;

    if (botao) {
        botao.disabled = true;
        botao.classList.add('is-loading');
        botao.innerHTML = `<span class="spinner-inline" aria-hidden="true"></span> ${escapar(textoLoading)}`;
    }

    try {
        return await acaoAsync();
    } finally {
        if (botao) {
            botao.disabled = disabledOriginal;
            botao.classList.remove('is-loading');
            botao.innerHTML = htmlOriginal;
        }
    }
}

function listarSolicitacoesAtuais() {
    if (state.perfilAtivo === 'GESTOR_ONG') {
        return api.listarSolicitacoes();
    }
    if (state.adotanteAtivoId) {
        return api.listarSolicitacoes({ adotanteId: state.adotanteAtivoId });
    }
    return Promise.resolve([]);
}

async function sincronizarEstadoAPI() {
    const [todosAnimais, animaisFiltrados, solicitacoes, visitas] = await Promise.all([
        api.listarAnimais({}),
        api.listarAnimais(state.filtros),
        listarSolicitacoesAtuais(),
        api.listarVisitas()
    ]);

    state.todosAnimais = todosAnimais;
    state.animais = animaisFiltrados;
    state.solicitacoes = solicitacoes;
    state.visitas = visitas;

    renderAll();
}

/* ==================== CARGA E FILTROS VIA API ==================== */

async function carregarDadosIniciais() {
    const grid = $('catalogo-grid');
    if (grid) {
        grid.innerHTML = `
            <div class="loading-state">
                <span class="spinner-inline" aria-hidden="true"></span>
                Carregando animais do abrigo...
            </div>`;
    }

    try {
        const [todosAnimais, solicitacoes, visitas, perfisRes] = await Promise.all([
            api.listarAnimais({}),
            listarSolicitacoesAtuais(),
            api.listarVisitas(),
            api.listarPerfis()
        ]);

        state.todosAnimais = todosAnimais;
        state.animais = todosAnimais;
        state.solicitacoes = solicitacoes;
        state.visitas = visitas;
        state.perfis = perfisRes.perfis || [];

        renderAll();
    } catch (erro) {
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <span class="empty-emoji">⚠️</span>
                    Não foi possível carregar o catálogo: ${escapar(erro.message)}
                </div>`;
        }
        showToast(erro.message || 'Erro ao carregar dados iniciais da API.', 'error');
    }
}

function sincronizarCategoriasRapidas() {
    const f = state.filtros;
    let chaveAtiva = null;

    if (!f.busca && f.sexo === 'TODOS' && f.status === 'TODOS') {
        if (f.especie === 'TODOS' && f.porte === 'TODOS' && f.modalidade === 'TODOS') {
            chaveAtiva = 'TODOS';
        } else if (f.especie === 'Cachorro' && f.porte === 'TODOS' && f.modalidade === 'TODOS') {
            chaveAtiva = 'Cachorro';
        } else if (f.especie === 'Gato' && f.porte === 'TODOS' && f.modalidade === 'TODOS') {
            chaveAtiva = 'Gato';
        } else if (f.modalidade === 'LAR_TEMPORARIO' && f.especie === 'TODOS' && f.porte === 'TODOS') {
            chaveAtiva = 'LAR_TEMPORARIO';
        } else if (f.porte === 'PEQUENO' && f.especie === 'TODOS' && f.modalidade === 'TODOS') {
            chaveAtiva = 'PEQUENO';
        }
    }

    document.querySelectorAll('.category-card[data-quick-filter]').forEach(card => {
        card.classList.toggle('active', card.dataset.quickFilter === chaveAtiva);
    });
}

async function atualizarCatalogoFiltrado() {
    try {
        const animaisFiltrados = await api.listarAnimais(state.filtros);
        state.animais = animaisFiltrados;
        sincronizarCategoriasRapidas();
        renderCatalogo();
    } catch (erro) {
        showToast(erro.message || 'Erro ao filtrar catálogo na API.', 'error');
    }
}

/* ==================== RENDER: CATÁLOGO ==================== */

function renderCatalogo() {
    const grid = $('catalogo-grid');
    const filtrados = state.animais;

    if (filtrados.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                Nenhum animal encontrado com os filtros atuais.<br>
                Tente ajustar ou limpar os filtros selecionados.
            </div>`;
    } else {
        grid.innerHTML = filtrados.map(cardHtml).join('');
    }

    const baseContagem = state.todosAnimais.length > 0 ? state.todosAnimais : state.animais;
    $('stat-disponiveis').textContent = baseContagem.filter(a => a.status === 'DISPONIVEL').length;
    $('stat-analise').textContent = baseContagem.filter(a => a.status === 'EM_ANALISE').length;
}

function cardHtml(animal) {
    const foto = animal.fotoUrl || FOTOS_DEFAULT[animal.especie];
    const chipEspecie = animal.especie === 'Gato' ? 'species-gato' : 'species-cachorro';
    const genero = animal.sexo === 'M' ? 'Macho' : 'Fêmea';
    const disponivel = animal.status === 'DISPONIVEL';

    return `
        <article class="pet-card" data-animal-id="${animal.id}">
            <div class="pet-card-image-wrapper">
                <img class="pet-card-image" src="${escapar(foto)}" alt="Foto de ${escapar(animal.nome)}" loading="lazy">
                <div class="pet-card-badges">
                    <span class="badge ${STATUS_ANIMAL_BADGE[animal.status]}">${STATUS_ANIMAL_LABEL[animal.status]}</span>
                    <span class="badge ${animal.modalidade === 'LAR_TEMPORARIO' ? 'badge-temporario' : 'badge-adotado'}">${MODALIDADE_LABEL[animal.modalidade]}</span>
                </div>
            </div>
            <div class="pet-card-body">
                <div class="pet-card-title-row">
                    <h3 class="pet-card-title">${escapar(animal.nome)}</h3>
                    <span class="species-chip ${chipEspecie}">${animal.especie}</span>
                </div>
                <div class="pet-meta-tags">
                    <span class="meta-tag">${formatarIdade(animal.idadeMeses)}</span>
                    <span class="meta-tag">Porte ${PORTE_LABEL[animal.porte]}</span>
                    <span class="meta-tag">${genero}</span>
                </div>
                <p class="pet-card-desc">${escapar(animal.descricao)}</p>
                <div class="pet-card-footer">
                    <button type="button" class="btn btn-outline btn-sm" data-acao="detalhes" data-id="${animal.id}">Ver Detalhes</button>
                    <button type="button" class="btn btn-primary btn-sm" data-acao="adotar" data-id="${animal.id}" ${disponivel ? '' : 'disabled'}>
                        ${animal.modalidade === 'LAR_TEMPORARIO' ? 'Acolher' : 'Adotar'}
                    </button>
                </div>
            </div>
        </article>`;
}

/* ==================== RENDER: DETALHES DO ANIMAL ==================== */

function verDetalhes(animalId) {
    const animal = buscarAnimal(animalId);
    if (!animal) return;

    const foto = animal.fotoUrl || FOTOS_DEFAULT[animal.especie];
    const ficha = animal.fichaMedica || { vacinas: [] };

    const chipsEspecificos = animal.especie === 'Cachorro'
        ? `<span class="meta-tag">${ENERGIA_LABEL[animal.nivelEnergia] || '—'}</span>
           <span class="meta-tag">${animal.sociavelComCaes ? 'Sociável com cães' : 'Necessita atenção com cães'}</span>`
        : `<span class="meta-tag">${animal.testadoFivFelv ? 'Testado FIV/FeLV' : 'Sem teste FIV/FeLV'}</span>
           ${animal.testadoFivFelv ? `<span class="meta-tag">${animal.negativoFivFelv ? 'Negativo FIV/FeLV' : 'Positivo FIV/FeLV'}</span>` : ''}
           <span class="meta-tag">${animal.adaptadoApartamento ? 'Adaptado a apartamento' : 'Melhor com área externa'}</span>`;

    const vacinas = (ficha.vacinas || []).map(v => `
        <li class="vaccine-item">
            <strong>${escapar(v.nomeVacina)}</strong>
            <span>${formatarData(v.dataAplicacao)} · Lote ${escapar(v.lote || '—')}</span>
        </li>`).join('');

    $('modal-detalhes-body').innerHTML = `
        <div class="detail-grid">
            <div>
                <img class="detail-photo" src="${escapar(foto)}" alt="Foto de ${escapar(animal.nome)}">
                <div class="detail-badges">
                    <span class="badge ${STATUS_ANIMAL_BADGE[animal.status]}">${STATUS_ANIMAL_LABEL[animal.status]}</span>
                    <span class="badge ${animal.modalidade === 'LAR_TEMPORARIO' ? 'badge-temporario' : 'badge-adotado'}">${MODALIDADE_LABEL[animal.modalidade]}</span>
                </div>
            </div>
            <div>
                <h4 class="detail-name">${escapar(animal.nome)}</h4>
                <div class="detail-chips">
                    <span class="species-chip ${animal.especie === 'Gato' ? 'species-gato' : 'species-cachorro'}">${animal.especie}</span>
                    <span class="meta-tag">${formatarIdade(animal.idadeMeses)}</span>
                    <span class="meta-tag">Porte ${PORTE_LABEL[animal.porte]}</span>
                    <span class="meta-tag">${animal.sexo === 'M' ? 'Macho' : 'Fêmea'}</span>
                </div>
                <p class="detail-desc">${escapar(animal.descricao)}</p>

                <h5 class="detail-section-title">Características</h5>
                <div class="detail-chips">${chipsEspecificos}</div>

                <h5 class="detail-section-title">Ficha Médica</h5>
                <div class="detail-chips">
                    <span class="badge ${ficha.castrado ? 'badge-disponivel' : 'badge-analise'}">${ficha.castrado ? 'Castrado' : 'Não castrado'}</span>
                    <span class="badge ${ficha.vermifugado ? 'badge-disponivel' : 'badge-analise'}">${ficha.vermifugado ? 'Vermifugado' : 'Não vermifugado'}</span>
                </div>
                <p class="detail-desc">Observações clínicas: ${escapar(ficha.observacoesClinicas) || '—'}</p>

                <h5 class="detail-section-title">Vacinas (${(ficha.vacinas || []).length})</h5>
                ${vacinas ? `<ul class="vaccine-list">${vacinas}</ul>` : '<p class="detail-desc">Nenhuma vacina registrada.</p>'}
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-outline" data-close-modal="modal-detalhes">Fechar</button>
            <button type="button" class="btn btn-primary" data-acao="adotar" data-id="${animal.id}" ${animal.status === 'DISPONIVEL' ? '' : 'disabled'}>
                ${animal.modalidade === 'LAR_TEMPORARIO' ? 'Acolher em Lar Temporário' : 'Solicitar Adoção'}
            </button>
        </div>`;

    openModal('modal-detalhes');
}

/* ==================== RENDER: MINHAS SOLICITAÇÕES ==================== */

function renderMinhasSolicitacoes() {
    const lista = $('lista-minhas-solicitacoes');
    const minhas = obterMinhasSolicitacoes();

    if (minhas.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                Você ainda não registrou solicitações neste navegador.<br>
                Encontre um animal disponível no catálogo e clique em <strong>Adotar</strong>.
            </div>`;
        atualizarContadores();
        return;
    }

    lista.innerHTML = minhas.map(s => solicitacaoCardHtml(s, { modoAdotante: true })).join('');
    atualizarContadores();
}

/* ==================== RENDER: PAINEL ADMIN ==================== */

function renderAdminSolicitacoes() {
    const lista = $('lista-solicitacoes-ong');
    const filtro = state.filtroAdminSolicitacoes;
    const filtradas = filtro === 'TODOS'
        ? state.solicitacoes
        : state.solicitacoes.filter(s => s.status === filtro);

    if (filtradas.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                Nenhuma solicitação ${filtro === 'TODOS' ? 'registrada' : STATUS_SOLICITACAO_LABEL[filtro].toLowerCase()}.
            </div>`;
        atualizarContadores();
        return;
    }

    lista.innerHTML = filtradas.map(s => solicitacaoCardHtml(s, { modoAdotante: false })).join('');
    atualizarContadores();
}

function solicitacaoCardHtml(s, { modoAdotante }) {
    const animal = s.animal || buscarAnimal(s.animalId) || {};
    const adotante = s.adotante || {};
    const foto = animal.fotoUrl || FOTOS_DEFAULT[animal.especie] || '';

    const tipoMoradia = s.perfilResidencial?.tipoMoradia || adotante.tipoMoradia || 'CASA';
    const possuiTelas = s.perfilResidencial?.telasProtecao !== undefined
        ? s.perfilResidencial.telasProtecao
        : Boolean(adotante.possuiTelasProtecao);
    const modalidade = s.modalidade || s.perfilResidencial?.modalidade || animal.modalidade || 'ADOCAO_DEFINITIVA';
    const justificativa = s.justificativaAvaliacao || s.justificativaRecusa || '';

    let acoes = '';
    if (!modoAdotante) {
        if (s.status === 'PENDENTE') {
            acoes = `
                <button type="button" class="btn btn-outline btn-sm" data-acao="editar-ficha" data-id="${animal.id}">Editar Ficha</button>
                <button type="button" class="btn btn-outline btn-sm" data-acao="abrir-visita" data-id="${s.id}">Agendar Visita</button>
                <button type="button" class="btn btn-success btn-sm" data-acao="aprovar" data-id="${s.id}">Aprovar</button>
                <button type="button" class="btn btn-danger btn-sm" data-acao="recusar" data-id="${s.id}">Recusar</button>`;
        } else if (s.status === 'RECUSADA' && justificativa) {
            acoes = `<span class="alert alert-danger" style="margin:0">Justificativa: ${escapar(justificativa)}</span>`;
        }
    } else if (justificativa && s.status === 'RECUSADA') {
        acoes = `<span class="alert alert-danger" style="margin:0">Justificativa: ${escapar(justificativa)}</span>`;
    }

    const blocoVisita = s.visita
        ? `<div class="request-box">
                <h4>Visita Presencial (UC06)</h4>
                <p><span>Data e hora:</span> ${formatarDataHora(s.visita.dataHora)}</p>
                <p><span>Status:</span> ${s.visita.realizada ? 'Realizada' : 'Agendada'}</p>
                ${s.visita.observacoes ? `<p><span>Observações:</span> ${escapar(s.visita.observacoes)}</p>` : ''}
           </div>`
        : '';

    return `
        <article class="request-card">
            <div class="request-card-header">
                <h3>${escapar(animal.nome || 'Animal')} <span style="color:var(--text-muted);font-size:.84rem;font-weight:600">· Solicitação #${s.id}</span></h3>
                <span class="badge ${STATUS_SOLICITACAO_BADGE[s.status]}">${STATUS_SOLICITACAO_LABEL[s.status]}</span>
            </div>

            <div class="pet-mini-summary" style="margin-bottom:0">
                <img class="mini-summary-photo" src="${escapar(foto)}" alt="Foto de ${escapar(animal.nome || '')}" loading="lazy">
                <div class="mini-summary-info">
                    <p class="mini-summary-title">${escapar(animal.nome || '')} · ${escapar(animal.especie || '')}</p>
                    <div class="mini-summary-tags">
                        <span class="meta-tag">${formatarIdade(animal.idadeMeses || 0)}</span>
                        <span class="meta-tag">${MODALIDADE_LABEL[modalidade]}</span>
                    </div>
                </div>
            </div>

            <div class="request-columns">
                <div class="request-box">
                    <h4>Dados do Adotante</h4>
                    <p>${escapar(adotante.nome)}</p>
                    <p><span>CPF:</span> ${escapar(adotante.cpf)}</p>
                    <p><span>Idade:</span> ${escapar(adotante.idade)} anos</p>
                    <p><span>Telefone:</span> ${escapar(adotante.telefone)}</p>
                </div>
                <div class="request-box">
                    <h4>Perfil Residencial (UC03)</h4>
                    <p><span>Tipo de moradia:</span> ${MORADIA_LABEL[tipoMoradia] || tipoMoradia}</p>
                    <p><span>Telas de proteção:</span> ${possuiTelas ? 'Sim' : 'Não'}</p>
                    <p><span>Modalidade:</span> ${MODALIDADE_LABEL[modalidade]}</p>
                    <p><span>Solicitada em:</span> ${formatarDataHora(s.dataSolicitacao)}</p>
                </div>
                ${blocoVisita}
            </div>

            ${acoes ? `<div class="request-actions">${acoes}</div>` : ''}
        </article>`;
}

function renderAdminAnimais() {
    const wrapper = $('lista-animais-ong');
    const animaisAbrigo = state.todosAnimais.length > 0 ? state.todosAnimais : state.animais;

    if (animaisAbrigo.length === 0) {
        wrapper.innerHTML = `
            <div class="empty-state">
                Nenhum animal cadastrado até o momento.
            </div>`;
        return;
    }

    const linhas = animaisAbrigo.map(a => {
        const ficha = a.fichaMedica || {};
        const foto = a.fotoUrl || FOTOS_DEFAULT[a.especie];
        return `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:.65rem">
                        <img class="animal-photo-thumb" src="${escapar(foto)}" alt="" loading="lazy">
                        <strong>${escapar(a.nome)}</strong>
                    </div>
                </td>
                <td>${a.especie}</td>
                <td>${formatarIdade(a.idadeMeses)}</td>
                <td><span class="badge ${STATUS_ANIMAL_BADGE[a.status]}">${STATUS_ANIMAL_LABEL[a.status]}</span></td>
                <td>
                    <div class="detail-chips">
                        <span class="badge ${ficha.castrado ? 'badge-disponivel' : 'badge-analise'}">${ficha.castrado ? 'Castrado' : 'Não castrado'}</span>
                        <span class="badge ${ficha.vermifugado ? 'badge-disponivel' : 'badge-analise'}">${ficha.vermifugado ? 'Vermifugado' : 'Não vermif.'}</span>
                        <span class="meta-tag">${(ficha.vacinas || []).length} vacina(s)</span>
                    </div>
                </td>
                <td>
                    <button type="button" class="btn btn-outline btn-sm" data-acao="editar-ficha" data-id="${a.id}">Editar Ficha</button>
                </td>
            </tr>`;
    }).join('');

    wrapper.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Animal</th><th>Espécie</th><th>Idade</th><th>Status</th><th>Ficha Médica</th><th>Ações</th>
                </tr>
            </thead>
            <tbody>${linhas}</tbody>
        </table>`;
}

function renderAdminVisitas() {
    const lista = $('lista-visitas-ong');

    if (state.visitas.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                Nenhuma visita presencial agendada.<br>
                Selecione uma solicitação pendente e clique em <strong>Agendar Visita</strong>.
            </div>`;
        return;
    }

    lista.innerHTML = state.visitas.map(v => {
        const statusVisita = v.status || (v.realizada ? 'REALIZADA' : 'AGENDADA');
        const nomeAnimal = v.animalNome || v.animal?.nome || 'Animal';
        const nomeAdotante = v.adotanteNome || v.adotante?.nome || 'Adotante';

        return `
        <article class="request-card">
            <div class="request-card-header">
                <h3>Visita — ${escapar(nomeAnimal)}</h3>
                <span class="badge ${STATUS_VISITA_BADGE[statusVisita] || 'badge-analise'}">${STATUS_VISITA_LABEL[statusVisita] || statusVisita}</span>
            </div>
            <div class="request-columns">
                <div class="request-box">
                    <h4>Detalhes do Agendamento</h4>
                    <p><span>Data e hora:</span> ${formatarDataHora(v.dataHora)}</p>
                    <p><span>Adotante:</span> ${escapar(nomeAdotante)}</p>
                    <p><span>Observações:</span> ${escapar(v.observacoes) || '—'}</p>
                </div>
            </div>
            ${statusVisita === 'AGENDADA' ? `
            <div class="request-actions">
                <button type="button" class="btn btn-success btn-sm" data-acao="realizar-visita" data-id="${v.id}">Marcar Realizada</button>
            </div>` : ''}
        </article>`;
    }).join('');
}

/* ==================== CONTADORES / BADGES ==================== */

function atualizarContadores() {
    const total = obterMinhasSolicitacoes().length;
    const pendentes = state.solicitacoes.filter(s => s.status === 'PENDENTE').length;
    const visitasAgendadas = state.visitas.filter(v => (v.status ? v.status === 'AGENDADA' : !v.realizada)).length;

    const badgeTotal = $('badge-total-solicitacoes');
    badgeTotal.textContent = total;
    badgeTotal.classList.toggle('hidden', total === 0);

    $('badge-pendentes-ong').textContent = pendentes;
    $('badge-visitas-ong').textContent = visitasAgendadas;
}

/* ==================== AÇÕES: SOLICITAÇÕES ==================== */

function abrirModalAdocao(animalId) {
    const animal = buscarAnimal(animalId);
    if (!animal) return;

    if (animal.status !== 'DISPONIVEL') {
        showToast('Este pet não está disponível para novas solicitações no momento.', 'error');
        return;
    }

    const resumo = $('resumo-pet-adocao');
    const foto = animal.fotoUrl || FOTOS_DEFAULT[animal.especie];
    resumo.innerHTML = `
        <img class="mini-summary-photo" src="${escapar(foto)}" alt="" loading="lazy">
        <div class="mini-summary-info">
            <p class="mini-summary-title">${escapar(animal.nome)} · ${animal.especie}</p>
            <div class="mini-summary-tags">
                <span class="meta-tag">${formatarIdade(animal.idadeMeses)}</span>
                <span class="badge ${animal.modalidade === 'LAR_TEMPORARIO' ? 'badge-temporario' : 'badge-adotado'}">${MODALIDADE_LABEL[animal.modalidade]}</span>
            </div>
        </div>`;

    $('adocao-animal-id').value = animal.id;
    $('adocao-modalidade').value = animal.modalidade || 'ADOCAO_DEFINITIVA';
    $('alerta-erro-adocao').classList.add('hidden');
    openModal('modal-adocao');
}

async function enviarSolicitacaoAdocao(e) {
    e.preventDefault();

    const animalId = Number($('adocao-animal-id').value);
    const nome = $('adocao-nome').value.trim();
    const cpf = $('adocao-cpf').value.trim();
    const idade = parseInt($('adocao-idade').value, 10);
    const telefone = $('adocao-telefone').value.trim();
    const tipoMoradia = $('adocao-moradia').value;
    const telas = $('adocao-telas').value;
    const modalidade = $('adocao-modalidade').value;

    if (!animalId || !nome || !cpf || Number.isNaN(idade) || !telefone || !tipoMoradia || telas === '') {
        mostrarErroModal('alerta-erro-adocao', 'Preencha todos os campos obrigatórios (*) para registrar sua solicitação.');
        return;
    }

    if (!validarCPF(cpf)) {
        mostrarErroModal('alerta-erro-adocao', 'CPF inválido. Verifique os dígitos informados (formato 000.000.000-00).');
        return;
    }

    if (!validarTelefone(telefone)) {
        mostrarErroModal('alerta-erro-adocao', 'Telefone inválido. Informe DDD + número com 10 ou 11 dígitos.');
        return;
    }

    $('alerta-erro-adocao').classList.add('hidden');

    const btnSubmit = e.submitter || $('btn-enviar-solicitacao');

    try {
        await executarComLoading(btnSubmit, 'Enviando...', async () => {
            const resposta = await api.enviarSolicitacao({
                animalId,
                modalidade,
                adotante: {
                    nome,
                    cpf,
                    idade,
                    telefone,
                    tipoMoradia,
                    possuiTelasProtecao: telas === 'true'
                }
            });

            if (resposta.solicitacao?.adotanteId) {
                setAdotanteAtivoId(resposta.solicitacao.adotanteId);
            }

            await sincronizarEstadoAPI();

            closeModal('modal-adocao');
            $('form-adocao').reset();
            showToast(resposta.mensagem || 'Solicitação registrada com sucesso!', 'success');
        });
    } catch (erro) {
        const prefixo = erro.regraViolada ? `[${erro.regraViolada}] ` : '';
        mostrarErroModal('alerta-erro-adocao', `${prefixo}${erro.message}`);
    }
}

async function aprovarSolicitacao(solicitacaoId, btnEl) {
    try {
        await executarComLoading(btnEl, 'Aprovando...', async () => {
            const resposta = await api.avaliarSolicitacao(solicitacaoId, 'APROVAR');
            await sincronizarEstadoAPI();
            showToast(resposta.mensagem || 'Solicitação aprovada com sucesso!', 'success');
        });
    } catch (erro) {
        const prefixo = erro.regraViolada ? `[${erro.regraViolada}] ` : '';
        showToast(`${prefixo}${erro.message}`, 'error');
    }
}

function abrirModalRecusa(solicitacaoId) {
    $('recusar-solicitacao-id').value = solicitacaoId;
    $('recusar-justificativa').value = '';
    $('alerta-recusar').classList.add('hidden');
    openModal('modal-recusar');
}

async function confirmarRecusa(e) {
    e.preventDefault();
    const justificativa = $('recusar-justificativa').value.trim();
    if (!justificativa) {
        mostrarErroModal('alerta-recusar', 'Informe a justificativa da recusa (obrigatória para feedback ao adotante).');
        return;
    }

    const id = Number($('recusar-solicitacao-id').value);
    const btnSubmit = e.submitter || e.target.querySelector('[type="submit"]');
    $('alerta-recusar').classList.add('hidden');

    try {
        await executarComLoading(btnSubmit, 'Recusando...', async () => {
            const resposta = await api.avaliarSolicitacao(id, 'RECUSAR', justificativa);
            await sincronizarEstadoAPI();
            closeModal('modal-recusar');
            showToast(resposta.mensagem || 'Solicitação recusada e animal liberado no catálogo.', 'success');
        });
    } catch (erro) {
        mostrarErroModal('alerta-recusar', erro.message);
    }
}

/* ==================== AÇÕES: VISITAS ==================== */

function abrirModalVisita(solicitacaoId) {
    const s = state.solicitacoes.find(x => x.id === solicitacaoId);
    if (!s) return;

    const animal = s.animal || buscarAnimal(s.animalId) || {};
    const adotante = s.adotante || {};
    const foto = animal.fotoUrl || FOTOS_DEFAULT[animal.especie] || '';
    $('resumo-visita-solicitacao').innerHTML = `
        <img class="mini-summary-photo" src="${escapar(foto)}" alt="" loading="lazy">
        <div class="mini-summary-info">
            <p class="mini-summary-title">${escapar(animal.nome || '')} · ${escapar(adotante.nome || '')}</p>
            <div class="mini-summary-tags">
                <span class="badge badge-adotado">${STATUS_SOLICITACAO_LABEL[s.status]}</span>
            </div>
        </div>`;

    $('visita-solicitacao-id').value = solicitacaoId;
    $('visita-data-hora').value = '';
    $('visita-observacoes').value = '';
    $('alerta-visita').classList.add('hidden');
    openModal('modal-visita');
}

async function agendarVisita(e) {
    e.preventDefault();

    const dataHora = $('visita-data-hora').value;
    if (!dataHora) {
        mostrarErroModal('alerta-visita', 'Escolha a data e o horário da visita presencial.');
        return;
    }

    const solicitacaoId = Number($('visita-solicitacao-id').value);
    const observacoes = $('visita-observacoes').value.trim();
    const btnSubmit = e.submitter || e.target.querySelector('[type="submit"]');
    $('alerta-visita').classList.add('hidden');

    try {
        await executarComLoading(btnSubmit, 'Agendando...', async () => {
            const resposta = await api.agendarVisita(solicitacaoId, dataHora, observacoes);
            await sincronizarEstadoAPI();
            closeModal('modal-visita');
            showToast(resposta.mensagem || 'Visita presencial agendada!', 'success');
        });
    } catch (erro) {
        mostrarErroModal('alerta-visita', erro.message);
    }
}

async function realizarVisita(visitaId, btnEl) {
    try {
        await executarComLoading(btnEl, 'Confirmando...', async () => {
            const resposta = await api.confirmarVisita(visitaId);
            await sincronizarEstadoAPI();
            showToast(resposta.mensagem || 'Visita confirmada como realizada!', 'success');
        });
    } catch (erro) {
        showToast(erro.message, 'error');
    }
}

/* ==================== AÇÕES: FICHA MÉDICA ==================== */

function abrirModalFicha(animalId) {
    const animal = buscarAnimal(animalId);
    if (!animal) return;

    const ficha = animal.fichaMedica || {};
    const foto = animal.fotoUrl || FOTOS_DEFAULT[animal.especie];
    $('resumo-pet-ficha').innerHTML = `
        <img class="mini-summary-photo" src="${escapar(foto)}" alt="" loading="lazy">
        <div class="mini-summary-info">
            <p class="mini-summary-title">${escapar(animal.nome)}</p>
            <div class="mini-summary-tags">
                <span class="meta-tag">${formatarIdade(animal.idadeMeses)}</span>
                <span class="badge ${animal.especie === 'Gato' ? 'species-gato' : 'species-cachorro'}">${animal.especie}</span>
            </div>
        </div>`;

    $('ficha-animal-id').value = animal.id;
    $('ficha-castrado').checked = !!ficha.castrado;
    $('ficha-vermifugado').checked = !!ficha.vermifugado;
    $('ficha-observacoes').value = ficha.observacoesClinicas || '';
    $('ficha-vacina-nome').value = '';
    $('ficha-vacina-lote').value = '';
    $('ficha-vacina-data').value = '';
    $('alerta-ficha-medica').classList.add('hidden');
    openModal('modal-ficha-medica');
}

async function salvarFichaMedica(e) {
    e.preventDefault();

    const animalId = Number($('ficha-animal-id').value);
    const castrado = $('ficha-castrado').checked;
    const vermifugado = $('ficha-vermifugado').checked;
    const observacoesClinicas = $('ficha-observacoes').value.trim();

    const novaVacinaNome = $('ficha-vacina-nome').value.trim();
    const novaVacinaLote = $('ficha-vacina-lote').value.trim();
    const novaVacinaData = $('ficha-vacina-data').value;

    if (novaVacinaNome && (!novaVacinaLote || !novaVacinaData)) {
        mostrarErroModal('alerta-ficha-medica', 'Para adicionar uma vacina, informe nome, lote e data de aplicação.');
        return;
    }

    const payload = {
        castrado,
        vermifugado,
        observacoesClinicas,
        ...(novaVacinaNome
            ? {
                novaVacina: {
                    nomeVacina: novaVacinaNome,
                    lote: novaVacinaLote,
                    dataAplicacao: novaVacinaData
                }
            }
            : {})
    };

    const btnSubmit = e.submitter || e.target.querySelector('[type="submit"]');
    $('alerta-ficha-medica').classList.add('hidden');

    try {
        await executarComLoading(btnSubmit, 'Salvando...', async () => {
            const resposta = await api.atualizarFichaMedica(animalId, payload);
            await sincronizarEstadoAPI();
            closeModal('modal-ficha-medica');
            showToast(resposta.mensagem || 'Ficha médica atualizada com sucesso!', 'success');
        });
    } catch (erro) {
        mostrarErroModal('alerta-ficha-medica', erro.message);
    }
}

/* ==================== AÇÕES: CADASTRAR ANIMAL ==================== */

async function enviarNovoAnimal(e) {
    e.preventDefault();

    const nome = $('novo-nome').value.trim();
    const especie = $('novo-especie').value;
    const idadeStr = $('novo-idade').value;
    const porte = $('novo-porte').value;
    const sexo = $('novo-sexo').value;
    const modalidade = $('novo-modalidade').value;
    const fotoUrl = $('novo-foto').value.trim();
    const descricao = $('novo-descricao').value.trim();
    const alerta = $('alerta-novo-animal');

    if (!nome || idadeStr === '') {
        alerta.className = 'alert alert-danger';
        alerta.textContent = 'Preencha os campos obrigatórios (*) para cadastrar o animal.';
        alerta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
    }

    const vacinaNome = $('novo-vacina-nome').value.trim();
    const vacinaLote = $('novo-vacina-lote').value.trim();
    const vacinaData = $('novo-vacina-data').value;

    if (vacinaNome && (!vacinaLote || !vacinaData)) {
        alerta.className = 'alert alert-danger';
        alerta.textContent = 'Para registrar uma vacina inicial, informe nome, lote e data de aplicação.';
        alerta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
    }

    const vacinas = vacinaNome
        ? [{ nomeVacina: vacinaNome, lote: vacinaLote, dataAplicacao: vacinaData }]
        : [];

    const payload = {
        nome,
        especie,
        idadeMeses: Number(idadeStr),
        porte,
        sexo,
        modalidade,
        fotoUrl,
        descricao,
        ...(especie === 'Cachorro'
            ? {
                nivelEnergia: $('novo-nivel-energia').value,
                sociavelComCaes: $('novo-sociavel-caes').checked
            }
            : {
                testadoFivFelv: $('novo-testado-fiv').checked,
                negativoFivFelv: $('novo-negativo-fiv').checked,
                adaptadoApartamento: $('novo-adaptado-apto').checked
            }),
        fichaMedica: {
            castrado: $('novo-castrado').checked,
            vermifugado: $('novo-vermifugado').checked,
            observacoesClinicas: $('novo-obs-clinicas').value.trim(),
            vacinas
        }
    };

    alerta.classList.add('hidden');
    const btnSubmit = e.submitter || e.target.querySelector('[type="submit"]');

    try {
        await executarComLoading(btnSubmit, 'Cadastrando...', async () => {
            const resposta = await api.cadastrarAnimal(payload);
            $('form-novo-animal').reset();
            alternarCamposEspecie();
            await sincronizarEstadoAPI();
            showToast(resposta.mensagem || 'Animal cadastrado com sucesso!', 'success');
            showAdminTab('tab-animais-ong');
        });
    } catch (erro) {
        alerta.className = 'alert alert-danger';
        alerta.textContent = erro.message;
        alerta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function alternarCamposEspecie() {
    const especie = $('novo-especie').value;
    $('campos-especificos-cachorro').classList.toggle('hidden', especie !== 'Cachorro');
    $('campos-especificos-gato').classList.toggle('hidden', especie !== 'Gato');
}

/* ==================== ABAS DO PAINEL ADMIN ==================== */

function showAdminTab(tabId) {
    document.querySelectorAll('.admin-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.adminTab === tabId);
    });
    document.querySelectorAll('.admin-tab-content').forEach(c => {
        c.classList.toggle('hidden', c.id !== tabId);
    });
}

/* ==================== RENDER GERAL ==================== */

function renderAll() {
    renderCatalogo();
    renderMinhasSolicitacoes();
    renderAdminSolicitacoes();
    renderAdminAnimais();
    renderAdminVisitas();
}

/* ==================== DELEGAÇÃO DE CLIQUES (botões renderizados) ==================== */

function handleClickDelegado(event) {
    const btn = event.target.closest('[data-acao]');
    if (!btn) return;

    const acao = btn.dataset.acao;
    const id = Number(btn.dataset.id);

    switch (acao) {
        case 'detalhes':
            verDetalhes(id);
            break;
        case 'adotar':
            closeModal('modal-detalhes');
            abrirModalAdocao(id);
            break;
        case 'aprovar':
            aprovarSolicitacao(id, btn);
            break;
        case 'recusar':
            abrirModalRecusa(id);
            break;
        case 'abrir-visita':
            abrirModalVisita(id);
            break;
        case 'realizar-visita':
            realizarVisita(id, btn);
            break;
        case 'editar-ficha':
            abrirModalFicha(id);
            break;
    }
}

/* ==================== INICIALIZAÇÃO ==================== */

function init() {
    // Navegação principal da SPA
    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
        link.addEventListener('click', () => showView(link.dataset.view));
    });

    $('btn-home').addEventListener('click', () => showView('view-catalogo'));

    // Troca de perfil (RNF03)
    $('select-perfil-ativo').addEventListener('change', (e) => switchPerfil(e.target.value));

    // Filtros do catálogo (RNF01 — assíncrono via API)
    let buscaTimer = null;
    $('form-filtros').addEventListener('submit', e => e.preventDefault());
    $('filtro-busca').addEventListener('input', e => {
        state.filtros.busca = e.target.value.trim();
        clearTimeout(buscaTimer);
        buscaTimer = setTimeout(() => {
            atualizarCatalogoFiltrado();
        }, 250);
    });
    ['filtro-especie', 'filtro-porte', 'filtro-sexo', 'filtro-modalidade', 'filtro-status'].forEach(id => {
        $(id).addEventListener('change', e => {
            state.filtros[id.replace('filtro-', '')] = e.target.value;
            atualizarCatalogoFiltrado();
        });
    });
    $('btn-limpar-filtros').addEventListener('click', () => {
        clearTimeout(buscaTimer);
        state.filtros = { busca: '', especie: 'TODOS', porte: 'TODOS', sexo: 'TODOS', modalidade: 'TODOS', status: 'TODOS' };
        $('form-filtros').reset();
        atualizarCatalogoFiltrado();
    });

    // Atalhos rápidos de categorias (Estilo Paw & Purpose)
    document.querySelectorAll('.category-card[data-quick-filter]').forEach(card => {
        card.addEventListener('click', () => {
            clearTimeout(buscaTimer);
            const filtro = card.dataset.quickFilter;
            state.filtros = { busca: '', especie: 'TODOS', porte: 'TODOS', sexo: 'TODOS', modalidade: 'TODOS', status: 'TODOS' };
            $('form-filtros').reset();

            if (filtro === 'Cachorro' || filtro === 'Gato') {
                state.filtros.especie = filtro;
                $('filtro-especie').value = filtro;
            } else if (filtro === 'LAR_TEMPORARIO') {
                state.filtros.modalidade = 'LAR_TEMPORARIO';
                $('filtro-modalidade').value = 'LAR_TEMPORARIO';
            } else if (filtro === 'PEQUENO') {
                state.filtros.porte = 'PEQUENO';
                $('filtro-porte').value = 'PEQUENO';
            }

            atualizarCatalogoFiltrado();
        });
    });

    // Abas do painel admin
    document.querySelectorAll('.admin-tab').forEach(t => {
        t.addEventListener('click', () => showAdminTab(t.dataset.adminTab));
    });
    $('filtro-status-solicitacao').addEventListener('change', e => {
        state.filtroAdminSolicitacoes = e.target.value;
        renderAdminSolicitacoes();
    });

    // Campos específicos por espécie no cadastro
    $('novo-especie').addEventListener('change', alternarCamposEspecie);

    // Máscaras automáticas de CPF e Telefone
    $('adocao-cpf').addEventListener('input', e => {
        e.target.value = aplicarMascaraCPF(e.target.value);
    });
    $('adocao-telefone').addEventListener('input', e => {
        e.target.value = aplicarMascaraTelefone(e.target.value);
    });

    // Formulários
    $('form-adocao').addEventListener('submit', enviarSolicitacaoAdocao);
    $('form-recusar-solicitacao').addEventListener('submit', confirmarRecusa);
    $('form-agendar-visita').addEventListener('submit', agendarVisita);
    $('form-editar-ficha').addEventListener('submit', salvarFichaMedica);
    $('form-novo-animal').addEventListener('submit', enviarNovoAnimal);

    // Botões de fechar modal (data-close-modal)
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });

    // Cliques em botões renderizados dinamicamente
    $('catalogo-grid').addEventListener('click', handleClickDelegado);
    $('lista-solicitacoes-ong').addEventListener('click', handleClickDelegado);
    $('lista-animais-ong').addEventListener('click', handleClickDelegado);
    $('lista-visitas-ong').addEventListener('click', handleClickDelegado);
    $('modal-detalhes-body').addEventListener('click', (e) => {
        const closeBtn = e.target.closest('[data-close-modal]');
        if (closeBtn) {
            closeModal(closeBtn.dataset.closeModal);
            return;
        }
        if (e.target.closest('[data-acao]')) handleClickDelegado(e);
    });

    // Fechar modal: clique no overlay ou tecla Esc
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => closeModal(m.id));
    });

    carregarDadosIniciais();
}

init();
