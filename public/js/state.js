/* ============================================================
   STATE — Estado global da SPA AdotaPet
   ============================================================ */

export const state = {
    perfilAtivo: 'ADOTANTE', // 'ADOTANTE' | 'GESTOR_ONG'
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
