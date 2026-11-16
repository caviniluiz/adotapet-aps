/* ============================================================
   STATE — Estado global da SPA AdotaPet
   ============================================================ */

const adotanteSalvo = typeof localStorage !== 'undefined'
    ? localStorage.getItem('adotapet_adotante_id')
    : null;

export const state = {
    perfilAtivo: 'ADOTANTE', // 'ADOTANTE' | 'GESTOR_ONG'
    adotanteAtivoId: adotanteSalvo ? Number(adotanteSalvo) : null,
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

export function setAdotanteAtivoId(id) {
    const idNum = id ? Number(id) : null;
    state.adotanteAtivoId = idNum;
    if (typeof localStorage !== 'undefined') {
        if (idNum) {
            localStorage.setItem('adotapet_adotante_id', String(idNum));
        } else {
            localStorage.removeItem('adotapet_adotante_id');
        }
    }
}
