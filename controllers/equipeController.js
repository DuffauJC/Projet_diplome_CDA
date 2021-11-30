const Equipe = require('../models/Equipe');
const path = require('path');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');

// Mongoose connect mongodb
require('../config/connect');


// Uploads dans le disk local

// Set The Storage Engine
// const filestorage = multer.diskStorage({
//     destination: './public/uploads/',
//     filename: function (req, file, cb) {
//         // cb(null, file.originalname);
//         cb(null, file.fieldname + '-' + req.user._id + '-' + req.body.toutou + path.extname(file.originalname));
//     }
// });


/////////Upload aws s3 ( cloud amazon )

AWS.config.update({
    accessKeyId: "XXXXXXXXXXXXXXXXXXXXXXXX",
    secretAccessKey: "XXXXXXXXXXXXXXXXXXXXXXXXXXX",
    region: "eu-west-3"
});

const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const awsStorage = multerS3({
    s3: s3,
    bucket: 'ccbscloud31',
    metadata: function (req, file, cb) {
        cb(null, {fieldName: file.fieldname});
    },
    acl: 'public-read',
    key: function (req, file, cb) {
        cb(null, file.fieldname + '-' + req.user._id + '-' + req.body.toutou + path.extname(file.originalname))
    }
});
/////////////////////////////////////////////////////////

// Init Upload
const upload = multer({
    /**if you are using local storage than use
     * storage: fileStorage,
     * if you are using aws storage than use
     * storage: awsStorage,
     */
    storage: awsStorage,
    fileFilter: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        if (ext !== '.jpg') {
            return cb(new Error('Only images are allowed'))
        }
        cb(null, true)},
    limits: {fileSize: 5000000}
}).single('photo');


// // Check File Type
// const checkFileType = (file, cb) => {
//     // Allowed ext
//     const filetypes = /jpeg|jpg|png|gif/;
//     // Check ext
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     // Check mime
//     const mimetype = filetypes.test(file.mimetype);
//
//     if (mimetype && extname) {
//         return cb(null, true);
//     } else {
//         cb('Error: Images Only!');
//     }
// };


//////////////////////////////////////////////////////////////////

//  formulaire post  ( equipe )///////////////////////////////

exports.postEquipe = (req, res) => {
    upload(req, res, () => {
        if (!req.body) {
            return res.sendStatus(500);
        } else {

            const formData = req.body;
            console.log('formData', formData);

            const nom = req.body.nom;
            const toutou = req.body.toutou;
            const race = req.body.race;
            const sexe = req.body.sexe;
            const maitre = req.body.maitre;
            const naissance = req.body.naissance;
            const couleur = req.body.couleur;
            const victoires = req.body.victoires;
            const podiums = req.body.podiums;
            const comment = req.body.comment;
            const userId = req.user._id;
            const image_url = "https://XXXXXXXXXXXXXXX.amazonaws.com/";
            const image_key = 'photo' + '-' + req.user._id + '-' + req.body.toutou + '.jpg';
            const equipe = new Equipe({
                image_url: image_url, image_key: image_key,
                nom: nom, toutou: toutou, race: race, sexe: sexe, maitre: maitre,
                naissance: naissance, couleur: couleur, victoires: victoires, podiums: podiums, comment: comment,
                userId: userId
            });
            console.log(equipe);

            equipe.save((err, savedEquipe) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('savedEquipe', savedEquipe);
                    res.redirect('/backoffice');
                }
            });
        }
    })
};


// tableau utilser sur 2 routes en get ( /équipes et modifier-supprimer )  ////////////////
let tabEquipes = [];

// route pour liste à modifer ou supprimer /////////////////////////

exports.getModifEquipe = (req, res) => {
    if (req.user.role === 'Utilisateur') {
        tabEquipes = [];
        const userId = req.user._id;
        Equipe.find({userId: userId}, (err, equipes) => {
            if (err) {
                console.error('Impossible de récupérer equipes depuis la DB');
                res.sendStatus(500);
            } else {
                tabEquipes = equipes;
                // res.render('modifier', {tabEquipes: equipes});
                console.log('equipe', equipes);
                res.render('modifier', {tabEquipes: equipes, user: req.user});
            }
        });
    }
};

//  route accès au formulaire de modification //////////////

exports.getModifEquipeById = (req, res) => {
    const id = req.params.id;
    Equipe.findById(id, (err, equipe) => {
        console.log('equipe', equipe);
        res.render('modifier-detail', {equipe: equipe, user: req.user})
    });
};


//  formulaire peuplé de modification ///////////////////////
exports.postModifEquipe = (req, res) => {
    upload(req, res, () => {
        console.log('req.body', req.body);
        if (!req.body) {
            return res.sendStatus(500);
        }
        console.log(
            'nom', req.body.nom,
            'toutou', req.body.toutou,
            'race', req.body.race,
            'sexe', req.body.sexe,
            'maitre', req.body.maitre,
            'naissance', req.body.naissance,
            'couleur', req.body.couleur,
            'victoires', req.body.victoires,
            'podiums', req.body.podiums,
            'comment', req.body.comment
        );
        const id = req.params.id;
        Equipe.findByIdAndUpdate(id, {
                $set: {
                    nom: req.body.nom,
                    toutou: req.body.toutou,
                    race: req.body.race,
                    sexe: req.body.sexe,
                    maitre: req.body.maitre,
                    naissance: req.body.naissance,
                    couleur: req.body.couleur,
                    victoires: req.body.victoires,
                    podiums: req.body.podiums,
                    comment: req.body.comment
                }
            }, {new: true},
            (err, equipe) => {
                if (err) {
                    console.log(err);
                    return res.send(`l'équipe' n'a pas pu etre mis a jour`);
                }
                res.redirect('/modifier');
            });
    });
};


//////suppression  //////////////////////
exports.getDeleteEquipe = (req, res) => {
    const id = req.params.id;

    Equipe.findById(id, (err, equipe) => {

        const image_key = equipe.image_key;

        console.log(image_key);
        s3.deleteObject({
            Bucket: 'xxxxxxxx',
            Key: image_key
        }, (err, data) => {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data);           // successful response
        });
    });


    Equipe.findByIdAndRemove(id, (err, equipe) => {
        res.redirect('/modifier');
    });
};

//////suppression image ( vue modifier ) //////////////////////
exports.getDeleteImageModifier = (req, res) => {
    const id = req.params.id;

    Equipe.findById(id, (err, equipe) => {

        const image_key = equipe.image_key;

        console.log(image_key);
        s3.deleteObject({
            Bucket: 'xxxxxxxxx',
            Key: image_key
        }, (err, data) => {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data);           // successful response
        });
        res.render('modifier-detail', {equipe: equipe, user: req.user})
    });

};

////////////////////////Verification//////////////
exports.getVerifById = (req, res) => {
    if (req.user.role === 'Utilisateur') {
        const id = req.params.id;
        Equipe.findById(id, (err, equipe) => {
            console.log('equipe', equipe);
            res.render('verification-detail', {equipe: equipe, user: req.user})
        })
    }
};
////////////////////////////////////////////////////////

exports.getEdition = (req, res) => {
    if (req.user.role === 'Utilisateur') {
        res.render('edition', {user: req.user});
        const user = {user: req.user};
        console.log(user);
    } else {
        res.render('intermediaire', {user: req.user});
    }
};

exports.getEquipes = (req, res) => {
    tabEquipes = [];
    Equipe.find((err, equipes) => {
        if (err) {
            console.error('could note retrieve equipes from DB');
            res.sendStatus(500);
        } else {
            tabEquipes = equipes;
            res.render('index', {tabEquipes: equipes});
        }
    })
};

exports.getDetailEquipe = (req, res) => {
    const id = req.params.id;
    Equipe.findById(id, (err, equipe) => {
        console.log('equipe', equipe);
        res.render('equipes-detail', {equipe: equipe})
    })
};

//////////////////////////////////////////////////////////////////////////
///////////   ADMIN /////////////////////

exports.getGesEquipe = (req, res) => {
    if (req.user.role === 'Admin') {
        tabEquipes = [];
        Equipe.find((err, equipes) => {
            if (err) {
                console.error('could note retrieve equipes from DB');
                res.sendStatus(500);
            } else {
                tabEquipes = equipes;
                res.render('gestion-equipe', {tabEquipes: equipes, user: req.user});
                const user = {user: req.user};
                console.log(user);
            }
        })
    } else {
        res.render('intermediaire', {user: req.user});
    }
};

//////suppression  //////////////////////
exports.getDeleteEquipeAdmin = (req, res) => {
    if (req.user.role === 'Admin') {
        const id = req.params.id;

        Equipe.findById(id, (err, equipe) => {

            const image_key = equipe.image_key;

            console.log(image_key);
            s3.deleteObject({
                Bucket: 'xxxxxxxxx',
                Key: image_key
            }, (err, data) => {
                if (err) console.log(err, err.stack); // an error occurred
                else console.log(data);           // successful response
            });
        });


        Equipe.findByIdAndRemove(id, (err, equipe) => {
            res.redirect('/gestion-equipe');
        });
    }
};

exports.getGesEquipeDetail = (req, res) => {
    if (req.user.role === 'Admin') {
        const id = req.params.id;
        Equipe.findById(id, (err, equipe) => {
            console.log('equipe', equipe);
            res.render('gestion-equipe-detail', {equipe: equipe, user: req.user})
        })
    }
};





