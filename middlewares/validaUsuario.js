const JWT = require("jsonwebtoken");
const Usuario = require("../database/usuario");

//a função validaUsuario recebe uma lista de tipos de usuário
// ["administrador", "empreendedor", "consumidor"]
function validaUsuario(...tipo){
    return async (req, res, next) => {
        //busca no cabeçalho informações de autenticação (Token)
        const authorization = req.headers.authorization;
        //verifica se a autorização foi encontrada
        if (!authorization) {
            res.status(401).json({ message: "Autorização invalida"})
            return;
        }
        
        //separa a string em duas variáveis: "authType" e "token"
        const [authType, token] = authorization.split(" ");
        //verifica se o tipo de autenticação é "Bearer"
        if (authType !== "Bearer") {
            //caso seja outro tipo, retorna mensagem de erro
            res.status(401).json({ message: "Metodo de autenticação não suportado"});
            return;
        }
        //verifica o token de autenticação
        try {
            //o verify decodifica o token e verificar se ele é válido
            JWT.verify(token, process.env.JSON_SECRET, async (err, decoded) => {
                if (err) {
                    res.status(403).json({ message: "Acesso negado"})
                    return;
                }

                //busca usuário no banco de dados com base no id que está no token
                const user = await Usuario.findOne({ where: { id: decoded.id}});
                
                //verifica se não foi encontrado
                if (!user) {
                    res.status(404).json({ message: "Token expirado ou não encontrado"})
                    return;
                }
                //verifica se o tipo decodificado do token e o tipo do usuário obtido do banco de dados estão incluídos na lista de permissões
                //se verdadeiro chama a próxima função de middleware
                if (tipo.includes(decoded.tipo) && tipo.includes(user.tipo)) {
                    next();
                } else {
                    //se falso, retorna
                    res.status(403).json({ message: "Não autorizado"})
                }
            })
        } catch (err) {
            res.status(500).json({ message: "Algo deu errado"});
        }
    }
}



module.exports = validaUsuario;