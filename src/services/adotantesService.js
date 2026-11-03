const repo = require('../repositories/jsonRepository');

const adotantesService = {
    listarAdotantes() {
        return repo.listarAdotantes().map(a => a.toJSON());
    },

    buscarPorId(id) {
        const adotante = repo.buscarAdotantePorId(id);
        if (!adotante) {
            const erro = new Error('Adotante não encontrado.');
            erro.statusHttp = 404;
            throw erro;
        }
        return adotante.toJSON();
    },

    cadastrarOuAtualizar(dados) {
        const { id, nome, cpf, idade, telefone, tipoMoradia, possuiTelasProtecao } = dados;

        if (!nome || idade === undefined || idade === '') {
            const erro = new Error('Nome e idade do adotante são obrigatórios.');
            erro.statusHttp = 400;
            throw erro;
        }

        const adotanteSalvo = repo.salvarOuAtualizarAdotante({
            id,
            nome,
            cpf,
            idade: Number(idade),
            telefone,
            tipoMoradia,
            possuiTelasProtecao: Boolean(possuiTelasProtecao)
        });

        return adotanteSalvo.toJSON();
    },

    atualizarPerfilResidencial(id, { tipoMoradia, possuiTelasProtecao, idade, telefone, nome }) {
        const adotante = repo.buscarAdotantePorId(id);
        if (!adotante) {
            const erro = new Error('Adotante não encontrado.');
            erro.statusHttp = 404;
            throw erro;
        }

        adotante.atualizarPerfilResidencial(
            tipoMoradia || adotante.tipoMoradia,
            possuiTelasProtecao !== undefined ? possuiTelasProtecao : adotante.possuiTelasProtecao
        );

        if (idade !== undefined) adotante.idade = Number(idade);
        if (telefone !== undefined) adotante.telefone = String(telefone).trim();
        if (nome !== undefined && String(nome).trim() !== '') adotante.nome = String(nome).trim();

        const salvo = repo.salvarOuAtualizarAdotante(adotante.toJSON());
        return salvo.toJSON();
    }
};

module.exports = adotantesService;

