const Produto = require("../database/produto");
const { Router } = require("express");
const validaUsuario = require("../middlewares/validaUsuario");
const uploadImage = require("../middlewares/uploadImage");
const { Op } = require("sequelize");
const Usuario = require("../database/usuario");

//Definição da rota
const router = Router();

//POST PRODUTO - Adicionar produto
router.post(
    "/produtos",
    uploadImage.single("foto"),
    validaUsuario("empreendedor", "administrador"),
    async (req, res) => {
        const {
            nome,
            preco,
            descricao,
            desconto,
            dataDesconto,
            categoria,
            quantidade,
            usuarioId,
        } = req.body;
        const foto = req.file.filename;

        if (new Date(dataDesconto) < new Date()) {
            res.status(400).json({ message: "Data de desconto deve ser maior que a data atual." })
        }
        if (desconto < 0 || desconto >= 100) {
            res.status(400).json({ message: "Desconto deve ser entre 1% e 100%." });
        }

        try {
            let novoProduto;
            if (!desconto && !dataDesconto) {
                novoProduto = await Produto.create({
                    nome,
                    preco,
                    descricao,
                    categoria,
                    foto,
                    quantidade,
                    usuarioId,
                });
            } else {
                novoProduto = await Produto.create({
                    nome,
                    preco,
                    descricao,
                    desconto,
                    dataDesconto,
                    categoria,
                    foto,
                    quantidade,
                    usuarioId,
                });
            }

            res
                .status(201)
                .json({ message: "Produto inserido com sucesso!", novoProduto });
        } catch (error) {
            res.status(500).json({ message: "Erro interno do servidor" }, error);
        }
    }
);


//GET PRODUTOS - Listar todos os Produtos
router.get("/produtos", async (req, res) => {
    const pageAsNumber = Number.parseInt(req.query.page);
    const sizeAsNumber = Number.parseInt(req.query.size);
    const nomePesquisa = req.query.nome;
    const categoria = req.query.categoria;
    const precoPesquisa = req.query.preco;
    const precoPesquisaAsNumber = Number.parseFloat(precoPesquisa);

    let page = 0;
    if (!Number.isNaN(pageAsNumber) && pageAsNumber > 0) {
        page = pageAsNumber;
    }
    let size = 6;
    if (!Number.isNaN(sizeAsNumber) && sizeAsNumber > 0 && sizeAsNumber < 24) {
        size = sizeAsNumber;
    }

    try {
        let produtos;
        if (nomePesquisa && !categoria && !precoPesquisa) {
            produtos = await Produto.findAndCountAll({
                where: {
                  [Op.or]: [
                    { "$Usuario.nome$": { [Op.like]: `%${nomePesquisa}%` } },
                    { nome: { [Op.like]: `%${nomePesquisa}%` } }
                  ]
                },
                include: [{
                  model: Usuario,
                  attributes: ['nome']
                }],
                limit: size,
                offset: page * size,
              });
        } else if (categoria && !nomePesquisa && !precoPesquisa) {
            produtos = await Produto.findAndCountAll({
                where: {
                    categoria: categoria
                },
                limit: size,
                offset: page * size,
            });
        } else if (!nomePesquisa && !categoria && precoPesquisa) {
            produtos = await Produto.findAndCountAll({
                where: { preco: precoPesquisaAsNumber },
                limit: size,
                offset: page * size,
            });
        } else if (nomePesquisa && categoria && !precoPesquisa) {
            produtos = await Produto.findAndCountAll({
                where: { nome: { [Op.like]: `%${nomePesquisa}%` }, categoria: categoria },
                limit: size,
                offset: page * size,
            });
        } else if (!nomePesquisa && categoria && precoPesquisa) {
            produtos = await Produto.findAndCountAll({
                where: { categoria: categoria, preco: precoPesquisaAsNumber },
                limit: size,
                offset: page * size,
            });
        } else if (nomePesquisa && !categoria && precoPesquisa) {
            produtos = await Produto.findAndCountAll({
                where: { nome: { [Op.like]: `%${nomePesquisa}%` }, preco: precoPesquisaAsNumber },
                limit: size,
                offset: page * size,
            });
        }

        else if (nomePesquisa && categoria && precoPesquisa) {
            produtos = await Produto.findAndCountAll({
                where: {
                    nome: { [Op.like]: `%${nomePesquisa}%` },
                    categoria: categoria,
                    preco: precoPesquisaAsNumber
                },
                limit: size,
                offset: page * size,
            });
        } else {
            produtos = await Produto.findAndCountAll({
                limit: size,
                offset: page * size,
            });
        }
        res.status(200).json({
            content: produtos.rows,
            totalPages: Math.ceil(produtos.count / size),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});

//Empreendedores - Criar recurso GET para listagem dos produtos pelo id do empreendedor
router.get("/produtos/empreendedores", async (req, res) => {
    const usuarioId = req.query.usuarioId;
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
        let listaProdutos;
        if(nomePesquisa) {
            listaProdutos = await Produto.findAndCountAll({
                where: { usuarioId, nome: { [Op.like]: `%${nomePesquisa}%` }  },
                limit: size,
                offset: page * size,
                });
        } else {
            listaProdutos = await Produto.findAndCountAll({
                where: { usuarioId },
                limit: size,
                offset: page * size,
                });
        }
        res.status(200).json({
            content: listaProdutos.rows,
            totalPages: Math.ceil(listaProdutos.count / size),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});

//GET PRODUTOS - Listar um produto pelo ID
router.get("/produtos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const produto = await Produto.findByPk(id);
        if (produto) {
            res.status(200).json(produto);
        } else {
            res.status(404).json({ message: "Produto não existe" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});

//DELETAR TODOS OS PRODUTOS DE UM EMPREENDEDOR
router.delete(
    "/produtos/all/:usuarioId",
    validaUsuario("empreendedor", "administrador"),
    async (req, res) => {
        const { usuarioId } = req.params;
        const produtos = await Produto.findAll({ where: { usuarioId } });
        try {
            if (produtos.length > 0) {
                produtos.forEach(async (produto) => {
                    await produto.destroy();
                });
                res.status(200).json({ message: "Todos os produtos foram exluídos." });
            } else {
                res.status(404).json({ message: "Produto não existe" });
            }
        } catch (err) {
            res.status(500).json({ message: "Erro interno do servidor" });
        }
    }
);

//DELETE PRODUTO - Deleta o produto pelo ID
router.delete(
    "/produtos/:id",
    validaUsuario("empreendedor", "administrador"),
    async (req, res) => {
        const { id } = req.params;
        const produto = await Produto.findOne({ where: { id } });
        try {
            if (produto) {
                await produto.destroy();
                res.status(200).json({ message: "Produto excluído." });
            } else {
                res.status(404).json({ message: "Produto não existe" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erro interno do servidor" });
        }
    }
);

//PUT PRODUTOS - Atualizar dados de um produto
router.put(
    "/produtos/:id",
    uploadImage.single("foto"),
    validaUsuario("empreendedor", "administrador"),
    async (req, res) => {
        const {
            nome,
            preco,
            descricao,
            desconto,
            dataDesconto,
            categoria,
            quantidade,
            usuarioId,
        } = req.body;
        const foto = req.file;

        const produto = await Produto.findByPk(req.params.id);
        
        if (new Date(dataDesconto) < new Date()) {
            return res.status(400).json({ message: "Data de desconto deve ser maior que a data atual." });
        }

        if (desconto < 0 || desconto >= 100) {
            return res.status(400).json({ message: "Desconto deve ser entre 1% e 100%." });
        }

        try {
            if (produto) {
                //sem desconto e sem imagem
                if (!desconto && !dataDesconto && !req.file) {
                    await produto.update({
                        nome,
                        preco,
                        descricao,
                        desconto: null,
                        dataDesconto: null,
                        categoria,
                        quantidade,
                        usuarioId,
                    });
                    return res
                        .status(201)
                        .json({ message: "Produto editado com sucesso!" });
                }
                //sem desconto e altera img
                else if (!desconto && !dataDesconto && req.file) {
                    await produto.update({
                        nome,
                        preco,
                        descricao,
                        desconto: null,
                        dataDesconto: null,
                        foto: foto.filename,
                        categoria,
                        quantidade,
                        usuarioId,
                    });
                    return res
                        .status(201)
                        .json({ message: "Produto editado com sucesso!" });
                }
                //com desconto e sem imagem
                else if (desconto && dataDesconto && !req.file) {
                    await produto.update({
                        nome,
                        preco,
                        descricao,
                        desconto,
                        dataDesconto,
                        categoria,
                        quantidade,
                        usuarioId,
                    });
                    return res
                        .status(201)
                        .json({ message: "Produto editado com sucesso!" });
                }
                //altera tudo
                else if (desconto && dataDesconto && req.file) {
                    await produto.update({
                        nome,
                        preco,
                        descricao,
                        desconto,
                        dataDesconto,
                        categoria,
                        foto: foto.filename,
                        quantidade,
                        usuarioId,
                    });

                    return res
                        .status(201)
                        .json({ message: "Produto editado com sucesso!" });
                }
            }

        } catch (error) {
            res.status(500).json({ message: "Erro interno do servidor" }, error);
        }
    }
);

module.exports = router;
