const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const app = require('../server');
const { ARQUIVOS_DADOS } = require('../src/config/constants');
const Animal = require('../src/models/Animal');
const Cachorro = require('../src/models/Cachorro');
const Gato = require('../src/models/Gato');
const AbrigoONG = require('../src/models/AbrigoONG');

describe('AdotaPet Backend — POO, Rotas REST e Regras de Negócio (RN01 a RN04)', () => {
    let server;
    let baseUrl;
    const backup = {};

    before(async () => {
        // Faz backup dos arquivos JSON antes dos testes
        Object.entries(ARQUIVOS_DADOS).forEach(([chave, caminho]) => {
            backup[chave] = fs.existsSync(caminho) ? fs.readFileSync(caminho, 'utf-8') : '[]';
        });

        await new Promise(resolve => {
            server = app.listen(0, () => {
                baseUrl = `http://localhost:${server.address().port}`;
                resolve();
            });
        });
    });

    after(async () => {
        // Restaura os arquivos JSON para o estado original (seed limpo)
        Object.entries(ARQUIVOS_DADOS).forEach(([chave, caminho]) => {
            fs.writeFileSync(caminho, backup[chave], 'utf-8');
        });

        await new Promise(resolve => server.close(resolve));
    });

    it('1. POO: Animal deve ser classe abstrata e Cachorro/Gato devem herdar corretamente', () => {
        assert.throws(() => new Animal({ nome: 'Teste', idadeMeses: 10, porte: 'MEDIO' }), /abstrata/i);

        const cao = new Cachorro({ nome: 'Rex', idadeMeses: 12, porte: 'GRANDE', nivelEnergia: 'ALTO' });
        const gato = new Gato({ nome: 'Mimi', idadeMeses: 8, porte: 'PEQUENO' });
        const ong = new AbrigoONG();

        ong.cadastrarAnimal(cao);
        ong.cadastrarAnimal(gato);

        assert.equal(cao.exigePasseioDiario(), true);
        assert.equal(gato.exigeRedeProtecao(), true);
        assert.equal(ong.listarAnimaisDisponiveis().length, 2);
    });

    it('2. GET /api/animais: Deve listar e filtrar animais em menos de 2 segundos (RF04 / RNF02)', async () => {
        const inicio = Date.now();
        const res = await fetch(`${baseUrl}/api/animais?especie=Gato`);
        const duracaoMs = Date.now() - inicio;
        const gatos = await res.json();

        assert.equal(res.status, 200);
        assert.ok(duracaoMs < 2000, `Tempo de resposta (${duracaoMs}ms) deve ser < 2000ms`);
        assert.equal(gatos.length, 3);
        assert.ok(gatos.every(g => g.especie === 'Gato'));
    });

    it('3. RN01 (Maioridade Civil): Deve bloquear solicitação de candidato menor de 18 anos (HTTP 422)', async () => {
        const res = await fetch(`${baseUrl}/api/solicitacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adotanteId: 3, // Lucas Mendes (16 anos)
                animalId: 1    // Thor (Cachorro)
            })
        });
        const dados = await res.json();

        assert.equal(res.status, 422);
        assert.equal(dados.regraViolada, 'RN01');
    });

    it('4. RN02 (Segurança para Felinos): Deve bloquear adoção de Gato para imóvel sem telas de proteção (HTTP 422)', async () => {
        const res = await fetch(`${baseUrl}/api/solicitacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adotanteId: 2, // Carlos (possuiTelasProtecao = false)
                animalId: 4    // Mingau (Gato)
            })
        });
        const dados = await res.json();

        assert.equal(res.status, 422);
        assert.equal(dados.regraViolada, 'RN02');
    });

    it('5. UC02 e RN03 (Exclusividade de Análise): Deve criar solicitação válida e bloquear nova solicitação concorrente (HTTP 409)', async () => {
        // Mariana (maior de idade e com telas) solicita o gato Mingau (id=4, 8 meses, não castrado)
        const resCriacao = await fetch(`${baseUrl}/api/solicitacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adotanteId: 1,
                animalId: 4,
                modalidade: 'ADOCAO_DEFINITIVA'
            })
        });
        const dadosCriacao = await resCriacao.json();

        assert.equal(resCriacao.status, 201);
        assert.equal(dadosCriacao.solicitacao.status, 'PENDENTE');
        assert.equal(dadosCriacao.solicitacao.animal.status, 'EM_ANALISE');

        // Nova tentativa para o mesmo animal que já está EM_ANALISE deve falhar na RN03
        const resDuplicada = await fetch(`${baseUrl}/api/solicitacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adotanteId: 1,
                animalId: 4,
                modalidade: 'ADOCAO_DEFINITIVA'
            })
        });
        const dadosDuplicada = await resDuplicada.json();

        assert.equal(resDuplicada.status, 409);
        assert.equal(dadosDuplicada.regraViolada, 'RN03');
    });

    it('6. RNF03 (Segurança): Deve bloquear acesso às rotas administrativas sem perfil GESTOR_ONG (HTTP 403)', async () => {
        const res = await fetch(`${baseUrl}/api/solicitacoes/1/avaliar`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-perfil': 'ADOTANTE'
            },
            body: JSON.stringify({ acao: 'APROVAR' })
        });
        const dados = await res.json();

        assert.equal(res.status, 403);
        assert.equal(dados.regraViolada, 'RNF03');
    });

    it('7. RN04 (Obrigatoriedade de Castração): Deve impedir aprovação definitiva de animal >= 6 meses não castrado e aprovar após castração', async () => {
        // Tentativa de aprovar Mingau (8 meses, castrado = false)
        const resBloqueio = await fetch(`${baseUrl}/api/solicitacoes/1/avaliar`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-perfil': 'GESTOR_ONG'
            },
            body: JSON.stringify({ acao: 'APROVAR' })
        });
        const dadosBloqueio = await resBloqueio.json();

        assert.equal(resBloqueio.status, 422);
        assert.equal(dadosBloqueio.regraViolada, 'RN04');

        // Gestor atualiza a ficha médica de Mingau registrando castração e vacina (RF03)
        const resFicha = await fetch(`${baseUrl}/api/animais/4/ficha-medica`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-perfil': 'GESTOR_ONG'
            },
            body: JSON.stringify({
                castrado: true,
                novaVacina: {
                    nomeVacina: 'Quádrupla Felina (V4)',
                    lote: 'LOTE-2026',
                    dataAplicacao: '2026-11-02'
                }
            })
        });
        assert.equal(resFicha.status, 200);

        // Agora a aprovação definitiva deve ter sucesso (UC04 <<include>> UC05)
        const resAprovacao = await fetch(`${baseUrl}/api/solicitacoes/1/avaliar`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-perfil': 'GESTOR_ONG'
            },
            body: JSON.stringify({ acao: 'APROVAR' })
        });
        const dadosAprovacao = await resAprovacao.json();

        assert.equal(resAprovacao.status, 200);
        assert.equal(dadosAprovacao.solicitacao.status, 'APROVADA');
        assert.equal(dadosAprovacao.solicitacao.animal.status, 'ADOTADO');
    });
});

