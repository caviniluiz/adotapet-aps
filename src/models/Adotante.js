class Adotante {
    constructor({
        id,
        nome,
        cpf = '',
        idade,
        telefone = '',
        tipoMoradia = 'CASA',
        possuiTelasProtecao = false
    }) {
        if (!nome || String(nome).trim() === '') {
            throw new Error('O nome do adotante é obrigatório.');
        }

        if (idade === undefined || idade === null || Number(idade) < 0) {
            throw new Error('A idade do adotante é obrigatória e deve ser um valor válido.');
        }

        this.id = id ? Number(id) : Date.now();
        this.nome = String(nome).trim();
        this.cpf = String(cpf).trim();
        this.idade = Number(idade);
        this.telefone = String(telefone).trim();
        this.tipoMoradia = String(tipoMoradia).toUpperCase().trim() || 'CASA';
        this.possuiTelasProtecao = Boolean(possuiTelasProtecao);
    }

    atualizarPerfilResidencial(moradia, telas) {
        if (moradia) {
            this.tipoMoradia = String(moradia).toUpperCase().trim();
        }
        this.possuiTelasProtecao = Boolean(telas);
    }

    /**
     * RN01 (Maioridade Civil):
     * Apenas candidatos com idade >= 18 anos podem registrar solicitações.
     */
    cumpreIdadeMinima() {
        return this.idade >= 18;
    }

    toJSON() {
        return {
            id: this.id,
            nome: this.nome,
            cpf: this.cpf,
            idade: this.idade,
            telefone: this.telefone,
            tipoMoradia: this.tipoMoradia,
            possuiTelasProtecao: this.possuiTelasProtecao
        };
    }
}

module.exports = Adotante;

