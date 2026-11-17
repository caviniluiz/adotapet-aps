const repo = require('../repositories/jsonRepository');
const {
    GESTOR_PADRAO,
    parseBooleano,
    validarFormatoCPF,
    formatarCPF,
    validarFormatoTelefone,
    formatarTelefone
} = require('../config/constants');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const adotantesService = {
    listarAdotantes() {
        return repo.listarAdotantes().map(a => a.toPublicJSON());
    },

    buscarPorId(id) {
        const adotante = repo.buscarAdotantePorId(id);
        if (!adotante) {
            const erro = new Error('Adotante não encontrado.');
            erro.statusHttp = 404;
            throw erro;
        }
        return adotante.toPublicJSON();
    },

    cadastrarOuAtualizar(dados) {
        const { id, nome, email, senha, cpf, idade, telefone, tipoMoradia, possuiTelasProtecao } = dados;

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
            email,
            senha,
            cpf: cpf ? formatarCPF(cpf) : '',
            idade: Number(idade),
            telefone: telefone ? formatarTelefone(telefone) : '',
            tipoMoradia,
            possuiTelasProtecao: parseBooleano(possuiTelasProtecao, false)
        });

        return adotanteSalvo.toPublicJSON();
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
        if (telefone !== undefined && !adotante.telefone) adotante.telefone = '';
        if (nome !== undefined && String(nome).trim() !== '') adotante.nome = String(nome).trim();

        const salvo = repo.salvarOuAtualizarAdotante(adotante.toJSON());
        return salvo.toPublicJSON();
    },

    registrarAdotante(dados) {
        const {
            nome,
            email,
            senha,
            cpf,
            idade,
            telefone,
            tipoMoradia,
            possuiTelasProtecao
        } = dados || {};

        if (
            !nome ||
            !email ||
            !senha ||
            !cpf ||
            idade === undefined ||
            idade === '' ||
            !telefone ||
            !tipoMoradia ||
            possuiTelasProtecao === undefined ||
            possuiTelasProtecao === ''
        ) {
            const erro = new Error('Preencha todos os campos obrigatórios para concluir seu cadastro.');
            erro.statusHttp = 400;
            throw erro;
        }

        const emailNormalizado = String(email).trim().toLowerCase();
        if (!EMAIL_REGEX.test(emailNormalizado)) {
            const erro = new Error('Informe um e-mail válido.');
            erro.statusHttp = 400;
            throw erro;
        }

        if (String(senha).length < 4) {
            const erro = new Error('A senha deve ter no mínimo 4 caracteres.');
            erro.statusHttp = 400;
            throw erro;
        }

        if (!validarFormatoCPF(cpf)) {
            const erro = new Error('CPF inválido. Verifique os dígitos informados.');
            erro.statusHttp = 400;
            throw erro;
        }

        if (!validarFormatoTelefone(telefone)) {
            const erro = new Error('Telefone inválido. Informe DDD + número (10 ou 11 dígitos).');
            erro.statusHttp = 400;
            throw erro;
        }

        const cpfFormatado = formatarCPF(cpf);
        const cpfDigitos = cpfFormatado.replace(/\D/g, '');
        const adotantes = repo.listarAdotantes();

        const emailEmUso =
            emailNormalizado === GESTOR_PADRAO.email.toLowerCase() ||
            adotantes.some(a => a.email && a.email.toLowerCase() === emailNormalizado);

        const cpfEmUso = adotantes.some(a => a.cpf && a.cpf.replace(/\D/g, '') === cpfDigitos);

        if (emailEmUso || cpfEmUso) {
            const erro = new Error('Já existe um cadastro com este e-mail ou CPF.');
            erro.statusHttp = 409;
            throw erro;
        }

        const novo = repo.salvarOuAtualizarAdotante({
            nome: String(nome).trim(),
            email: emailNormalizado,
            senha: String(senha),
            cpf: cpfFormatado,
            idade: Number(idade),
            telefone: formatarTelefone(telefone),
            tipoMoradia,
            possuiTelasProtecao: parseBooleano(possuiTelasProtecao, false)
        });

        return {
            perfil: 'ADOTANTE',
            usuario: {
                ...novo.toPublicJSON(),
                perfil: 'ADOTANTE'
            }
        };
    },

    autenticarUsuario({ identificador, senha } = {}) {
        if (!identificador || !senha) {
            const erro = new Error('Informe e-mail (ou CPF) e senha para entrar.');
            erro.statusHttp = 400;
            throw erro;
        }

        const idLimpo = String(identificador).trim();
        const idLower = idLimpo.toLowerCase();
        const idDigitos = idLimpo.replace(/\D/g, '');

        if (idLower === GESTOR_PADRAO.email.toLowerCase() && String(senha) === GESTOR_PADRAO.senha) {
            return {
                perfil: 'GESTOR_ONG',
                usuario: {
                    id: GESTOR_PADRAO.id,
                    nome: GESTOR_PADRAO.nome,
                    email: GESTOR_PADRAO.email,
                    perfil: 'GESTOR_ONG'
                }
            };
        }

        const adotantes = repo.listarAdotantes();
        const adotante = adotantes.find(a => {
            if (a.email && a.email.toLowerCase() === idLower) return true;
            if (idDigitos.length === 11 && a.cpf && a.cpf.replace(/\D/g, '') === idDigitos) return true;
            return false;
        });

        if (!adotante || String(adotante.senha) !== String(senha)) {
            const erro = new Error('E-mail/CPF ou senha inválidos.');
            erro.statusHttp = 401;
            throw erro;
        }

        return {
            perfil: 'ADOTANTE',
            usuario: {
                ...adotante.toPublicJSON(),
                perfil: 'ADOTANTE'
            }
        };
    }
};

module.exports = adotantesService;
