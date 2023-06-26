const { DataTypes } = require("sequelize");
const { connection } = require("./database");

// Definição do modelo "Usuario"
const Usuario = connection.define("usuario", {
    nome: {
        type: DataTypes.STRING, // Tipo de dado para o nome do usuário (string)
        allowNull: false, // Não permite valores nulos
    },
    email: {
        type: DataTypes.STRING, // Tipo de dado para o email do usuário (string)
        allowNull: false, // Não permite valores nulos
        unique: true, // Garante que o email seja único na tabela
    },
    senha: {
        type: DataTypes.STRING, // Tipo de dado para a senha do usuário (string)
        allowNull: false, // Não permite valores nulos
    },
    foto: {
        type: DataTypes.STRING, // Tipo de dado para a foto do usuário (string)
    },
    cpf: {
        type: DataTypes.STRING, // Tipo de dado para o CPF do usuário (string)
        unique: true, // Garante que o CPF seja único na tabela
    },
    tipo: {
        type: DataTypes.STRING, // Tipo de dado para o tipo de usuário (string)
        allowNull: false, // Não permite valores nulos
    },
});

const Endereco = require("./endereco");

// Relacionamento entre as tabelas "Usuario" e "Endereco"
//CASCADE define que se um usuário seja excluído, todos os seus produtos também serão excluídos
Usuario.hasOne(Endereco, { onDelete: "CASCADE" }); // Um usuário possui um endereço
Endereco.belongsTo(Usuario); // Um endereço pertence a um único usuário

module.exports = Usuario; // Exportação do modelo "Usuario" para ser utilizado em outros módulos