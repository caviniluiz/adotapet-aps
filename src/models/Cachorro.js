const Animal = require('./Animal');

class Cachorro extends Animal {
    constructor({
        nivelEnergia = 'MEDIO',
        sociavelComCaes = true,
        ...dadosAnimal
    }) {
        super({ ...dadosAnimal, especie: 'Cachorro' });
        this.nivelEnergia = String(nivelEnergia).toUpperCase().trim();
        this.sociavelComCaes = Boolean(sociavelComCaes);
    }

    exigePasseioDiario() {
        return this.nivelEnergia === 'ALTO' || this.porte === 'GRANDE';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            nivelEnergia: this.nivelEnergia,
            sociavelComCaes: this.sociavelComCaes
        };
    }
}

module.exports = Cachorro;

