const RegistroVacina = require('./RegistroVacina');

class FichaMedica {
    constructor({ id, castrado = false, vermifugado = false, observacoesClinicas = '', vacinas = [] } = {}) {
        this.id = id ? Number(id) : Date.now();
        this.castrado = Boolean(castrado);
        this.vermifugado = Boolean(vermifugado);
        this.observacoesClinicas = observacoesClinicas ? String(observacoesClinicas).trim() : '';
        this.vacinas = Array.isArray(vacinas)
            ? vacinas.map(v => (v instanceof RegistroVacina ? v : new RegistroVacina(v)))
            : [];
    }

    registrarCastracao() {
        this.castrado = true;
    }

    adicionarVacina(vacina) {
        const registro = vacina instanceof RegistroVacina ? vacina : new RegistroVacina(vacina);
        if (!registro.validarRegistro()) {
            throw new Error('Dados inválidos para o registro de vacina (nome, data e lote são obrigatórios).');
        }
        this.vacinas.push(registro);
        return registro;
    }

    /**
     * RN04 (Obrigatoriedade de Castração):
     * Animais adultos (idade >= 6 meses) só podem ter a adoção definitiva aprovada
     * se constarem como castrados (castrado = true) em sua ficha médica.
     */
    estaAptoAdocaoDefinitiva(idadeMeses) {
        if (Number(idadeMeses) >= 6) {
            return this.castrado === true;
        }
        return true;
    }

    toJSON() {
        return {
            id: this.id,
            castrado: this.castrado,
            vermifugado: this.vermifugado,
            observacoesClinicas: this.observacoesClinicas,
            vacinas: this.vacinas.map(v => (typeof v.toJSON === 'function' ? v.toJSON() : v))
        };
    }
}

module.exports = FichaMedica;

