class SolicitacaoAdocao {
    constructor({
        id,
        adotanteId,
        animalId,
        dataSolicitacao,
        modalidade = 'ADOCAO_DEFINITIVA',
        status = 'PENDENTE',
        justificativaAvaliacao = ''
    }) {
        this.id = id ? Number(id) : Date.now();
        this.adotanteId = Number(adotanteId);
        this.animalId = Number(animalId);
        this.dataSolicitacao = dataSolicitacao || new Date().toISOString();
        this.modalidade = String(modalidade).toUpperCase().trim();
        this.status = String(status).toUpperCase().trim();
        this.justificativaAvaliacao = justificativaAvaliacao ? String(justificativaAvaliacao).trim() : '';
    }

    /**
     * Método auxiliar detalhado para validação das Regras de Negócio (RN01, RN02 e RN03),
     * retornando o código da regra, status HTTP sugerido e mensagem explicativa para a API.
     */
    verificarRegras(adotante, animal) {
        if (!adotante) {
            return {
                valido: false,
                regraViolada: 'DADOS_INVALIDOS',
                statusHttp: 400,
                mensagem: 'Adotante não informado ou inválido.'
            };
        }

        if (!animal) {
            return {
                valido: false,
                regraViolada: 'DADOS_INVALIDOS',
                statusHttp: 400,
                mensagem: 'Animal não informado ou inválido.'
            };
        }

        // RN03 (Exclusividade de Análise): animal EM_ANALISE ou ADOTADO fica bloqueado
        const disponivel = typeof animal.verificarDisponibilidade === 'function'
            ? animal.verificarDisponibilidade()
            : animal.status === 'DISPONIVEL';

        if (!disponivel) {
            return {
                valido: false,
                regraViolada: 'RN03',
                statusHttp: 409,
                mensagem: `Este animal não está disponível para novas solicitações no momento (status atual: ${animal.status}).`
            };
        }

        // RN01 (Maioridade Civil): idade >= 18 anos
        const maiorDeIdade = typeof adotante.cumpreIdadeMinima === 'function'
            ? adotante.cumpreIdadeMinima()
            : Number(adotante.idade) >= 18;

        if (!maiorDeIdade) {
            return {
                valido: false,
                regraViolada: 'RN01',
                statusHttp: 422,
                mensagem: 'Apenas maiores de 18 anos podem solicitar adoção.'
            };
        }

        // RN02 (Critério de Segurança para Felinos): Gato exige possuiTelasProtecao === true
        const exigeTela = typeof animal.exigeRedeProtecao === 'function'
            ? animal.exigeRedeProtecao()
            : animal.especie === 'Gato';

        if (exigeTela && !adotante.possuiTelasProtecao) {
            return {
                valido: false,
                regraViolada: 'RN02',
                statusHttp: 422,
                mensagem: 'Política de segurança para felinos: a adoção ou lar temporário de gatos exige obrigatoriamente que o imóvel possua telas de proteção em janelas e sacadas.'
            };
        }

        return {
            valido: true,
            regraViolada: null,
            statusHttp: 200,
            mensagem: 'Compatibilidade validada com sucesso.'
        };
    }

    /**
     * Assinatura do Diagrama de Classes UML (4.5):
     * +validarCompatibilidade(adotante: Adotante, animal: Animal): Boolean
     */
    validarCompatibilidade(adotante, animal) {
        return this.verificarRegras(adotante, animal).valido;
    }

    aprovar(animal) {
        // Se for adoção definitiva e animal for passado, verifica RN04 (castração em >= 6 meses)
        if (animal && this.modalidade === 'ADOCAO_DEFINITIVA') {
            const aptoCastracao = animal.fichaMedica
                ? animal.fichaMedica.estaAptoAdocaoDefinitiva(animal.idadeMeses)
                : true;

            if (!aptoCastracao) {
                const erro = new Error(
                    'RN04: Animais com 6 meses ou mais só podem ter a adoção definitiva aprovada se constarem como castrados na ficha médica.'
                );
                erro.regraViolada = 'RN04';
                erro.statusHttp = 422;
                throw erro;
            }
        }

        this.status = 'APROVADA';

        if (animal && typeof animal.alterarStatus === 'function') {
            const novoStatusAnimal = this.modalidade === 'LAR_TEMPORARIO' ? 'EM_LAR_TEMPORARIO' : 'ADOTADO';
            animal.alterarStatus(novoStatusAnimal);
        }
    }

    recusar(motivo, animal) {
        if (!motivo || String(motivo).trim() === '') {
            const erro = new Error('A justificativa é obrigatória para recusar uma solicitação.');
            erro.statusHttp = 400;
            throw erro;
        }

        this.status = 'RECUSADA';
        this.justificativaAvaliacao = String(motivo).trim();

        if (animal && typeof animal.alterarStatus === 'function') {
            animal.alterarStatus('DISPONIVEL');
        }
    }

    toJSON() {
        return {
            id: this.id,
            adotanteId: this.adotanteId,
            animalId: this.animalId,
            dataSolicitacao: this.dataSolicitacao,
            modalidade: this.modalidade,
            status: this.status,
            justificativaAvaliacao: this.justificativaAvaliacao
        };
    }
}

module.exports = SolicitacaoAdocao;

