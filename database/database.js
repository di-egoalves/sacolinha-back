const { Sequelize } = require("sequelize");

// Configuração da conexão com o banco de dados
const connection = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {

    host: process.env.DB_HOST, // Host do banco de dados
    dialect: "mysql", // Dialeto do banco de dados (MySQL)
    port: process.env.DB_PORT
  }
);

// Função que faz a conexão com o banco de dados
async function authenticate(connection) {
  try {

    await connection.authenticate();
    console.log("Conexão estabelecida com sucesso!");
  } catch (err) {

    console.log("Um erro inesperado aconteceu: ", err);
  }
}

module.exports = { connection, authenticate }