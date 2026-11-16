const express = require('express');
const router = express.Router();

const repo = require('../repositories/jsonRepository');
const adocaoService = require('../services/adocaoService');
const { exigirGestorONG } = require('../config/authMiddleware');

/**
 * GET /api/solicitacoes
 * Lista solicitações (suporta filtro ?status=PENDENTE ou ?adotanteId=1)
 * Restrito ao GESTOR_ONG para listagem global; adotantes comuns devem informar ?adotanteId=
 */
router.get('/', (req, res) => {
    try {
        const { status, adotanteId, animalId } = req.query;
        const perfil = String(req.headers['x-perfil'] || req.query.perfil || '').toUpperCase().trim();

        if (perfil !== 'GESTOR_ONG' && !adotanteId) {
            return res.json([]);
        }

        let solicitacoes = repo.listarSolicitacoes();

        if (status && status !== 'TODOS') {
            solicitacoes = solicitacoes.filter(
                s => s.status.toUpperCase() === String(status).toUpperCase().trim()
            );
        }

        if (adotanteId) {
            solicitacoes = solicitacoes.filter(s => s.adotanteId === Number(adotanteId));
        }

        if (animalId) {
            solicitacoes = solicitacoes.filter(s => s.animalId === Number(animalId));
        }

        res.json(solicitacoes.map(s => adocaoService.enriquecerSolicitacao(s)));
    } catch (erro) {
        res.status(500).json({ erro: true, mensagem: erro.message });
    }
});

/**
 * GET /api/solicitacoes/:id
 * Obtém detalhes de uma solicitação específica
 */
router.get('/:id', (req, res) => {
    try {
        const solicitacao = repo.buscarSolicitacaoPorId(req.params.id);
        if (!solicitacao) {
            return res.status(404).json({ erro: true, mensagem: 'Solicitação não encontrada.' });
        }
        res.json(adocaoService.enriquecerSolicitacao(solicitacao));
    } catch (erro) {
        res.status(500).json({ erro: true, mensagem: erro.message });
    }
});

/**
 * POST /api/solicitacoes
 * Registra nova solicitação de adoção ou lar temporário (UC02 <<include>> UC03 / RF05 / RF06)
 */
router.post('/', (req, res) => {
    try {
        const {
            animalId,
            adotanteId,
            modalidade = 'ADOCAO_DEFINITIVA',
            adotante: dadosAdotanteBody,
            nome,
            cpf,
            idade,
            telefone,
            tipoMoradia,
            possuiTelasProtecao
        } = req.body;

        if (!animalId) {
            return res.status(400).json({ erro: true, mensagem: 'O ID do animal é obrigatório.' });
        }

        const dadosAdotante = dadosAdotanteBody || (
            (nome !== undefined || idade !== undefined || tipoMoradia !== undefined || possuiTelasProtecao !== undefined)
                ? { nome, cpf, idade, telefone, tipoMoradia, possuiTelasProtecao }
                : null
        );

        const solicitacao = adocaoService.registrarSolicitacao({
            animalId,
            adotanteId,
            modalidade,
            dadosAdotante
        });

        res.status(201).json({
            mensagem: 'Solicitação registrada com sucesso! O animal agora está em análise pela ONG.',
            solicitacao
        });
    } catch (erro) {
        const status = erro.statusHttp || 400;
        res.status(status).json({
            erro: true,
            regraViolada: erro.regraViolada || null,
            mensagem: erro.message
        });
    }
});

/**
 * PATCH /api/solicitacoes/:id/avaliar
 * Avalia uma solicitação de adoção: APROVAR ou RECUSAR (UC04 <<include>> UC05 / RF07 / RN04 / RNF03)
 */
router.patch('/:id/avaliar', exigirGestorONG, (req, res) => {
    try {
        const solicitacao = adocaoService.avaliarSolicitacao(req.params.id, req.body);
        res.json({
            mensagem:
                solicitacao.status === 'APROVADA'
                    ? 'Solicitação aprovada com sucesso!'
                    : 'Solicitação recusada e animal liberado novamente no catálogo.',
            solicitacao
        });
    } catch (erro) {
        const status = erro.statusHttp || 400;
        res.status(status).json({
            erro: true,
            regraViolada: erro.regraViolada || null,
            mensagem: erro.message
        });
    }
});

/**
 * POST /api/solicitacoes/:id/visita
 * Extensão <<extend>> UC06: Agendar Visita Presencial vinculada à solicitação em análise (RF08 / RNF03)
 */
router.post('/:id/visita', exigirGestorONG, (req, res) => {
    try {
        const resultado = adocaoService.agendarVisita(req.params.id, req.body);
        res.status(201).json({
            mensagem: 'Visita presencial agendada com sucesso!',
            ...resultado
        });
    } catch (erro) {
        const status = erro.statusHttp || 400;
        res.status(status).json({
            erro: true,
            mensagem: erro.message
        });
    }
});

module.exports = router;
