const { Router } = require("express");
const router = Router();
const Empreendedor = require("../database/usuario");
const EndEmpreendedor = require("../database/endereco");
const CPF = require("cpf");
const bcrypt = require("bcrypt");
const validaUsuario = require("../middlewares/validaUsuario")
const uploadImage = require("../middlewares/uploadImage");
const { Op } = require("sequelize");

// Empreendedores - Criar recurso GET para listagem de Empreendedores#
router.get("/empreendedores", validaUsuario("administrador"), async (req, res) => {
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
        let listaEmpreendedores;
        if (nomePesquisa) {
            listaEmpreendedores = await Empreendedor.findAndCountAll({
                where: { tipo: "empreendedor", nome: { [Op.like]: `%${nomePesquisa}%` } },
                limit: size,
                offset: page * size,
            });
        } else if (req.query.page && req.query.size) {
            listaEmpreendedores = await Empreendedor.findAndCountAll({
                where: { tipo: "empreendedor" },
                limit: size,
                offset: page * size,
            });
        } else {
            listaEmpreendedores = await Empreendedor.findAndCountAll({ where: { tipo: "empreendedor" } });
        }
        res.status(200).json({
            content: listaEmpreendedores.rows,
            totalPages: Math.ceil(listaEmpreendedores.count / size),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});

// Empreendedores - Criar recurso GET para listar um Empreendedor pelo ID
router.get("/empreendedores/:id", async (req, res) => {
    const empreendedorId = parseInt(req.params.id);
    try {
        const empreendedor = await Empreendedor.findOne({ where: { id: empreendedorId }, include: [EndEmpreendedor] });

        if (!empreendedor) {
            res.status(404).status({ message: "Empreendedor não encontrado " })
        } else {
            res.status(200).json(empreendedor);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});

// Empreeendedores - Alterar senha 
router.put("/empreendedores/senha/:id", validaUsuario("empreendedor", "administrador"), async (req, res) => {
    let { senha } = req.body;
    const { id } = req.params;
    const SALT_ROUNDS = 10

    const empreendedor = await Empreendedor.findByPk(id);
    try {
        senha = await bcrypt.hash(senha, SALT_ROUNDS);
        if (empreendedor) {
            await empreendedor.update({ senha });
            res.status(200).json({ message: "Senha atualizada com sucesso!" });
        } else {
            res.status(404).status({ message: "Empreendedor não encontrado " })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});

//Empreendedores listar senhas
router.get("/empreendedores/senha/:id", async (req, res) => {
    try {
        const senha = await Empreendedor.findOne({
            where: { id: req.params.id },
            include: [EndEmpreendedor],
        });

        if (!senha) {
            throw { status: 404, error: "Empreendedor não encontrado " }
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



// Empreendedores - Atualizar um Empreendedor 
router.put("/empreendedores/:id", uploadImage.single('foto'), validaUsuario("empreendedor", "administrador"), async (req, res) => {
    // obter dados do corpo da requisão
    let { nome, email, uf, cidade, cep, rua, numero } = req.body;
    const foto = req.file;
    // obter identificação do empreendedor pelos parametros da rota
    const { id } = req.params;
    try {
        // buscar empreendedor pelo id passado
        const empreendedor = await Empreendedor.findOne({ where: { id } });
        // validar a existência desse empreendedor no banco de dados
        if (empreendedor) {
            // validar a existência desse do endereço passado no corpo da requisição
            if (uf && cidade && cep && rua && numero) {
                const endereco = { uf, cidade, cep, rua, numero }

                await EndEmpreendedor.update(endereco, { where: { usuarioId: id } });
            }
            if (req.file) {
                await empreendedor.update({ nome, email, foto: foto.filename });
            } else {
                await empreendedor.update({ nome, email });
            }
            res.status(200).json({ message: "Empreendedor editado." });
        } else {
            res.status(404).status({ message: "Empreendedor não encontrado " })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
}),

    // Empreendedores - Cadastrar um empreendedor
    router.post("/empreendedores", uploadImage.single('foto'), async (req, res) => {
        let { nome, email, senha, uf, cidade, cep, rua, numero, cpf } = req.body;
        const foto = req.file.filename;

        const SALT_ROUNDS = 10;

        const usuarioExistente = await Empreendedor.findOne({ where: { cpf } });
        if (usuarioExistente) {
            return res.status(409).json({ mensagem: 'CPF já está em uso' });
        }

        try {
            senha = await bcrypt.hash(senha, SALT_ROUNDS);
            const valido = CPF.isValid(cpf);
            if (valido) {
                const novoEmpreendedor = await Empreendedor.create({ nome, email, senha: senha, foto, endereco: { uf, cidade, cep, rua, numero }, cpf, tipo: "empreendedor" }, { include: [EndEmpreendedor] });
                res.status(201).json(novoEmpreendedor);
            } else {
                res.status(404).json({ message: "CPF Inválido" })
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erro interno do servidor" });
        }
    });

//DELETE EMPREENDEDOR - Deletar um empreendedor pelo ID
router.delete("/empreendedores/:id", validaUsuario("empreendedor", "administrador"), async (req, res) => {
    const { id } = req.params;
    const empreendedor = await Empreendedor.findOne({ where: { id } });
    try {
        if (empreendedor) {
            await empreendedor.destroy();
            res.status(200).json({ message: "Empreendedor excluído." });
        } else {
            res.status(404).json({ message: "Empreendedor não encontrado." })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }

});

module.exports = router;