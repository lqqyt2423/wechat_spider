/*!
 * Mongoose Timestamps Plugin
 * Copyright(c) 2012 Nicholas Penree <nick@penree.com>
 * Original work Copyright(c) 2012 Brian Noguchi
 * MIT Licensed
 */

var defaults = require('defaults');

function timestampsPlugin(schema, options) {
    var updatedAt = 'updatedAt';
    var createdAt = 'createdAt';
    var updatedAtOpts = Date;
    var createdAtOpts = Date;
    var dataObj = {};

    if (typeof options === 'object') {
        if (typeof options.updatedAt === 'string') {
           updatedAt = options.updatedAt;
        } else if (typeof options.updatedAt === 'object') {
            updatedAtOpts = defaults(options.updatedAt, {
                name: updatedAt,
                type: Date
            });
            updatedAt = updatedAtOpts.name;
        }

        if (typeof options.createdAt === 'string') {
            createdAt = options.createdAt;
        } else if (typeof options.createdAt === 'object') {
            createdAtOpts = defaults(options.createdAt, {
                name: createdAt,
                type: Date
            });
            createdAt = createdAtOpts.name;
        }
    }

    dataObj[updatedAt] = updatedAtOpts;

    if (schema.path(createdAt)) {
	schema.add(dataObj);
	schema.virtual(createdAt)
	    .get( function () {
		if (this["_" + createdAt]) return this["_" + createdAt];
		return this["_" + createdAt] = this._id.getTimestamp();
	    });
	schema.pre('save', function (next) {
	    if (this.isNew) {
		this[updatedAt] = this[createdAt];
	    } else if (this.isModified()) {
		this[updatedAt] = new Date;
	    }
	    next();
	});

    } else {
	dataObj[createdAt] = createdAtOpts;
	schema.add(dataObj);
	schema.pre('save', function (next) {
	    if (!this[createdAt]) {
		this[createdAt] = this[updatedAt] = new Date;
	    } else if (this.isModified()) {
		this[updatedAt] = new Date;
	    }
	    next();
	});
    }

    schema.pre('findOneAndUpdate', function (next) {
	if (this.op === 'findOneAndUpdate') {
	    this._update = this._update || {};
	    this._update[updatedAt] = new Date;
	    this._update['$setOnInsert'] = this._update['$setOnInsert'] || {};
	    this._update['$setOnInsert'][createdAt] = new Date;
	}
	next();
    });

    schema.pre('update', function(next) {
	if (this.op === 'update') {
	    this._update = this._update || {};
	    this._update[updatedAt] = new Date;
	    this._update['$setOnInsert'] = this._update['$setOnInsert'] || {};
	    this._update['$setOnInsert'][createdAt] = new Date;
	}
	next();
    });

    if(!schema.methods.hasOwnProperty('touch'))
	schema.methods.touch = function(callback){
	    this[updatedAt] = new Date;
	    this.save(callback)
	}

}

module.exports = timestampsPlugin;
