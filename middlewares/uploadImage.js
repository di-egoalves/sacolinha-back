//biblioteca que gerencia importação de arquivo
const multer = require('multer');
//define as configurações para armazenamento do arquivo
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //cb = função de callback
        //define o local do arquivo de armazenamento
        cb(null, 'uploads/');
    },
    //define nome do arquivo
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

//cria um objeto instaciado no multer armazenando na storage
const uploadImage = multer({ storage: storage });

module.exports = uploadImage;