const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const equipeController = require('./controllers/equipeController');
const userController = require('./controllers/userController');
const multer = require('multer');
const upload = multer();


// Passport Config
require('./config/passport')(passport);


const {ensureAuthenticated} = require('./config/auth');

// Mongodb connect
require('./config/connect');



// Middleware d'express pour utliser fichier static
app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


// Moteur de express.js
app.set('views', './views');
app.set('view engine', 'ejs');
////////////////////////////////////////////////////

// Express session
app.use(
    session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

/////////////////////////////////////////////////


// Les routes ////////////////////////////////////////////////////////
// create application/x-www-form-urlencoded parser
let urlencodedParser = bodyParser.urlencoded({extended: false});

//  formulaire post  ( equipe )///////////////////////////////

app.post('/edition',  equipeController.postEquipe);

// route pour liste à modifer ou supprimer /////////////////////////

app.get('/modifier', ensureAuthenticated, equipeController.getModifEquipe);


//  route accès au formulaire de modification //////////////

app.get('/modifier/:id', ensureAuthenticated, equipeController.getModifEquipeById);


//  formulaire peuplé de modification ///////////////////////
app.post('/modifier/:id', ensureAuthenticated, urlencodedParser, equipeController.postModifEquipe);

// Verif modification/////////////////////////
app.get('/verification-detail/:id', ensureAuthenticated, equipeController.getVerifById);

//////suppression  //////////////////////
app.get('/delete/:id', ensureAuthenticated, equipeController.getDeleteEquipe);

app.get('/delete_image/:id', ensureAuthenticated, equipeController.getDeleteImageModifier);
////////////////////////////////////////////////////////

app.get('/edition', ensureAuthenticated, equipeController.getEdition);

app.get('/equipes/:id', equipeController.getDetailEquipe);


// Welcome Page
app.get('/', equipeController.getEquipes);

///////////////////////// Routes user ////////////////

app.get('/inscription_des_agilistes_du_club', userController.getInscription);

//!\ In upload.fields([]), the empty array '[]' is required
app.post('/inscription', upload.fields([]), userController.postInscription);


app.get('/login', userController.getLogin);

app.post('/login', userController.postLogin);

app.get('/intermediaire', ensureAuthenticated, userController.getIntermediaire);

app.get('/backoffice', ensureAuthenticated, userController.getBackOffice);


/////Mot de passe oublié/////////////////
app.get('/forgot', userController.getForgot);

app.post('/forgot', userController.postForgot);


//////Recup nouveau mdp//////////////
app.get('/reset/:token', userController.getReset);

app.post('/reset/:token', userController.postReset);


// Logout
app.get('/logout', userController.getLogout);


///  Admin ////

app.get('/admin', ensureAuthenticated, userController.getAdmin);

app.get('/gestion-equipe', ensureAuthenticated, equipeController.getGesEquipe);

app.get('/admin_delete/:id', ensureAuthenticated, equipeController.getDeleteEquipeAdmin);

app.get('/gestion-equipe-detail/:id', ensureAuthenticated, equipeController.getGesEquipeDetail);

app.get('/gestion-utilisateur', ensureAuthenticated, userController.getGesUtilisateur);

app.get('/Admin-inscription-user', ensureAuthenticated, userController.getEditUser);

app.post('/Admin-inscription-user', upload.fields([]), userController.postInsUser);

app.get('/modifier-user', ensureAuthenticated, userController.getModifUser);

app.get('/modifier-user/:id', ensureAuthenticated, userController.getModifUserById);

app.post('/modifier-user/:id', upload.fields([]), urlencodedParser, userController.postModifUser);

//////suppression  //////////////////////
app.get('/delete-user/:id', ensureAuthenticated, userController.getDeleteUser);


// Ecoute du serveur///////////////////////////////////////
let port = process.env.PORT;
if (port == null || port === "") {
    port = 8000;
}
app.listen(port);
