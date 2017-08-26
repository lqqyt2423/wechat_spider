
/**
 * @list dependencies
 **/

var mocha = require('mocha');
var should = require('should');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('../');
var request = require('request');
var mongoosastic = require('mongoosastic');

mongoose = mongoose.createConnection('mongodb://localhost/mongoose_timestamps')
mongoose.on('error', function (err) {
        console.error('MongoDB error: ' + err.message);
        console.error('Make sure a mongoDB server is running and accessible by this application')
});

var opts = {
	createdAt: {
		name: 'customNameCreatedAt',
		type: String,
		index: true
	},
	updatedAt: {
		name: 'customNameUpdatedAt',
		type: String,
		es_indexed: true
	}
};

var CustomizedTypeOptionsTimeCopSchema = new Schema({
	email: String
});

CustomizedTypeOptionsTimeCopSchema.plugin(timestamps, opts);
CustomizedTypeOptionsTimeCopSchema.plugin(mongoosastic);

var CustomizedTypeOptionsTimeCop = mongoose.model('CustomizedTypeOptionsTimeCop', CustomizedTypeOptionsTimeCopSchema);

describe('timestamps custom names and types with options', function() {
	it('should create an index when passed in the createdAt options', function(done) {
		CustomizedTypeOptionsTimeCop.collection.getIndexes(function(err, res) {
			var idx = res[opts.createdAt.name + '_1'];
			idx.should.be.an.Array().with.length(1);
			var comp = idx[0];
			comp.should.be.an.Array().with.length(2);
			comp[0].should.equal(opts.createdAt.name);
			done();
		});
	});

	it('should create an elastic search index when passed es_indexed = true', function(done) {
		var checkElastic = function() {
			request({
				url: 'http://127.0.0.1:9200/customizedtypeoptionstimecops',
				json: true
			}, function(err, res, body) {
				if (err) return done(err);
				body.should.have.a.property('customizedtypeoptionstimecops');
				body.customizedtypeoptionstimecops.should.have.a.property('mappings');
				body.customizedtypeoptionstimecops.mappings.should.have.a.property('customizedtypeoptionstimecop');
				body.customizedtypeoptionstimecops.mappings.customizedtypeoptionstimecop.should.have.a.property('properties');
				body.customizedtypeoptionstimecops.mappings.customizedtypeoptionstimecop.properties.should.have.a.property(opts.updatedAt.name);
				done();
			});
		};
		var customCop = new CustomizedTypeOptionsTimeCop({email: 'example@example.com'});
		customCop.save(function() {
			customCop.on('es-indexed', checkElastic);
		});
	});

	after(function() {
		mongoose.close();
	});
});
