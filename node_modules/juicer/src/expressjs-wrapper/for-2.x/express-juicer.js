var juicer = require('juicer');

exports.compile = function(str, options) {
    return juicer.compile(str, options).render;
};

/*
 * Usage:
 *
 * var juicer = require('express-juicer');
 * app.set('view engine', 'html');
 * app.register('.html', juicer);
 *
 * */
