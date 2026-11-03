const express = require('express');
const router = express.Router();

const adotantesService = require('../services/adotantesService');

/**
 * GET /api/adotantes
 * Lista todos os adotantes cadastrados
 */
router.get('/', (req, res) => {
    try {
        res.json(adotantesService.listarAdotantes());
    } catch (erro) {
        res.status(erro.statusHttp || 500).json({ erro: true, mensagem: erro.message });
    }
});

/**
 * GET /api/adotantes/:id
 * Obtém os dados e o questionário residencial de um adotante
 */
router.get('/:id', (req, res) => {
    try {
        res.json(adotantesService.buscarPorId(req.params.id));
    } catch (erro) {
        res.status(erro.statusHttp || 500).json({ erro: true, mensagem: erro.message });
    }
});

/**
 * POST /api/adotantes
 * Cadastra um novo adotante ou atualiza seu perfil residencial (RF01 / RF05 / UC03)
 */
router.post('/', (req, res) => {
    try {
        const adotante = adotantesService.cadastrarOuAtualizar(req.body);
        res.status(201).json({
            mensagem: 'Perfil do adotante salvo com sucesso!',
            adotante
        });
    } catch (erro) {
        res.status(erro.statusHttp || 400).json({ erro: true, mensagem: erro.message });
    }
});

/**
 * PATCH /api/adotantes/:id/perfil-residencial
 * Atualiza exclusivamente o questionário de perfil residencial (RF05 / UC03)
 */
router.patch('/:id/perfil-residencial', (req, res) => {
    try {
        const adotante = adotantesService.atualizarPerfilResidencial(req.params.id, req.body);
        res.json({
            mensagem: 'Questionário de perfil residencial atualizado com sucesso!',
            adotante
        });
    } catch (erro) {
        res.status(erro.statusHttp || 400).json({ erro: true, mensagem: erro.message });
    }
});

module.exports = router;
