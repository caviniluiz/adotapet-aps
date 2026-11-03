const fs = require('fs');
const { ARQUIVOS_DADOS } = require('../config/constants');

const Cachorro = require('../models/Cachorro');
const Gato = require('../models/Gato');
const Adotante = require('../models/Adotante');
const SolicitacaoAdocao = require('../models/SolicitacaoAdocao');
const VisitaPresencial = require('../models/VisitaPresencial');

function lerArquivoJson(caminhoArquivo, valorPadrao = []) {
    try {
        if (!fs.existsSync(caminhoArquivo)) {
            fs.writeFileSync(caminhoArquivo, JSON.stringify(valorPadrao, null, 2), 'utf-8');
            return valorPadrao;
        }
        const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8').trim();
        if (!conteudo) {
            return valorPadrao;
        }
        return JSON.parse(conteudo);
    } catch (erro) {
        console.error(`Erro ao ler arquivo JSON (${caminhoArquivo}):`, erro.message);
        return valorPadrao;
    }
}

function gravarArquivoJson(caminhoArquivo, dados) {
    const serializado = Array.isArray(dados)
        ? dados.map(item => (typeof item?.toJSON === 'function' ? item.toJSON() : item))
        : dados;
    fs.writeFileSync(caminhoArquivo, JSON.stringify(serializado, null, 2), 'utf-8');
}

function instanciarAnimal(dados) {
    if (!dados) return null;
    if (dados.especie === 'Gato') {
        return new Gato(dados);
    }
    return new Cachorro(dados);
}

const jsonRepository = {
    // Animais
    listarAnimais() {
        const brutos = lerArquivoJson(ARQUIVOS_DADOS.animais, []);
        return brutos.map(instanciarAnimal);
    },

    buscarAnimalPorId(id) {
        const animais = this.listarAnimais();
        return animais.find(a => a.id === Number(id)) || null;
    },

    salvarAnimais(listaAnimais) {
        gravarArquivoJson(ARQUIVOS_DADOS.animais, listaAnimais);
    },

    adicionarAnimal(dadosOuInstancia) {
        const animais = this.listarAnimais();
        const novoId = animais.length > 0 ? Math.max(...animais.map(a => a.id)) + 1 : 1;
        const instancia = dadosOuInstancia instanceof Cachorro || dadosOuInstancia instanceof Gato
            ? dadosOuInstancia
            : instanciarAnimal({ ...dadosOuInstancia, id: novoId });
        instancia.id = dadosOuInstancia.id ? Number(dadosOuInstancia.id) : novoId;
        animais.push(instancia);
        this.salvarAnimais(animais);
        return instancia;
    },

    atualizarAnimal(animalAtualizado) {
        const animais = this.listarAnimais();
        const index = animais.findIndex(a => a.id === Number(animalAtualizado.id));
        if (index === -1) return null;
        const instancia = animalAtualizado instanceof Cachorro || animalAtualizado instanceof Gato
            ? animalAtualizado
            : instanciarAnimal(animalAtualizado);
        animais[index] = instancia;
        this.salvarAnimais(animais);
        return instancia;
    },

    // Adotantes
    listarAdotantes() {
        const brutos = lerArquivoJson(ARQUIVOS_DADOS.adotantes, []);
        return brutos.map(d => new Adotante(d));
    },

    buscarAdotantePorId(id) {
        const adotantes = this.listarAdotantes();
        return adotantes.find(a => a.id === Number(id)) || null;
    },

    salvarAdotantes(listaAdotantes) {
        gravarArquivoJson(ARQUIVOS_DADOS.adotantes, listaAdotantes);
    },

    salvarOuAtualizarAdotante(dadosAdotante) {
        const adotantes = this.listarAdotantes();
        let existenteIndex = -1;

        if (dadosAdotante.id) {
            existenteIndex = adotantes.findIndex(a => a.id === Number(dadosAdotante.id));
        } else if (dadosAdotante.cpf) {
            existenteIndex = adotantes.findIndex(a => a.cpf && a.cpf === String(dadosAdotante.cpf).trim());
        }

        if (existenteIndex !== -1) {
            const atualizado = new Adotante({
                ...adotantes[existenteIndex].toJSON(),
                ...dadosAdotante,
                id: adotantes[existenteIndex].id
            });
            adotantes[existenteIndex] = atualizado;
            this.salvarAdotantes(adotantes);
            return atualizado;
        }

        const novoId = adotantes.length > 0 ? Math.max(...adotantes.map(a => a.id)) + 1 : 1;
        const novoAdotante = new Adotante({ ...dadosAdotante, id: novoId });
        adotantes.push(novoAdotante);
        this.salvarAdotantes(adotantes);
        return novoAdotante;
    },

    // Solicitações de Adoção
    listarSolicitacoes() {
        const brutos = lerArquivoJson(ARQUIVOS_DADOS.solicitacoes, []);
        return brutos.map(s => new SolicitacaoAdocao(s));
    },

    buscarSolicitacaoPorId(id) {
        const solicitacoes = this.listarSolicitacoes();
        return solicitacoes.find(s => s.id === Number(id)) || null;
    },

    salvarSolicitacoes(listaSolicitacoes) {
        gravarArquivoJson(ARQUIVOS_DADOS.solicitacoes, listaSolicitacoes);
    },

    adicionarSolicitacao(dadosSolicitacao) {
        const solicitacoes = this.listarSolicitacoes();
        const novoId = solicitacoes.length > 0 ? Math.max(...solicitacoes.map(s => s.id)) + 1 : 1;
        const novaSolicitacao = dadosSolicitacao instanceof SolicitacaoAdocao
            ? dadosSolicitacao
            : new SolicitacaoAdocao({ ...dadosSolicitacao, id: novoId });
        novaSolicitacao.id = dadosSolicitacao.id ? Number(dadosSolicitacao.id) : novoId;
        solicitacoes.push(novaSolicitacao);
        this.salvarSolicitacoes(solicitacoes);
        return novaSolicitacao;
    },

    atualizarSolicitacao(solicitacaoAtualizada) {
        const solicitacoes = this.listarSolicitacoes();
        const index = solicitacoes.findIndex(s => s.id === Number(solicitacaoAtualizada.id));
        if (index === -1) return null;
        const instancia = solicitacaoAtualizada instanceof SolicitacaoAdocao
            ? solicitacaoAtualizada
            : new SolicitacaoAdocao(solicitacaoAtualizada);
        solicitacoes[index] = instancia;
        this.salvarSolicitacoes(solicitacoes);
        return instancia;
    },

    // Visitas Presenciais
    listarVisitas() {
        const brutos = lerArquivoJson(ARQUIVOS_DADOS.visitas, []);
        return brutos.map(v => new VisitaPresencial(v));
    },

    buscarVisitaPorSolicitacaoId(solicitacaoId) {
        const visitas = this.listarVisitas();
        return visitas.find(v => v.solicitacaoId === Number(solicitacaoId)) || null;
    },

    salvarVisitas(listaVisitas) {
        gravarArquivoJson(ARQUIVOS_DADOS.visitas, listaVisitas);
    },

    salvarOuAtualizarVisita(dadosVisita) {
        const visitas = this.listarVisitas();
        const existenteIndex = visitas.findIndex(
            v => v.solicitacaoId === Number(dadosVisita.solicitacaoId)
        );

        if (existenteIndex !== -1) {
            const atualizada = new VisitaPresencial({
                ...visitas[existenteIndex].toJSON(),
                ...dadosVisita,
                id: visitas[existenteIndex].id
            });
            visitas[existenteIndex] = atualizada;
            this.salvarVisitas(visitas);
            return atualizada;
        }

        const novoId = visitas.length > 0 ? Math.max(...visitas.map(v => v.id)) + 1 : 1;
        const novaVisita = new VisitaPresencial({ ...dadosVisita, id: novoId });
        visitas.push(novaVisita);
        this.salvarVisitas(visitas);
        return novaVisita;
    }
};

module.exports = jsonRepository;
