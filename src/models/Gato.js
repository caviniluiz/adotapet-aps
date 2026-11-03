const Animal = require('./Animal');

class Gato extends Animal {
    constructor({
        testadoFivFelv = false,
        negativoFivFelv = false,
        adaptadoApartamento = true,
        ...dadosAnimal
    }) {
        super({ ...dadosAnimal, especie: 'Gato' });
        this.testadoFivFelv = Boolean(testadoFivFelv);
        this.negativoFivFelv = Boolean(negativoFivFelv);
        this.adaptadoApartamento = Boolean(adaptadoApartamento);
    }

    /**
     * RN02 (Critério de Segurança para Felinos):
     * Solicitações de adoção para animais da espécie Gato exigem obrigatoriamente
     * que o imóvel do adotante possua telas de proteção.
     */
    exigeRedeProtecao() {
        return true;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            testadoFivFelv: this.testadoFivFelv,
            negativoFivFelv: this.negativoFivFelv,
            adaptadoApartamento: this.adaptadoApartamento
        };
    }
}

module.exports = Gato;

