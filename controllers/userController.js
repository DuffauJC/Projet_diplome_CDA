const User = require('../models/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const crypto = require('crypto');
const async = require('async');
const sgMail = require('@sendgrid/mail');
const api = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
sgMail.setApiKey(api);
// Mongodb connect
require('../config/connect');


exports.getInscription = (req, res) => {
    res.render('inscription');
};

exports.postInscription = (req, res) => {
    const {email, password, password2} = req.body;
    let errors = [];

    if (password != password2) {
        errors.push({msg: 'Mot de passe différents'});
    }

    if (password.length < 6) {
        errors.push({msg: 'Mot de passe trop court'});
    }

    if (errors.length > 0) {
        res.render('inscription', {
            errors,
            password,
            password2
        });
    } else {
        User.findOne({email: email}).then(user => {
            if (user) {
                errors.push({msg: 'Email déjà utlisé'});
                res.render('inscription', {
                    errors,
                    email,
                    password,
                    password2
                });
            } else {
                const formData = req.body;
                console.log('formData', formData);

                const role = req.body.role;
                const prenom = req.body.prenom;
                const email = req.body.email;
                const password = req.body.password;

                const user = new User({
                    role: role, prenom: prenom, email: email, password: password
                });
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(user.password, salt, (err, hash) => {
                        if (err) throw err;
                        user.password = hash;
                        user
                            .save()
                            .then(user => {
                                req.flash(
                                    'success_msg',
                                    'Inscription réussie.'
                                );
                                res.redirect('/login');
                            })
                            .catch(err => console.log(err));
                    });
                });
            }
        });
    }
};
//Accés à la Connexion
exports.getLogin = (req, res) => {
    res.render('login');
};

//Déconnection
exports.getLogout=(req, res) =>{
    req.logout();
    req.flash('success_msg', 'Vous êtes déconnecté');
    res.redirect('/');
};

// Login
exports.postLogin = (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/intermediaire',
        failureRedirect: 'login',
        failureFlash: true
    })(req, res, next);
};

///// Intermédiaire //////
exports.getIntermediaire = (req, res) => {
    res.render('intermediaire', {user: req.user});
    const user = {user: req.user};
    console.log(user);
};

//Backoffice
exports.getBackOffice = (req, res) => {
    if (req.user.role === 'Utilisateur') {
        res.render('backoffice', {user: req.user});
        const user = {user: req.user};
        console.log(user);
    } else {
        res.render('intermediaire', {
            user: req.user
        });
    }
};

/////Modif mot de passe ///////////
exports.getForgot = (req, res) => {
    res.render('forgot', {
        user: req.user
    });
};


// Envoie mail récup mdp//////////////
exports.postForgot = (req, res, next) => {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                let token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({email: req.body.email}, function (err, user) {
                if (!user) {
                    req.flash('error_msg', `Aucun compte n'existe avec cet email.`);
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            let message = {
                to: user.email,
                from: 'contactXXXXX@gmail.com',
                subject: 'CCBS Agilitistes réinitialisation mot de passe',
                text: `Vous recevez ce message car vous (ou quelqu'un d'autre) avez fait une demande pour réinialiser le mot de passe.\n\n` +
                    `Cliquez sur le lien suivant, ou collez le lien dans votre navigateur:\n\n` +
                    `http://` + req.headers.host + `/reset/` + token + `\n\n` +
                    `Si vous n'êtes à l'origine de cette demande, ignorez cet email et votre mot de passe reste inchangé.\n`
            };
            sgMail.send(message, function (err) {
                console.log(err);
                req.flash('success_msg', 'Un e-mail e été envoyé à ' + user.email + ' suivre les instructions.');
                done(err, 'done');

            });
        }
    ], function (err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
};

///// Formulaire nouveau mdp ///////////
exports.getReset = (req, res) => {
    const token = req.params.token;
    User.findOne({resetPasswordToken: token, resetPasswordExpires: {$gt: Date.now()}}, function (err, user) {
        if (!user) {
            req.flash('error_msg', 'Token de reset du mdp est invalide ou expiré.');
            return res.redirect('/forgot');
        }
        res.render('reset', {
            user: req.user
        });
    });
};

exports.postReset = (req, res) => {
    const {password, password2} = req.body;
    let errors = [];

    if (password != password2) {
        errors.push({msg: 'Mot de passe différents'});
    }

    if (password.length < 6) {
        errors.push({msg: 'Mot de passe trop court'});
    }

    if (errors.length > 0) {
        res.render('reset', {
            errors,
            password,
            password2
        });
    } else {
        async.waterfall([
            function (done) {
                const token = req.params.token;
                User.findOne({
                    resetPasswordToken: token,
                    resetPasswordExpires: {$gt: Date.now()}
                }, function (err, user) {
                    if (!user) {
                        req.flash('error_msg', 'Token de reset du mdp est invalide ou expiré.');
                        return res.redirect('/login');
                    }

                    user.password = req.body.password;
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(user.password, salt, (err, hash) => {
                            if (err) throw err;
                            user.password = hash;
                            user.save(function (err) {
                                req.logIn(user, function (err) {
                                    done(err, user);
                                });
                            });
                            console.log(user);
                        });
                    });

                });
            },
            function (user, done) {
                let message = {
                    to: user.email,
                    from: 'contactxxxxxxx@gmail.com',
                    subject: 'Votres mot de passe est changé.',
                    text: 'Bonjour,\n\n' +
                        'Ce message vous confirme que le mot de passe du compte ' + user.email + ' a biens été changé.\n'
                };
                sgMail.send(message, function (err) {
                    console.log(err);
                    done(err);
                });
            }
        ], function (err) {
            req.flash('success', 'Eureka! Mot de passe biens changé.');
            res.redirect('/');
        });
    }
};
///////////admin//////////////////////


exports.getAdmin = (req, res) => {
    if (req.user.role === 'Admin') {
        res.render('admin', {user: req.user});
        const user = {user: req.user};
        console.log(user);
    } else {
        res.render('intermediaire', {user: req.user});
    }
};

exports.getGesUtilisateur = (req, res) => {
    if (req.user.role === 'Admin') {
        res.render('gestion-utilisateur', {user: req.user});
        const user = {user: req.user};
        console.log(user);
    } else {
        res.render('intermediaire', {user: req.user});
    }
};

exports.getEditUser = (req, res) => {
    if (req.user.role === 'Admin') {
        res.render('Admin-inscription-user', {user: req.user});
        const user = {user: req.user};
        console.log(user);
    } else {
        res.render('intermediaire', {user: req.user});
    }
};
exports.postInsUser = (req, res) => {
    const {email, password, password2} = req.body;
    let errors = [];

    if (password != password2) {
        errors.push({msg: 'Mot de passe différents'});
    }

    if (password.length < 6) {
        errors.push({msg: 'Mot de passe trop court'});
    }

    if (errors.length > 0) {
        res.render('inscription', {
            errors,
            password,
            password2
        });
    } else {
        User.findOne({email: email}).then(user => {
            if (user) {
                errors.push({msg: 'Email déjà utlisé'});
                res.render('inscription', {
                    errors,
                    email,
                    password,
                    password2
                });
            } else {
                const formData = req.body;
                console.log('formData', formData);

                const role = req.body.role;
                const prenom = req.body.prenom;
                const email = req.body.email;
                const password = req.body.password;

                const user = new User({
                    role: role, prenom: prenom, email: email, password: password
                });
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(user.password, salt, (err, hash) => {
                        if (err) throw err;
                        user.password = hash;
                        user
                            .save()
                            .then(user => {
                                req.flash(
                                    'success_msg',
                                    'Inscription réussie.'
                                );
                                console.log(user);
                                res.redirect('/gestion-utilisateur');
                            })
                            .catch(err => console.log(err));
                    });
                });
            }
        });
    }
};

exports.getModifUser = (req, res) => {
    if (req.user.role === 'Admin') {
        tabUsers = [];
        User.find({role:"Utilisateur"},(err, users) => {
            if (err) {
                console.error('could note retrieve equipes from DB');
                res.sendStatus(500);
            } else {
                tabUsers = users;
                res.render('modifier-user', {tabUsers: users, user: req.user});
                const user = {user: req.user};
                console.log(user);
            }
        })
    } else {
        res.render('intermediaire', {user: req.user});
    }
};
//  route accès au formulaire de modification //////////////

exports.getModifUserById = (req, res) => {
    if (req.user.role === 'Admin') {
        const id = req.params.id;
        User.findById(id, (err, utilisateur) => {
            console.log('utilisateur', utilisateur);
            res.render('modifier-user-id', {utilisateur: utilisateur, user: req.user})
        });
    }
};


//  formulaire peuplé de modification ///////////////////////
exports.postModifUser = (req, res) => {
        console.log('req.body', req.body);
        if (!req.body) {
            return res.sendStatus(500);
        }
        console.log(
            'prenom', req.body.prenom,
            'email', req.body.email,
        );
        const id = req.params.id;
        User.findByIdAndUpdate(id, {
                $set: {
                    prenom: req.body.prenom,
                    email: req.body.email
                }
            }, {new: true},
            (err, user) => {
                if (err) {
                    console.log(err);
                    return res.send(`l'utilisateur n'a pas pu etre mis a jour`);
                }
                res.redirect('/modifier-user');
            });
    };



//////suppression  //////////////////////
exports.getDeleteUser = (req, res) => {
    if (req.user.role === 'Admin') {
        const id = req.params.id;
        User.findByIdAndRemove(id, (err, equipe) => {
            res.redirect('/modifier-user');
        });
    }
};

