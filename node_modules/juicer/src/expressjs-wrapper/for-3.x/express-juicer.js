var juicer = require('juicer');
var fs = require('fs');

exports.__express = function(path, options, fn){
    fs.readFile(path, 'utf8', function(err, str){
        if (err) return fn(err);
        str = juicer(str, options);
        fn(null, str);
    });
};

/*
 * Usage:
 *
 * var juicer = require('express-juicer');
 * app.set('view engine', 'html');
 * app.engine('html', juicer.__express);
 *
 * */
