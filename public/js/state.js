/* ============================================================
   STATE — Estado global e sessão autenticada da SPA AdotaPet
   ============================================================ */

function lerSessaoSalva() {
    if (typeof localStorage === 'undefined') return null;
    try {
        const bruto = localStorage.getItem('adotapet_sessao');
        return bruto ? JSON.parse(bruto) : null;
    } catch {
        return null;
    }
}

const sessaoSalva = lerSessaoSalva();

export const state = {
    usuarioLogado: sessaoSalva,
    perfilAtivo: sessaoSalva?.perfil || 'VISITANTE', // 'VISITANTE' | 'ADOTANTE' | 'GESTOR_ONG'
    adotanteAtivoId: sessaoSalva?.perfil === 'ADOTANTE' ? Number(sessaoSalva.id) : null,
    animalPendenteAdocaoId: null,
    perfis: [],
    todosAnimais: [],
    animais: [],
    solicitacoes: [],
    visitas: [],
    filtros: {
        busca: '',
        especie: 'TODOS',
        porte: 'TODOS',
        sexo: 'TODOS',
        modalidade: 'TODOS',
        status: 'TODOS'
    },
    filtroAdminSolicitacoes: 'TODOS'
};

export function setSessaoUsuario(usuario) {
    if (!usuario) {
        limparSessaoUsuario();
        return;
    }

    state.usuarioLogado = usuario;
    state.perfilAtivo = usuario.perfil || 'ADOTANTE';
    state.adotanteAtivoId = state.perfilAtivo === 'ADOTANTE' ? Number(usuario.id) : null;

    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('adotapet_sessao', JSON.stringify(usuario));
    }
}

export function limparSessaoUsuario() {
    state.usuarioLogado = null;
    state.perfilAtivo = 'VISITANTE';
    state.adotanteAtivoId = null;
    state.animalPendenteAdocaoId = null;

    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('adotapet_sessao');
        localStorage.removeItem('adotapet_adotante_id');
    }
}
