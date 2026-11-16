const Animal = require('./Animal');
const { parseBooleano } = require('../config/constants');

class Cachorro extends Animal {
    constructor({
        nivelEnergia = 'MEDIO',
        sociavelComCaes = true,
        ...dadosAnimal
    }) {
        super({ ...dadosAnimal, especie: 'Cachorro' });
        this.nivelEnergia = String(nivelEnergia).toUpperCase().trim();
        this.sociavelComCaes = parseBooleano(sociavelComCaes, true);
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

