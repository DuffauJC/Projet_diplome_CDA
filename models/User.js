const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    role: String,
    prenom: String,
    email:String,
    password:String,
    date: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

const User = mongoose.model('User', UserSchema);

module.exports = User;