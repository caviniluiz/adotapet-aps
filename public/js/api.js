/* ============================================================
   API — Cliente HTTP (Fetch Wrapper) completo da SPA AdotaPet
   ============================================================ */

import { state } from './state.js';

async function request(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'x-perfil': state.perfilAtivo,
        ...(options.headers || {})
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const erro = new Error(data.mensagem || 'Erro ao processar requisição na API.');
        erro.status = response.status;
        erro.regraViolada = data.regraViolada || null;
        throw erro;
    }

    return data;
}

export const api = {
    listarPerfis() {
        return request('/api/auth/perfis');
    },

    login(identificador, senha) {
        return request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ identificador, senha })
        });
    },

    registrarAdotante(dados) {
        return request('/api/auth/registro', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    },

    listarAnimais(filtros = {}) {
        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([chave, valor]) => {
            if (valor !== undefined && valor !== null && valor !== 'TODOS' && String(valor).trim() !== '') {
                params.append(chave, String(valor).trim());
            }
        });
        const query = params.toString();
        return request(`/api/animais${query ? `?${query}` : ''}`);
    },

    buscarAnimalPorId(id) {
        return request(`/api/animais/${id}`);
    },

    cadastrarAnimal(dadosAnimal) {
        return request('/api/animais', {
            method: 'POST',
            body: JSON.stringify(dadosAnimal)
        });
    },

    atualizarFichaMedica(animalId, dadosFicha) {
        return request(`/api/animais/${animalId}/ficha-medica`, {
            method: 'PATCH',
            body: JSON.stringify(dadosFicha)
        });
    },

    listarSolicitacoes(filtros = {}) {
        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([chave, valor]) => {
            if (valor !== undefined && valor !== null && valor !== 'TODOS' && String(valor).trim() !== '') {
                params.append(chave, String(valor).trim());
            }
        });
        const query = params.toString();
        return request(`/api/solicitacoes${query ? `?${query}` : ''}`);
    },

    enviarSolicitacao(payload) {
        return request('/api/solicitacoes', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    avaliarSolicitacao(solicitacaoId, acao, justificativa = '') {
        return request(`/api/solicitacoes/${solicitacaoId}/avaliar`, {
            method: 'PATCH',
            body: JSON.stringify({ acao, justificativa })
        });
    },

    agendarVisita(solicitacaoId, dataHora, observacoes = '') {
        return request(`/api/solicitacoes/${solicitacaoId}/visita`, {
            method: 'POST',
            body: JSON.stringify({ dataHora, observacoes })
        });
    },

    listarVisitas() {
        return request('/api/visitas');
    },

    confirmarVisita(visitaId, observacoes = '') {
        return request(`/api/visitas/${visitaId}/confirmar`, {
            method: 'PATCH',
            body: JSON.stringify({ observacoes })
        });
    }
};
