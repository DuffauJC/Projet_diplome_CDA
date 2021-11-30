const mongoose = require('mongoose');

//Connexion à mongoodb avec mongoose
mongoose.connect('mongodb+srv://xxxxxxx@xxxxxxxx-fxio2.azure.mongodb.net/xxxxx?retryWrites=true', {useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: Impossible de se connecter à la DB.'));
db.once('open', () => {
    console.log('Connexion réussie !!')// we're connected!
});