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

function parseBooleano(valor, padrao = false) {
    if (valor === undefined || valor === null || valor === '') return padrao;
    if (typeof valor === 'boolean') return valor;
    if (typeof valor === 'number') return valor !== 0;
    const str = String(valor).trim().toLowerCase();
    if (['true', '1', 'sim', 'yes', 'on'].includes(str)) return true;
    if (['false', '0', 'nao', 'não', 'no', 'off'].includes(str)) return false;
    return padrao;
}

function validarFormatoCPF(cpf) {
    if (!cpf) return true;
    const digitos = String(cpf).replace(/\D/g, '');
    if (digitos.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digitos)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += Number(digitos[i]) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== Number(digitos[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += Number(digitos[i]) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    return resto === Number(digitos[10]);
}

function formatarCPF(cpf) {
    const d = String(cpf || '').replace(/\D/g, '').slice(0, 11);
    if (d.length !== 11) return String(cpf || '').trim();
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

function validarFormatoTelefone(telefone) {
    if (!telefone) return true;
    const digitos = String(telefone).replace(/\D/g, '');
    if (digitos.length < 10 || digitos.length > 11) return false;
    if (/^(\d)\1+$/.test(digitos)) return false;
    return true;
}

function formatarTelefone(telefone) {
    const d = String(telefone || '').replace(/\D/g, '').slice(0, 11);
    if (d.length === 11) {
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
    }
    if (d.length === 10) {
        return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6, 10)}`;
    }
    return String(telefone || '').trim();
}

module.exports = {
    DATA_DIR,
    ARQUIVOS_DADOS,
    PERFIS,
    parseBooleano,
    validarFormatoCPF,
    formatarCPF,
    validarFormatoTelefone,
    formatarTelefone
};
