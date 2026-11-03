const Animal = require('./Animal');

class AbrigoONG {
    constructor({ id = 1, nome = 'ONG AdotaPet Proteção Animal', cnpj = '12.345.678/0001-90', telefone = '(11) 99999-0000', animais = [] } = {}) {
        this.id = Number(id);
        this.nome = String(nome).trim();
        this.cnpj = String(cnpj).trim();
        this.telefone = String(telefone).trim();
        // Agregação 1:0..* com Animal
        this.animais = Array.isArray(animais) ? animais : [];
    }

    cadastrarAnimal(animal) {
        if (!(animal instanceof Animal)) {
            throw new Error('O objeto informado deve ser uma instância de Animal (Cachorro ou Gato).');
        }
        this.animais.push(animal);
    }

    listarAnimaisDisponiveis() {
        return this.animais.filter(animal => animal.verificarDisponibilidade());
    }

    toJSON() {
        return {
            id: this.id,
            nome: this.nome,
            cnpj: this.cnpj,
            telefone: this.telefone,
            animais: this.animais.map(a => (typeof a.toJSON === 'function' ? a.toJSON() : a))
        };
    }
}

module.exports = AbrigoONG;

