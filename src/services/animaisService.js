const repo = require('../repositories/jsonRepository');
const Cachorro = require('../models/Cachorro');
const Gato = require('../models/Gato');
const { parseBooleano } = require('../config/constants');

const animaisService = {
    listarAnimais({ especie, porte, sexo, modalidade, status, busca } = {}) {
        let animais = repo.listarAnimais();

        if (especie && especie !== 'TODOS') {
            animais = animais.filter(
                a => a.especie.toLowerCase() === String(especie).toLowerCase().trim()
            );
        }

        if (porte && porte !== 'TODOS') {
            animais = animais.filter(
                a => a.porte.toUpperCase() === String(porte).toUpperCase().trim()
            );
        }

        if (sexo && sexo !== 'TODOS') {
            animais = animais.filter(
                a => a.sexo.toUpperCase() === String(sexo).toUpperCase().trim()
            );
        }

        if (modalidade && modalidade !== 'TODOS') {
            animais = animais.filter(
                a => a.modalidade.toUpperCase() === String(modalidade).toUpperCase().trim()
            );
        }

        if (status && status !== 'TODOS') {
            animais = animais.filter(
                a => a.status.toUpperCase() === String(status).toUpperCase().trim()
            );
        }

        if (busca && String(busca).trim() !== '') {
            const termo = String(busca).toLowerCase().trim();
            animais = animais.filter(
                a =>
                    a.nome.toLowerCase().includes(termo) ||
                    (a.descricao && a.descricao.toLowerCase().includes(termo))
            );
        }

        return animais.map(a => a.toJSON());
    },

    buscarPorId(id) {
        const animal = repo.buscarAnimalPorId(id);
        if (!animal) {
            const erro = new Error('Animal não encontrado.');
            erro.statusHttp = 404;
            throw erro;
        }
        return {
            ...animal.toJSON(),
            resumoClinico: animal.obterResumoClinico()
        };
    },

    cadastrarAnimal(dados) {
        if (!dados.nome || dados.idadeMeses === undefined || dados.idadeMeses === '' || !dados.especie) {
            const erro = new Error('Campos obrigatórios pendentes: nome, idade em meses e espécie são indispensáveis.');
            erro.statusHttp = 400;
            throw erro;
        }

        const especieNormalizada = String(dados.especie).trim();
        let novoAnimal;

        if (especieNormalizada.toLowerCase() === 'gato') {
            novoAnimal = new Gato({ ...dados, status: 'DISPONIVEL' });
        } else if (especieNormalizada.toLowerCase() === 'cachorro') {
            novoAnimal = new Cachorro({ ...dados, status: 'DISPONIVEL' });
        } else {
            const erro = new Error('Espécie inválida. Informe "Cachorro" ou "Gato".');
            erro.statusHttp = 400;
            throw erro;
        }

        const salvo = repo.adicionarAnimal({
            ...novoAnimal.toJSON(),
            id: dados.id ? Number(dados.id) : undefined
        });
        return salvo.toJSON();
    },

    atualizarFichaMedica(id, { castrado, vermifugado, observacoesClinicas, novaVacina }) {
        const animal = repo.buscarAnimalPorId(id);
        if (!animal) {
            const erro = new Error('Animal não encontrado.');
            erro.statusHttp = 404;
            throw erro;
        }

        if (castrado !== undefined) {
            if (parseBooleano(castrado)) {
                animal.fichaMedica.registrarCastracao();
            } else {
                animal.fichaMedica.castrado = false;
            }
        }

        if (vermifugado !== undefined) {
            animal.fichaMedica.vermifugado = parseBooleano(vermifugado);
        }

        if (observacoesClinicas !== undefined) {
            animal.fichaMedica.observacoesClinicas = String(observacoesClinicas).trim();
        }

        if (novaVacina && novaVacina.nomeVacina) {
            animal.fichaMedica.adicionarVacina(novaVacina);
        }

        const atualizado = repo.atualizarAnimal(animal);
        return atualizado.toJSON();
    }
};

module.exports = animaisService;
