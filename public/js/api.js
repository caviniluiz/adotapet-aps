/* ============================================================
   API — Cliente HTTP (Fetch Wrapper) para os Itens 1 a 4
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

    listarVisitas() {
        return request('/api/visitas');
    }
};
