const FichaMedica = require('./FichaMedica');

const STATUS_VALIDOS = ['DISPONIVEL', 'EM_ANALISE', 'ADOTADO', 'EM_LAR_TEMPORARIO'];
const PORTES_VALIDOS = ['PEQUENO', 'MEDIO', 'GRANDE'];

class Animal {
    constructor({
        id,
        nome,
        idadeMeses,
        porte,
        sexo,
        status = 'DISPONIVEL',
        especie,
        fotoUrl = '',
        descricao = '',
        modalidade = 'ADOCAO_DEFINITIVA',
        fichaMedica = {}
    }) {
        if (new.target === Animal) {
            throw new Error('A classe Animal é abstrata e não pode ser instanciada diretamente.');
        }

        if (!nome || String(nome).trim() === '') {
            throw new Error('O nome do animal é obrigatório.');
        }

        if (idadeMeses === undefined || idadeMeses === null || Number(idadeMeses) < 0) {
            throw new Error('A idade em meses do animal é obrigatória e deve ser um valor válido.');
        }

        const porteNormalizado = porte ? String(porte).toUpperCase().trim() : 'MEDIO';
        if (!PORTES_VALIDOS.includes(porteNormalizado)) {
            throw new Error(`Porte inválido. Valores aceitos: ${PORTES_VALIDOS.join(', ')}.`);
        }

        this.id = id ? Number(id) : Date.now();
        this.nome = String(nome).trim();
        this.idadeMeses = Number(idadeMeses);
        this.porte = porteNormalizado;
        this.sexo = sexo ? String(sexo).toUpperCase().trim() : 'M';
        this.status = STATUS_VALIDOS.includes(status) ? status : 'DISPONIVEL';
        this.especie = especie;
        this.fotoUrl = fotoUrl;
        this.descricao = descricao;
        this.modalidade = modalidade;

        // Composição 1:1 — FichaMedica não existe sem o Animal
        this.fichaMedica = fichaMedica instanceof FichaMedica
            ? fichaMedica
            : new FichaMedica({
                id: fichaMedica?.id || this.id,
                ...fichaMedica
            });
    }

    verificarDisponibilidade() {
        return this.status === 'DISPONIVEL';
    }

    alterarStatus(novoStatus) {
        const statusNormalizado = String(novoStatus).toUpperCase().trim();
        if (!STATUS_VALIDOS.includes(statusNormalizado)) {
            throw new Error(`Status inválido: ${novoStatus}. Valores permitidos: ${STATUS_VALIDOS.join(', ')}.`);
        }
        this.status = statusNormalizado;
    }

    obterResumoClinico() {
        const castradoStr = this.fichaMedica.castrado ? 'Castrado' : 'Não castrado';
        const vermifugadoStr = this.fichaMedica.vermifugado ? 'Vermifugado' : 'Não vermifugado';
        const totalVacinas = this.fichaMedica.vacinas.length;
        return `${this.nome} (${this.especie}, ${this.idadeMeses} meses) — ${castradoStr}, ${vermifugadoStr}, ${totalVacinas} vacina(s) registrada(s).`;
    }

    toJSON() {
        return {
            id: this.id,
            nome: this.nome,
            especie: this.especie,
            idadeMeses: this.idadeMeses,
            porte: this.porte,
            sexo: this.sexo,
            status: this.status,
            modalidade: this.modalidade,
            fotoUrl: this.fotoUrl,
            descricao: this.descricao,
            fichaMedica: this.fichaMedica.toJSON()
        };
    }
}

Animal.STATUS_VALIDOS = STATUS_VALIDOS;
Animal.PORTES_VALIDOS = PORTES_VALIDOS;

module.exports = Animal;

