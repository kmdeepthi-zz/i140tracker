var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserCaseSchema = new Schema({
    receipt: String,
    email: String,
    phone: String,
    statusTitle: String,
    statusBody: String
});

module.exports = mongoose.model('UserCase', UserCaseSchema);