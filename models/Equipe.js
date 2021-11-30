const mongoose = require('mongoose');

//Schéma de la table Equipes
const equipeSchema = new mongoose.Schema({
    nom: String,
    toutou: String,
    race: String,
    sexe: String,
    maitre: String,
    naissance: String,
    couleur: String,
    victoires: String,
    podiums: String,
    comment: String,
    userId:String,
    image_url:String,
    image_key:String
});

module.exports = mongoose.model('Equipe', equipeSchema);