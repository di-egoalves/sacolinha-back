const LoginService = require("../services/LoginService");
const { Router } = require("express");
const router = Router();

//Rota de login
router.post("/auth/login", async (req, res) => {
    // pega o email e a senha do fomulário
    const { email, senha } = req.body;

    try {
        //joga o email e a senha para gerar o token em LoginService
        const token = await LoginService({ email, senha });
        res.status(200).json(token); //Retorna o token de acesso
    } catch (error) {
        if (!error.status || error.status === 500) {
            res.status(500).json({ status: 500, message: "Erro interno do servidor" });
        } else {
            res.status(error.status).json(error);
        }
    }
});

module.exports = router;