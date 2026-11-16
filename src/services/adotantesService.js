const repo = require('../repositories/jsonRepository');
const {
    parseBooleano,
    validarFormatoCPF,
    formatarCPF,
    validarFormatoTelefone,
    formatarTelefone
} = require('../config/constants');

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

        if (cpf && !validarFormatoCPF(cpf)) {
            const erro = new Error('CPF inválido. Informe um CPF válido com 11 dígitos.');
            erro.statusHttp = 400;
            throw erro;
        }

        if (telefone && !validarFormatoTelefone(telefone)) {
            const erro = new Error('Telefone inválido. Informe DDD + número (10 ou 11 dígitos).');
            erro.statusHttp = 400;
            throw erro;
        }

        const adotanteSalvo = repo.salvarOuAtualizarAdotante({
            id,
            nome,
            cpf: cpf ? formatarCPF(cpf) : '',
            idade: Number(idade),
            telefone: telefone ? formatarTelefone(telefone) : '',
            tipoMoradia,
            possuiTelasProtecao: parseBooleano(possuiTelasProtecao, false)
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

        if (telefone !== undefined) {
            if (telefone && !validarFormatoTelefone(telefone)) {
                const erro = new Error('Telefone inválido. Informe DDD + número (10 ou 11 dígitos).');
                erro.statusHttp = 400;
                throw erro;
            }
            adotante.telefone = telefone ? formatarTelefone(telefone) : '';
        }

        adotante.atualizarPerfilResidencial(
            tipoMoradia || adotante.tipoMoradia,
            possuiTelasProtecao !== undefined ? possuiTelasProtecao : adotante.possuiTelasProtecao
        );

        if (idade !== undefined) adotante.idade = Number(idade);
        if (nome !== undefined && String(nome).trim() !== '') adotante.nome = String(nome).trim();

        const salvo = repo.salvarOuAtualizarAdotante(adotante.toJSON());
        return salvo.toJSON();
    }
};

module.exports = adotantesService;
