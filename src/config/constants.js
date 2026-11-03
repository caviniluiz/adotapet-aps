const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const ARQUIVOS_DADOS = {
    animais: path.join(DATA_DIR, 'animais.json'),
    adotantes: path.join(DATA_DIR, 'adotantes.json'),
    solicitacoes: path.join(DATA_DIR, 'solicitacoes.json'),
    visitas: path.join(DATA_DIR, 'visitas.json')
};

const PERFIS = {
    ADOTANTE: 'ADOTANTE',
    GESTOR_ONG: 'GESTOR_ONG'
};

module.exports = {
    DATA_DIR,
    ARQUIVOS_DADOS,
    PERFIS
};

