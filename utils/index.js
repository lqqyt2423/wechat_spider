'use strict';

function extract(doc, fields) {
  return fields.reduce((obj, key) => {
    const val = doc[key];
    if (val !== undefined) obj[key] = val;
    return obj;
  }, {});
}

exports.extract = extract;
