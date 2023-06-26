const { DataTypes } = require("sequelize");
const { connection } = require("./database");

// Definição do modelo "Endereco"
const Endereco = connection.define("endereco", {
  uf: {
    type: DataTypes.STRING(2), // Tipo de dado para a UF do endereço (string com tamanho máximo de 2 caracteres)
    allowNull: false, // Não permite valores nulos
  },
  cidade: {
    type: DataTypes.STRING, // Tipo de dado para a cidade do endereço (string)
    allowNull: false, // Não permite valores nulos
  },
  cep: {
    type: DataTypes.STRING(9), // Tipo de dado para o CEP do endereço (string com tamanho máximo de 9 caracteres)
    allowNull: false, // Não permite valores nulos
  },
  rua: {
    type: DataTypes.STRING, // Tipo de dado para a rua do endereço (string)
    allowNull: false, // Não permite valores nulos
  },
  numero: {
    type: DataTypes.STRING, // Tipo de dado para o número do endereço (string)
    allowNull: false, // Não permite valores nulos
  },
});




module.exports = Endereco; // Exportação do modelo "Endereco" para ser utilizado em outros módulos