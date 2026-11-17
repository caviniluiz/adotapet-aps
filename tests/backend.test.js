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
        // Faz backup dos arquivos JSON antes dos testes e garante filas limpas
        Object.entries(ARQUIVOS_DADOS).forEach(([chave, caminho]) => {
            backup[chave] = fs.existsSync(caminho) ? fs.readFileSync(caminho, 'utf-8') : '[]';
        });

        fs.writeFileSync(ARQUIVOS_DADOS.solicitacoes, '[]\n', 'utf-8');
        fs.writeFileSync(ARQUIVOS_DADOS.visitas, '[]\n', 'utf-8');

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

    it('8. LAR_TEMPORARIO: Aprovação de lar temporário deve alterar status do animal para EM_LAR_TEMPORARIO', async () => {
        const resCriacao = await fetch(`${baseUrl}/api/solicitacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adotanteId: 1,
                animalId: 5, // Bidu (Cachorro)
                modalidade: 'LAR_TEMPORARIO'
            })
        });
        const dadosCriacao = await resCriacao.json();
        assert.equal(resCriacao.status, 201);

        const resAprov = await fetch(`${baseUrl}/api/solicitacoes/${dadosCriacao.solicitacao.id}/avaliar`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-perfil': 'GESTOR_ONG'
            },
            body: JSON.stringify({ acao: 'APROVAR' })
        });
        const dadosAprov = await resAprov.json();

        assert.equal(resAprov.status, 200);
        assert.equal(dadosAprov.solicitacao.status, 'APROVADA');
        assert.equal(dadosAprov.solicitacao.animal.status, 'EM_LAR_TEMPORARIO');
    });

    it('9. RECUSAR (UC04 FA01): Deve exigir justificativa e devolver animal para DISPONIVEL após recusa', async () => {
        const resCriacao = await fetch(`${baseUrl}/api/solicitacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adotanteId: 1,
                animalId: 1, // Thor
                modalidade: 'ADOCAO_DEFINITIVA'
            })
        });
        const dadosCriacao = await resCriacao.json();
        assert.equal(resCriacao.status, 201);
        const solId = dadosCriacao.solicitacao.id;

        // Tentativa sem justificativa deve falhar com HTTP 400
        const resSemJust = await fetch(`${baseUrl}/api/solicitacoes/${solId}/avaliar`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-perfil': 'GESTOR_ONG'
            },
            body: JSON.stringify({ acao: 'RECUSAR', justificativa: '' })
        });
        assert.equal(resSemJust.status, 400);

        // Recusa válida com justificativa
        const resRecusa = await fetch(`${baseUrl}/api/solicitacoes/${solId}/avaliar`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-perfil': 'GESTOR_ONG'
            },
            body: JSON.stringify({ acao: 'RECUSAR', justificativa: 'Quintal sem portão adequado.' })
        });
        const dadosRecusa = await resRecusa.json();

        assert.equal(resRecusa.status, 200);
        assert.equal(dadosRecusa.solicitacao.status, 'RECUSADA');
        assert.equal(dadosRecusa.solicitacao.justificativaAvaliacao, 'Quintal sem portão adequado.');
        assert.equal(dadosRecusa.solicitacao.animal.status, 'DISPONIVEL');
    });

    it('10. Visitas Presenciais (UC06 / RF08): Deve agendar em solicitação PENDENTE, bloquear em solicitação encerrada e confirmar realização', async () => {
        // Cria nova solicitação PENDENTE para Thor (que voltou a DISPONIVEL)
        const resSol = await fetch(`${baseUrl}/api/solicitacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adotanteId: 1,
                animalId: 1,
                modalidade: 'ADOCAO_DEFINITIVA'
            })
        });
        const dadosSol = await resSol.json();
        assert.equal(resSol.status, 201);
        const solPendenteId = dadosSol.solicitacao.id;

        // Agendamento pela rota aninhada
        const resVisita = await fetch(`${baseUrl}/api/solicitacoes/${solPendenteId}/visita`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-perfil': 'GESTOR_ONG'
            },
            body: JSON.stringify({ dataHora: '2026-11-25T15:00', observacoes: 'Trazer documento' })
        });
        const dadosVisita = await resVisita.json();
        assert.equal(resVisita.status, 201);
        assert.equal(dadosVisita.visita.realizada, false);

        // Confirmação da visita
        const resConfirmar = await fetch(`${baseUrl}/api/visitas/${dadosVisita.visita.id}/confirmar`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-perfil': 'GESTOR_ONG'
            },
            body: JSON.stringify({})
        });
        const dadosConfirmar = await resConfirmar.json();
        assert.equal(resConfirmar.status, 200);
        assert.equal(dadosConfirmar.visita.realizada, true);

        // POST /api/visitas deve bloquear solicitação #1 que já foi APROVADA (HTTP 409)
        const resBloqEncerrada = await fetch(`${baseUrl}/api/visitas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-perfil': 'GESTOR_ONG'
            },
            body: JSON.stringify({ solicitacaoId: 1, dataHora: '2026-11-26T10:00' })
        });
        assert.equal(resBloqEncerrada.status, 409);
    });

    it('11. UC07 e P1 (Conversão Booleana Segura): Deve cadastrar novo animal e impedir burla da RN02 via string "false"', async () => {
        const resCad = await fetch(`${baseUrl}/api/animais`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-perfil': 'GESTOR_ONG'
            },
            body: JSON.stringify({
                nome: 'Mel',
                especie: 'Gato',
                idadeMeses: 7,
                porte: 'PEQUENO',
                sexo: 'F',
                modalidade: 'ADOCAO_DEFINITIVA',
                testadoFivFelv: 'true',
                negativoFivFelv: 'true',
                adaptadoApartamento: 'true',
                fichaMedica: {
                    castrado: 'true',
                    vermifugado: 'true',
                    observacoesClinicas: 'Saudável',
                    vacinas: [{ nomeVacina: 'V4', lote: 'L-01', dataAplicacao: '2026-11-01' }]
                }
            })
        });
        const dadosCad = await resCad.json();
        assert.equal(resCad.status, 201);
        assert.equal(dadosCad.animal.nome, 'Mel');
        assert.equal(dadosCad.animal.fichaMedica.castrado, true);

        // Tentativa enviando possuiTelasProtecao como string "false" deve continuar bloqueada na RN02
        const resStringFalse = await fetch(`${baseUrl}/api/solicitacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                animalId: dadosCad.animal.id,
                modalidade: 'ADOCAO_DEFINITIVA',
                adotante: {
                    nome: 'Teste String False',
                    cpf: '529.982.247-25',
                    idade: 26,
                    telefone: '(11) 99999-1111',
                    tipoMoradia: 'APARTAMENTO',
                    possuiTelasProtecao: 'false'
                }
            })
        });
        const dadosStringFalse = await resStringFalse.json();
        assert.equal(resStringFalse.status, 422);
        assert.equal(dadosStringFalse.regraViolada, 'RN02');
    });

    it('12. Perfis, Adotantes (Validação/Formatação de CPF e Telefone), Privacidade e 404 JSON em /api/*', async () => {
        // Perfis
        const resPerfis = await fetch(`${baseUrl}/api/auth/perfis`);
        const dadosPerfis = await resPerfis.json();
        assert.equal(resPerfis.status, 200);
        assert.equal(dadosPerfis.perfis.length, 2);

        // Cadastro de adotante com CPF curto ou dígitos repetidos (ex.: 44444444444444) deve falhar com 400
        const resCpfInvalido = await fetch(`${baseUrl}/api/adotantes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: 'CPF Ruim', cpf: '123', idade: 25, telefone: '11999999999' })
        });
        assert.equal(resCpfInvalido.status, 400);

        const resCpfRepetido = await fetch(`${baseUrl}/api/adotantes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: 'CPF Repetido', cpf: '44444444444444', idade: 25, telefone: '16988472042' })
        });
        assert.equal(resCpfRepetido.status, 400);

        // Cadastro enviando CPF e telefone apenas com números deve formatar automaticamente
        const resAdotante = await fetch(`${baseUrl}/api/adotantes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: 'Fernanda Costa',
                cpf: '52998224725',
                idade: 31,
                telefone: '16988472042',
                tipoMoradia: 'CASA',
                possuiTelasProtecao: 'false'
            })
        });
        const dadosAdotante = await resAdotante.json();
        assert.equal(resAdotante.status, 201);
        assert.equal(dadosAdotante.adotante.cpf, '529.982.247-25');
        assert.equal(dadosAdotante.adotante.telefone, '(16) 98847-2042');
        assert.equal(dadosAdotante.adotante.possuiTelasProtecao, false);

        // Atualização de perfil residencial com CPF válido
        const resPatchPerfil = await fetch(`${baseUrl}/api/adotantes/${dadosAdotante.adotante.id}/perfil-residencial`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipoMoradia: 'APARTAMENTO', possuiTelasProtecao: true })
        });
        const dadosPatchPerfil = await resPatchPerfil.json();
        assert.equal(resPatchPerfil.status, 200);
        assert.equal(dadosPatchPerfil.adotante.possuiTelasProtecao, true);

        // Privacidade em GET /api/solicitacoes
        const resSolPublico = await fetch(`${baseUrl}/api/solicitacoes`);
        assert.deepEqual(await resSolPublico.json(), []);

        const resSolAdotante = await fetch(`${baseUrl}/api/solicitacoes?adotanteId=1`);
        const listaAdotante1 = await resSolAdotante.json();
        assert.ok(listaAdotante1.length > 0);
        assert.ok(listaAdotante1.every(s => s.adotanteId === 1));

        const resSolGestor = await fetch(`${baseUrl}/api/solicitacoes`, {
            headers: { 'x-perfil': 'GESTOR_ONG' }
        });
        assert.ok((await resSolGestor.json()).length > 0);

        // 404 JSON para rota /api/* inexistente
        const res404 = await fetch(`${baseUrl}/api/rota-que-nao-existe`);
        const dados404 = await res404.json();
        assert.equal(res404.status, 404);
        assert.equal(dados404.erro, true);
    });

    it('13. Autenticação (POST /api/auth/registro e /api/auth/login): Registro exclusivo de Adotante e Login de Adotante/Gestor', async () => {
        // Registro de novo adotante enviando CPF e telefone sem pontuação
        const resRegistro = await fetch(`${baseUrl}/api/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: 'Juliana Alves',
                email: 'juliana@email.com',
                senha: 'segredo123',
                cpf: '39053344705',
                idade: 27,
                telefone: '16991234567',
                tipoMoradia: 'APARTAMENTO',
                possuiTelasProtecao: true
            })
        });
        const dadosReg = await resRegistro.json();
        assert.equal(resRegistro.status, 201);
        assert.equal(dadosReg.perfil, 'ADOTANTE');
        assert.equal(dadosReg.usuario.perfil, 'ADOTANTE');
        assert.equal(dadosReg.usuario.cpf, '390.533.447-05');
        assert.equal(dadosReg.usuario.telefone, '(16) 99123-4567');
        assert.equal(dadosReg.usuario.senha, undefined);

        // Tentativa de registro duplicado (e-mail ou CPF) deve retornar 409
        const resDup = await fetch(`${baseUrl}/api/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: 'Juliana Clone',
                email: 'juliana@email.com',
                senha: 'outra123',
                cpf: '390.533.447-05',
                idade: 28,
                telefone: '16991234567',
                tipoMoradia: 'CASA',
                possuiTelasProtecao: false
            })
        });
        assert.equal(resDup.status, 409);

        // Login do Adotante por e-mail e por CPF
        const resLoginEmail = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identificador: 'juliana@email.com', senha: 'segredo123' })
        });
        const dadosLoginEmail = await resLoginEmail.json();
        assert.equal(resLoginEmail.status, 200);
        assert.equal(dadosLoginEmail.perfil, 'ADOTANTE');
        assert.equal(dadosLoginEmail.usuario.senha, undefined);

        const resLoginCpf = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identificador: '39053344705', senha: 'segredo123' })
        });
        assert.equal(resLoginCpf.status, 200);

        // Login com senha incorreta deve falhar com 401
        const resSenhaErrada = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identificador: 'juliana@email.com', senha: 'errada' })
        });
        assert.equal(resSenhaErrada.status, 401);

        // Login do Gestor da ONG
        const resLoginGestor = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identificador: 'admin@adotapet.org', senha: 'admin123' })
        });
        const dadosGestor = await resLoginGestor.json();
        assert.equal(resLoginGestor.status, 200);
        assert.equal(dadosGestor.perfil, 'GESTOR_ONG');
        assert.equal(dadosGestor.usuario.perfil, 'GESTOR_ONG');
    });
});

