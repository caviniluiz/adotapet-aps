class VisitaPresencial {
    constructor({
        id,
        solicitacaoId,
        dataHora,
        observacoes = '',
        realizada = false
    }) {
        this.id = id ? Number(id) : Date.now();
        this.solicitacaoId = Number(solicitacaoId);
        this.dataHora = dataHora || null;
        this.observacoes = observacoes ? String(observacoes).trim() : '';
        this.realizada = Boolean(realizada);
    }

    agendar(novaData) {
        if (!novaData) {
            return false;
        }
        const dataConvertida = new Date(novaData);
        if (Number.isNaN(dataConvertida.getTime())) {
            return false;
        }
        this.dataHora = novaData;
        return true;
    }

    confirmarRealizacao() {
        this.realizada = true;
    }

    toJSON() {
        return {
            id: this.id,
            solicitacaoId: this.solicitacaoId,
            dataHora: this.dataHora,
            observacoes: this.observacoes,
            realizada: this.realizada
        };
    }
}

module.exports = VisitaPresencial;

