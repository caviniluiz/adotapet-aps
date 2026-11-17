const express = require('express');
const cors = require('cors');
const path = require('path');

const repo = require('./src/repositories/jsonRepository');
const adotantesService = require('./src/services/adotantesService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        servico: 'AdotaPet Backend API',
        versao: '1.0.0',
        uptimeSegundos: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        conexao: 'ok'
    });
});

/**
 * GET /api/auth/perfis
 * Retorna os perfis de demonstração disponíveis para alternância rápida na SPA
 */
app.get('/api/auth/perfis', (req, res) => {
    const adotantes = repo.listarAdotantes().map(a => a.toPublicJSON());
    res.json({
        perfis: [
            {
                tipo: 'ADOTANTE',
                rotulo: 'Adotante (Catálogo e Solicitações)',
                adotantesDisponiveis: adotantes
            },
            {
                tipo: 'GESTOR_ONG',
                rotulo: 'Gestor da ONG (Painel Administrativo)',
                ong: {
                    id: 1,
                    nome: 'ONG AdotaPet Proteção Animal',
                    cnpj: '12.345.678/0001-90'
                }
            }
        ]
    });
});

/**
 * POST /api/auth/login
 * Autentica Adotante (e-mail/CPF + senha) ou Gestor da ONG
 */
app.post('/api/auth/login', (req, res) => {
    try {
        const sessao = adotantesService.autenticarUsuario(req.body);
        res.json({
            mensagem: `Bem-vindo(a), ${sessao.usuario.nome}!`,
            ...sessao
        });
    } catch (erro) {
        res.status(erro.statusHttp || 401).json({
            erro: true,
            mensagem: erro.message
        });
    }
});

/**
 * POST /api/auth/registro
 * Registra nova conta exclusiva para Adotante (nunca cria Gestor da ONG)
 */
app.post('/api/auth/registro', (req, res) => {
    try {
        const sessao = adotantesService.registrarAdotante(req.body);
        res.status(201).json({
            mensagem: 'Cadastro realizado com sucesso! Você já está conectado como Adotante.',
            ...sessao
        });
    } catch (erro) {
        res.status(erro.statusHttp || 400).json({
            erro: true,
            mensagem: erro.message
        });
    }
});

app.use('/api/animais', require('./src/routes/animaisRoutes'));
app.use('/api/solicitacoes', require('./src/routes/solicitacoesRoutes'));
app.use('/api/adotantes', require('./src/routes/adotantesRoutes'));
app.use('/api/visitas', require('./src/routes/visitasRoutes'));

app.use('/api', (req, res) => {
    res.status(404).json({
        erro: true,
        mensagem: `Rota da API não encontrada: ${req.method} ${req.originalUrl}`
    });
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log('----------------------------------------------------');
        console.log(`🐾 AdotaPet — Servidor iniciado com sucesso!`);
        console.log(`🌐 Aplicação:  http://localhost:${PORT}`);
        console.log(`💚 API Health: http://localhost:${PORT}/api/health`);
        console.log('----------------------------------------------------');
    });
}

module.exports = app;
