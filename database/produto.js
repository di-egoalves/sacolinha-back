const { DataTypes } = require("sequelize");
const { connection } = require("./database");

// Definição do modelo "Produto"
const Produto = connection.define("produto", {
    nome: {
        type: DataTypes.STRING(), // Tipo de dado para o nome do produto (string)
        allowNull: false, // Não permite valores nulos
    },
    preco: {
        type: DataTypes.FLOAT(), // Tipo de dado para o preço do produto (float)
        allowNull: false, // Não permite valores nulos
    },
    descricao: {
        type: DataTypes.STRING(150), // Tipo de dado para a descrição do produto (string com tamanho máximo de 150 caracteres)
        allowNull: false, // Não permite valores nulos
    },
    desconto: {
        type: DataTypes.INTEGER(), // Tipo de dado para o desconto do produto (inteiro)
    },
    dataDesconto: {
        type: DataTypes.DATEONLY(), // Tipo de dado para a data de desconto do produto (apenas data, sem hora)
    },
    foto: {
        type: DataTypes.STRING, // Tipo de dado para a foto do produto (string)
    },
    categoria: {
        type: DataTypes.STRING(), // Tipo de dado para a categoria do produto (string)
        allowNull: false, // Não permite valores nulos
    },
    quantidade: {
        type: DataTypes.INTEGER(), // Tipo de dado para a quantidade do produto (inteiro)
        allowNull: false, // Não permite valores nulos
    },
});

const Usuario = require("./usuario");

// Relacionamento entre as tabelas "Usuario" e "Produto"
//CASCADE define que se um usuário seja excluído, todos os seus produtos também serão excluídos
Usuario.hasMany(Produto, { onDelete: "CASCADE" }); // Um usuário pode ter vários produtos
Produto.belongsTo(Usuario); // Um produto pertence a um único usuário

module.exports = Produto; // Exportação do modelo "Produto" para ser utilizado em outros módulos