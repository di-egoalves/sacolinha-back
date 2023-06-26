const { Router } = require("express");
const router = Router();
const Consumidor = require("../database/usuario");
const EndConsumidor = require("../database/endereco");
const CPF = require("cpf");
const bcrypt = require("bcrypt");
const validaUsuario = require("../middlewares/validaUsuario")
const uploadImage = require("../middlewares/uploadImage");
const { Op } = require("sequelize");

router.post("/consumidores", uploadImage.single('foto'), async (req, res) => {
    let { nome, email, senha, uf, cidade, cep, rua, numero, cpf } = req.body;
    let foto = null;

    const SALT_ROUNDS = 10

    const usuarioExistente = await Consumidor.findOne({ where: { cpf } });
    if (usuarioExistente) {
        return res.status(409).json({ mensagem: 'CPF já está em uso' });
    }

    try {
        senha = await bcrypt.hash(senha, SALT_ROUNDS);
        const valido = CPF.isValid(cpf);
        if (valido) {
            const novoConsumidor = await Consumidor.create({ nome, email, senha: senha, foto, endereco: { uf, cidade, cep, rua, numero }, cpf, tipo: "consumidor" }, { include: [EndConsumidor] });
            res.status(201).json(novoConsumidor);
        } else {
            res.status(404).json({ message: "CPF Inválido" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});

// PUT CONSUMIDOR - Atualizar senha de um consumidor
router.put("/consumidores/senha/:id", validaUsuario("consumidor", "administrador"), async (req, res) => {
    let { senha } = req.body;
    const { id } = req.params;
    const SALT_ROUNDS = 10

    const consumidor = await Consumidor.findByPk(id);
    try {
        senha = await bcrypt.hash(senha, SALT_ROUNDS);
        if (consumidor) {
            await consumidor.update({ senha });
            res.status(200).json({ message: "Senha atualizada com sucesso!" });
        } else {
            res.status(404).json({ message: "Consumidor não encontrado!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});

//GET SENHA - listar senhas
router.get("/consumidores/senha/:id", async (req, res) => {
    try {
        const senha = await Consumidor.findOne({
            where: { id: req.params.id },
            include: [EndConsumidor],
        });

        if (!senha) {
            throw { status: 404, error: "Consumidor não encontrado " }
        } else {
            res.status(200).json(senha);
        }
    } catch (error) {
        if (!error.status || error.status === 500) {
            throw { status: 500, message: "Erro interno do servidor" };
        }
        res.status(error.status).json(error);
    }
});

// PUT CONSUMIDOR - Atulizar dados de um consumidor
router.put("/consumidores/:id", uploadImage.single('foto'), validaUsuario("consumidor", "administrador"), async (req, res) => {

    let { nome, email, uf, cidade, cep, rua, numero } = req.body;
    let foto = req.file;

    const { id } = req.params;
    try {

        const consumidor = await Consumidor.findOne({ where: { id } });

        if (consumidor) {

            if (uf && cidade && cep && rua && numero) {
                const endereco = { uf, cidade, cep, rua, numero }

                await EndConsumidor.update(endereco, { where: { usuarioId: id } });
            }

            if (req.file) {
                await consumidor.update({ nome, email, foto: foto.filename });
            } else {
                await consumidor.update({ nome, email });
            }
            res.status(200).json({ message: "Consumidor editado." });
        } else {
            res.status(404).json({ message: "Consumidor não encontrado!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});

// GET CONSUMIDOR - Listar todos os Consumidores
router.get("/consumidores", validaUsuario("administrador"), async (req, res) => {
    const pageAsNumber = Number.parseInt(req.query.page);
    const sizeAsNumber = Number.parseInt(req.query.size);
    const nomePesquisa = req.query.nome;

    let page = 0;
    if (!Number.isNaN(pageAsNumber) && pageAsNumber > 0) {
        page = pageAsNumber;
    }
    let size = 6;
    if (!Number.isNaN(sizeAsNumber) && sizeAsNumber > 0 && sizeAsNumber < 24) {
        size = sizeAsNumber;
    }

    try {
        let listaConsumidores;
        if (nomePesquisa) {
            listaConsumidores = await Consumidor.findAndCountAll({
                where: { tipo: "consumidor", nome: { [Op.like]: `%${nomePesquisa}%` } },
                limit: size,
                offset: page * size,
            });
        } else {
            listaConsumidores = await Consumidor.findAndCountAll({
                where: { tipo: "consumidor" },
                limit: size,
                offset: page * size,
            });
        }
        res.status(200).json({
            content: listaConsumidores.rows,
            totalPages: Math.ceil(listaConsumidores.count / size),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});

// GET CONSUMIDOR - Listar um consumidor pelo ID
router.get("/consumidores/:id", validaUsuario("consumidor", "administrador"), async (req, res) => {

    try {
        const consumidor = await Consumidor.findOne({
            where: { id: req.params.id },
            include: [EndConsumidor],
        });
        if (consumidor) {
            res.status(200).json(consumidor);
        } else {
            res.status(404).json({ message: "Consumidor não encontrado!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});


// DELETE CONSUMIDOR - Deletar um consumidor pelo ID
router.delete("/consumidores/:id", validaUsuario("consumidor", "administrador"), async (req, res) => {

    const { id } = req.params;

    const consumidor = await Consumidor.findOne({ where: { id } });
    try {
        if (consumidor) {
            await consumidor.destroy();
            res.status(200).json({ message: "Consumidor removido." });
        } else {
            res.status(404).json({ message: "Consumidor não encontrado!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }

})


module.exports = router