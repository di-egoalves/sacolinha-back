const { sign } = require("jsonwebtoken");
const { compare } = require("bcrypt");
const Usuario = require("../database/usuario")

// Função que executa o login do usuario no sistema gerando o Token de acesso
async function LoginService(data) {

    try {
        //Busca o usuario cadastrado no Banco pelo email digitado no fomulário de login
        const usuario = await Usuario.findOne({
            attributes: ["id", "email", "senha", "tipo"],
            where: {
                email: data.email
            }
        });

        if (!usuario) {//Verifica se o usuario do banco existe
            throw { status: 404, message: "Usuario não cadastrado" }
        }

        //Compara a senha digitada no fomulário com a senha criptografada no banco
        const validarSenha = await compare(data.senha, usuario.senha);

        if (!validarSenha) {// verifica se a senha está correta
            throw { status: 403, message: "Senha invalida" }
        }

        //Cria o token passando as informações necessarias do usuario 
        //com a chave JSON_SECRET do .env
        const acessToken = sign({
            id: usuario.id,
            email: usuario.email,
            tipo: usuario.tipo
        },
            process.env.JSON_SECRET,
            {
                expiresIn: "7d"
            })

        //Retorna o token de acesso pela rota
        return { acessToken }
    } catch (error) {
        throw error;
    }
}

module.exports = LoginService;
