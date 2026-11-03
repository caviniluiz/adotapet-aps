class RegistroVacina {
    constructor({ id, nomeVacina, dataAplicacao, lote }) {
        this.id = id ? Number(id) : Date.now();
        this.nomeVacina = nomeVacina ? String(nomeVacina).trim() : '';
        this.dataAplicacao = dataAplicacao || new Date().toISOString().split('T')[0];
        this.lote = lote ? String(lote).trim() : '';
    }

    validarRegistro() {
        return Boolean(
            this.nomeVacina &&
            this.nomeVacina.length > 0 &&
            this.dataAplicacao &&
            this.lote &&
            this.lote.length > 0
        );
    }

    toJSON() {
        return {
            id: this.id,
            nomeVacina: this.nomeVacina,
            dataAplicacao: this.dataAplicacao,
            lote: this.lote
        };
    }
}

module.exports = RegistroVacina;

