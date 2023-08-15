const { Router } = require("express");
const router = Router();
const Empreendedor = require("../database/usuario");
const EndEmpreendedor = require("../database/endereco");
const CPF = require("cpf");
const bcrypt = require("bcrypt");
const validaUsuario = require("../middlewares/validaUsuario");
const uploadImage = require("../middlewares/uploadImage");
const { Op } = require("sequelize");

// Empreendedores - Criar recurso GET para listagem de Empreendedores
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
      res.status(404).json({ message: "Empreendedor não encontrado" });
    } else {
      res.status(200).json(empreendedor);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Empreendedores - Alterar senha
router.put("/empreendedores/senha/:id", validaUsuario("empreendedor", "administrador"), async (req, res) => {
  let { senha } = req.body;
  const { id } = req.params;
  const SALT_ROUNDS = 10;

  const empreendedor = await Empreendedor.findByPk(id);
  try {
    senha = await bcrypt.hash(senha, SALT_ROUNDS);
    if (empreendedor) {
      await empreendedor.update({ senha });
      res.status(200).json({ message: "Senha atualizada com sucesso!" });
    } else {
      res.status(404).json({ message: "Empreendedor não encontrado" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Empreendedores listar senhas
router.get("/empreendedores/senha/:id", async (req, res) => {
  try {
    const senha = await Empreendedor.findOne({
      where: { id: req.params.id },
      include: [EndEmpreendedor],
    });

    if (!senha) {
      throw { status: 404, error: "Empreendedor não encontrado" };
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
router.put("/empreendedores/:id", uploadImage.single('foto'), validaUsuario("empreendedor", "administrador"),async (req, res) => {
  const empreendedorId = parseInt(req.params.id);
  const {
    nome,
    email,
    cpf,
    telefone,
    endereco,
    descricao,
    foto,
  } = req.body;

  try {
    const empreendedor = await Empreendedor.findOne({ where: { id: empreendedorId } });

    if (!empreendedor) {
      res.status(404).json({ message: "Empreendedor não encontrado" });
    } else {
      // Verificar se o CPF é válido
      if (!CPF.isValid(cpf)) {
        res.status(400).json({ message: "CPF inválido" });
        return;
      }

      // Atualizar os dados do empreendedor
      await empreendedor.update({
        nome,
        email,
        cpf,
        telefone,
        endereco,
        descricao,
        foto,
      });

      res.status(200).json({ message: "Empreendedor atualizado com sucesso" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Empreendedores - Deletar um Empreendedor
router.delete("/empreendedores/:id", validaUsuario("administrador"), async (req, res) => {
  const empreendedorId = parseInt(req.params.id);

  try {
    const empreendedor = await Empreendedor.findOne({ where: { id: empreendedorId } });

    if (!empreendedor) {
      res.status(404).json({ message: "Empreendedor não encontrado" });
    } else {
      await empreendedor.destroy();
      res.status(200).json({ message: "Empreendedor deletado com sucesso" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

module.exports = router;