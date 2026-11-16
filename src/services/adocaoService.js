const repo = require('../repositories/jsonRepository');
const SolicitacaoAdocao = require('../models/SolicitacaoAdocao');
const VisitaPresencial = require('../models/VisitaPresencial');
const {
    validarFormatoCPF,
    formatarCPF,
    validarFormatoTelefone,
    formatarTelefone
} = require('../config/constants');

/**
 * Camada de Serviço responsável por orquestrar os Casos de Uso e Regras de Negócio (RN01 a RN04)
 */
const adocaoService = {
    enriquecerSolicitacao(solicitacao) {
        const animal = repo.buscarAnimalPorId(solicitacao.animalId);
        const adotante = repo.buscarAdotantePorId(solicitacao.adotanteId);
        const visita = repo.buscarVisitaPorSolicitacaoId(solicitacao.id);

        return {
            ...solicitacao.toJSON(),
            animal: animal ? animal.toJSON() : null,
            adotante: adotante ? adotante.toJSON() : null,
            visita: visita ? visita.toJSON() : null
        };
    },

    registrarSolicitacao({ animalId, adotanteId, modalidade = 'ADOCAO_DEFINITIVA', dadosAdotante }) {
        const animal = repo.buscarAnimalPorId(animalId);
        if (!animal) {
            const erro = new Error('Animal não encontrado.');
            erro.statusHttp = 404;
            throw erro;
        }

        let adotante = null;
        if (dadosAdotante && dadosAdotante.nome && dadosAdotante.idade !== undefined) {
            if (!dadosAdotante.cpf || !validarFormatoCPF(dadosAdotante.cpf)) {
                const erro = new Error('CPF inválido. Verifique os dígitos informados.');
                erro.statusHttp = 400;
                throw erro;
            }
            if (!dadosAdotante.telefone || !validarFormatoTelefone(dadosAdotante.telefone)) {
                const erro = new Error('Telefone inválido. Informe DDD + número (10 ou 11 dígitos).');
                erro.statusHttp = 400;
                throw erro;
            }

            adotante = repo.salvarOuAtualizarAdotante({
                ...dadosAdotante,
                cpf: formatarCPF(dadosAdotante.cpf),
                telefone: formatarTelefone(dadosAdotante.telefone),
                id: adotanteId || dadosAdotante.id
            });
        } else if (adotanteId) {
            adotante = repo.buscarAdotantePorId(adotanteId);
            if (!adotante) {
                const erro = new Error('Adotante não encontrado.');
                erro.statusHttp = 404;
                throw erro;
            }
            if (dadosAdotante) {
                adotante.atualizarPerfilResidencial(
                    dadosAdotante.tipoMoradia !== undefined ? dadosAdotante.tipoMoradia : adotante.tipoMoradia,
                    dadosAdotante.possuiTelasProtecao !== undefined ? dadosAdotante.possuiTelasProtecao : adotante.possuiTelasProtecao
                );
                if (dadosAdotante.idade !== undefined) {
                    adotante.idade = Number(dadosAdotante.idade);
                }
                adotante = repo.salvarOuAtualizarAdotante(adotante.toJSON());
            }
        } else {
            const erro = new Error('Informe o adotante ou preencha os dados do questionário de perfil.');
            erro.statusHttp = 400;
            throw erro;
        }

        const novaSolicitacao = new SolicitacaoAdocao({
            adotanteId: adotante.id,
            animalId: animal.id,
            modalidade,
            status: 'PENDENTE'
        });

        // Valida RN01 (Maioridade), RN02 (Tela para Gatos) e RN03 (Exclusividade de Análise)
        const resultadoValidacao = novaSolicitacao.verificarRegras(adotante, animal);
        if (!resultadoValidacao.valido) {
            const erro = new Error(resultadoValidacao.mensagem);
            erro.statusHttp = resultadoValidacao.statusHttp;
            erro.regraViolada = resultadoValidacao.regraViolada;
            throw erro;
        }

        const solicitacaoSalva = repo.adicionarSolicitacao({
            ...novaSolicitacao.toJSON(),
            id: undefined
        });
        animal.alterarStatus('EM_ANALISE');
        repo.atualizarAnimal(animal);

        return this.enriquecerSolicitacao(solicitacaoSalva);
    },

    avaliarSolicitacao(solicitacaoId, { acao, justificativa }) {
        const solicitacao = repo.buscarSolicitacaoPorId(solicitacaoId);
        if (!solicitacao) {
            const erro = new Error('Solicitação não encontrada.');
            erro.statusHttp = 404;
            throw erro;
        }

        if (solicitacao.status !== 'PENDENTE') {
            const erro = new Error(`Esta solicitação já foi encerrada com o status ${solicitacao.status}.`);
            erro.statusHttp = 409;
            throw erro;
        }

        const animal = repo.buscarAnimalPorId(solicitacao.animalId);
        if (!animal) {
            const erro = new Error('Animal vinculado não encontrado.');
            erro.statusHttp = 404;
            throw erro;
        }

        const acaoNormalizada = String(acao || '').toUpperCase().trim();

        if (acaoNormalizada === 'APROVAR' || acaoNormalizada === 'APROVADA') {
            // Valida RN04 internamente e atualiza o status do animal (<<include>> UC05)
            solicitacao.aprovar(animal);
            if (justificativa) {
                solicitacao.justificativaAvaliacao = String(justificativa).trim();
            }
        } else if (acaoNormalizada === 'RECUSAR' || acaoNormalizada === 'RECUSADA') {
            solicitacao.recusar(justificativa, animal);
        } else {
            const erro = new Error('Ação inválida. Informe "APROVAR" ou "RECUSAR".');
            erro.statusHttp = 400;
            throw erro;
        }

        repo.atualizarSolicitacao(solicitacao);
        repo.atualizarAnimal(animal);

        return this.enriquecerSolicitacao(solicitacao);
    },

    agendarVisita(solicitacaoId, { dataHora, observacoes }) {
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

        const visita = new VisitaPresencial({
            solicitacaoId: solicitacao.id,
            observacoes
        });

        if (!visita.agendar(dataHora)) {
            const erro = new Error('Informe uma data e horário válidos para agendar a visita presencial.');
            erro.statusHttp = 400;
            throw erro;
        }

        const visitaSalva = repo.salvarOuAtualizarVisita(visita.toJSON());

        return {
            visita: visitaSalva.toJSON(),
            solicitacao: this.enriquecerSolicitacao(solicitacao)
        };
    }
};

module.exports = adocaoService;

