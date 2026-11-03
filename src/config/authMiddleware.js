/**
 * RNF03 (Segurança):
 * As rotas e telas de avaliação de solicitações e edição de ficha médica
 * devem ser restritas ao perfil de "Gestor da ONG".
 */
function exigirGestorONG(req, res, next) {
    const perfilHeader = req.headers['x-perfil'];
    const perfilBody = req.body ? req.body.perfil : undefined;
    const perfilQuery = req.query ? req.query.perfil : undefined;

    const perfilAtivo = String(perfilHeader || perfilBody || perfilQuery || '').toUpperCase().trim();

    if (perfilAtivo !== 'GESTOR_ONG') {
        return res.status(403).json({
            erro: true,
            regraViolada: 'RNF03',
            mensagem: 'Acesso restrito: esta operação é exclusiva para o perfil de Gestor da ONG.'
        });
    }

    next();
}

module.exports = {
    exigirGestorONG
};

