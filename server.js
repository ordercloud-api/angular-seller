'use strict';
var config = require('./gulp.config');

var express = require('express'),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'dev',
    app = express(),
    enforce = require('express-sslify'),
    port = process.env.PORT || 7203,
    bodyParser = require('body-parser');

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization, Administrator, dc-token, Identity, environment");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, PATCH, DELETE, OPTIONS");
    //res.header("Access-Control-Allow-Headers", "*");
    next();
});

if (process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'prod') {
    app.use(enforce.HTTPS({trustProtoHeader: true}))
}

app.use(bodyParser.json({limit: '50mb'}));

app.use('/api/*', require('./middleware/middleware'));
app.use('/api/upload', require('./routes/upload'));

//switch(env) {
if (env.toLowerCase().includes('prod')) {
    console.log('*** PROD ***');
    app.use(express.static(config.root + config.compile.replace('.', '')));
    app.get('/*', function(req, res) {
        res.sendFile(config.root + config.compile.replace('.', '') + 'index.html');
    });
    //break;
}
else {
    console.log('*** DEV ***');
    // Host bower_files
    app.use('/bower_files', express.static(config.root + config.bowerFiles.replace('.', '')));
    // Host unminfied javascript files
    app.use(express.static(config.root + config.build.replace('.', '')));
    // Host unchanged html files
    app.use(express.static(config.root + config.src.replace('.', '') + 'app/'));
    app.get('/*', function(req, res) {
        res.sendFile(config.root + config.build.replace('.', '') + 'index.html');
    });
    //break;
}
//}

app.listen(port);
console.log('Listening on port ' + port + '...');