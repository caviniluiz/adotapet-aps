const repo = require('../repositories/jsonRepository');
const VisitaPresencial = require('../models/VisitaPresencial');

const visitasService = {
    listarVisitas() {
        const visitas = repo.listarVisitas();
        return visitas.map(v => {
            const solicitacao = repo.buscarSolicitacaoPorId(v.solicitacaoId);
            const animal = solicitacao ? repo.buscarAnimalPorId(solicitacao.animalId) : null;
            const adotante = solicitacao ? repo.buscarAdotantePorId(solicitacao.adotanteId) : null;
            return {
                ...v.toJSON(),
                solicitacao: solicitacao ? solicitacao.toJSON() : null,
                animal: animal ? animal.toJSON() : null,
                adotante: adotante ? adotante.toJSON() : null
            };
        });
    },

    agendarVisita({ solicitacaoId, dataHora, observacoes }) {
        if (!solicitacaoId) {
            const erro = new Error('O ID da solicitação é obrigatório.');
            erro.statusHttp = 400;
            throw erro;
        }

        const solicitacao = repo.buscarSolicitacaoPorId(solicitacaoId);
        if (!solicitacao) {
            const erro = new Error('Solicitação não encontrada.');
            erro.statusHttp = 404;
            throw erro;
        }

        if (solicitacao.status !== 'PENDENTE') {
            const erro = new Error('Só é possível agendar visitas para solicitações que estejam com status PENDENTE.');
            erro.statusHttp = 409;
            throw erro;
        }

        const visita = new VisitaPresencial({ solicitacaoId: solicitacao.id, observacoes });
        if (!visita.agendar(dataHora)) {
            const erro = new Error('Data e horário inválidos.');
            erro.statusHttp = 400;
            throw erro;
        }

        const salva = repo.salvarOuAtualizarVisita(visita.toJSON());
        return salva.toJSON();
    },

    confirmarRealizacao(visitaId, { observacoes } = {}) {
        const visitas = repo.listarVisitas();
        const visita = visitas.find(v => v.id === Number(visitaId));

        if (!visita) {
            const erro = new Error('Visita presencial não encontrada.');
            erro.statusHttp = 404;
            throw erro;
        }

        visita.confirmarRealizacao();
        if (observacoes !== undefined) {
            visita.observacoes = String(observacoes).trim();
        }

        repo.salvarVisitas(visitas);
        return visita.toJSON();
    }
};

module.exports = visitasService;

