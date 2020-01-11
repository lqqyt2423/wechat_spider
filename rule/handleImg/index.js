'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../../config');

const img = fs.readFileSync(path.join(__dirname, 'replaceImg.png'));

module.exports = function () {
  if (!config.rule.isReplaceImg) return;
  return {
    response: {
      statusCode: 200,
      header: { 'content-type': 'image/png' },
      body: img
    }
  };
};
