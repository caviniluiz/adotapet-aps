const express = require('express');
const router = express.Router();

const visitasService = require('../services/visitasService');
const { exigirGestorONG } = require('../config/authMiddleware');

/**
 * GET /api/visitas
 * Lista todas as visitas presenciais agendadas com detalhes da solicitação
 */
router.get('/', (req, res) => {
    try {
        res.json(visitasService.listarVisitas());
    } catch (erro) {
        res.status(erro.statusHttp || 500).json({ erro: true, mensagem: erro.message });
    }
});

/**
 * POST /api/visitas
 * Agenda uma visita presencial informando solicitacaoId e dataHora (UC06 / RF08 / RNF03)
 */
router.post('/', exigirGestorONG, (req, res) => {
    try {
        const visita = visitasService.agendarVisita(req.body);
        res.status(201).json({
            mensagem: 'Visita presencial agendada com sucesso!',
            visita
        });
    } catch (erro) {
        res.status(erro.statusHttp || 400).json({ erro: true, mensagem: erro.message });
    }
});

/**
 * PATCH /api/visitas/:id/confirmar
 * Confirma a realização de uma visita presencial agendada (RNF03)
 */
router.patch('/:id/confirmar', exigirGestorONG, (req, res) => {
    try {
        const visita = visitasService.confirmarRealizacao(req.params.id, req.body);
        res.json({
            mensagem: 'Realização da visita confirmada com sucesso!',
            visita
        });
    } catch (erro) {
        res.status(erro.statusHttp || 400).json({ erro: true, mensagem: erro.message });
    }
});

module.exports = router;
