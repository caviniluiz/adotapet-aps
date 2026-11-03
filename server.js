const express = require('express');
const cors = require('cors');
const path = require('path');

const repo = require('./src/repositories/jsonRepository');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
    res.json({
        mensagem: 'API do AdotaPet funcionando com sucesso!',
        versao: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        servico: 'AdotaPet Backend API',
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
    const adotantes = repo.listarAdotantes().map(a => a.toJSON());
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

app.use('/api/animais', require('./src/routes/animaisRoutes'));
app.use('/api/solicitacoes', require('./src/routes/solicitacoesRoutes'));
app.use('/api/adotantes', require('./src/routes/adotantesRoutes'));
app.use('/api/visitas', require('./src/routes/visitasRoutes'));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log('----------------------------------------------------');
        console.log(`🐾 AdotaPet — Servidor iniciado com sucesso!`);
        console.log(`🌐 Aplicação:  http://localhost:${PORT}`);
        console.log(`🩺 API Status: http://localhost:${PORT}/api/status`);
        console.log(`💚 API Health: http://localhost:${PORT}/api/health`);
        console.log('----------------------------------------------------');
    });
}

module.exports = app;
