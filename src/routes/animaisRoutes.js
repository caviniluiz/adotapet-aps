const express = require('express');
const router = express.Router();

const animaisService = require('../services/animaisService');
const { exigirGestorONG } = require('../config/authMiddleware');

/**
 * GET /api/animais
 * Lista animais com suporte a filtros via query params (RF04 / UC01)
 */
router.get('/', (req, res) => {
    try {
        const animais = animaisService.listarAnimais(req.query);
        res.json(animais);
    } catch (erro) {
        res.status(erro.statusHttp || 500).json({ erro: true, mensagem: erro.message });
    }
});

/**
 * GET /api/animais/:id
 * Obtém detalhes completos de um animal e sua ficha médica
 */
router.get('/:id', (req, res) => {
    try {
        const animal = animaisService.buscarPorId(req.params.id);
        res.json(animal);
    } catch (erro) {
        res.status(erro.statusHttp || 500).json({ erro: true, mensagem: erro.message });
    }
});

/**
 * POST /api/animais
 * Cadastra um novo animal com sua ficha médica (UC07 / RF02 / RF03 / RNF03)
 */
router.post('/', exigirGestorONG, (req, res) => {
    try {
        const salvo = animaisService.cadastrarAnimal(req.body);
        res.status(201).json({
            mensagem: 'Animal e ficha médica cadastrados com sucesso!',
            animal: salvo
        });
    } catch (erro) {
        res.status(erro.statusHttp || 400).json({ erro: true, mensagem: erro.message });
    }
});

/**
 * PATCH /api/animais/:id/ficha-medica
 * Atualiza ficha médica do animal: castração, vermifugação, observações e vacina (RF03 / RNF03)
 */
router.patch('/:id/ficha-medica', exigirGestorONG, (req, res) => {
    try {
        const atualizado = animaisService.atualizarFichaMedica(req.params.id, req.body);
        res.json({
            mensagem: 'Ficha médica atualizada com sucesso!',
            animal: atualizado
        });
    } catch (erro) {
        res.status(erro.statusHttp || 400).json({ erro: true, mensagem: erro.message });
    }
});

module.exports = router;
