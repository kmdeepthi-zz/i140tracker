var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
var mongoose = require('mongoose');
var Router = require('../app/routes');
var path = require('path');

var port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var dbURI = 'mongodb://localhost/ConnectionTest140';
mongoose.connect(dbURI);
mongoose.connection.on('connected', function () {
    console.log('Mongoose default connection open to ' + dbURI);
});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});

process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use('/api', Router);

app.listen(port, function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log('Magic happens on port: ' + port);
    }
});

exports = module.exports = app;