
/**
 * @list dependencies
 **/

var mocha = require('mocha');
var should = require('should');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('../');

mongoose = mongoose.createConnection('mongodb://localhost/mongoose_timestamps')
mongoose.on('error', function (err) {
        console.error('MongoDB error: ' + err.message);
        console.error('Make sure a mongoDB server is running and accessible by this application')
});

var opts = {
	createdAt: {
		name: 'customNameCreatedAt',
		type: String
	},
	updatedAt: {
		name: 'customNameUpdatedAt',
		type: String
	}
};

var CustomizedNameAndTypesTimeCopSchema = new Schema({
	email: String
});
CustomizedNameAndTypesTimeCopSchema.plugin(timestamps, opts);
var CustomizedNameAndTypesTimeCop = mongoose.model('CustomizedNameAndTypesTimeCop', CustomizedNameAndTypesTimeCopSchema);

describe('timestamps custom names and types', function() {
	it('should have the updatedAt field named "' + opts.updatedAt.name + '" with type "String"', function(done) {
		var customCop = new CustomizedNameAndTypesTimeCop({email: 'example@example.com'});
		customCop.save(function (err) {
			customCop.should.have.property(opts.updatedAt.name);
			customCop[opts.updatedAt.name].should.be.a[opts.updatedAt.type];
			done();
		});
	});
	
	it('should have the createdAt field named "' + opts.createdAt.name + '" with type "String"', function(done) {
		var customCop = new CustomizedNameAndTypesTimeCop({email: 'example@example.com'});
		customCop.save(function (err) {
			customCop.should.have.property(opts.createdAt.name);
			customCop[opts.createdAt.name].should.be.a[opts.createdAt.type];
			done();
		});
	});
	
	it('should be set to the same value on creation', function(done) {
		var cop = new CustomizedNameAndTypesTimeCop({ email: 'brian@brian.com' });
		cop.save( function (err) {
			cop[opts.createdAt.name].should.equal(cop[opts.updatedAt.name]);
			done();
		});
	});
	
	it('should have updatedAt greater than createdAt upon updating', function(done) {
		CustomizedNameAndTypesTimeCop.findOne({email: 'brian@brian.com'}, function (err, found) {
			found.email = 'jeanclaude@vandamme.com';
			setTimeout( function () {
				found.save( function (err, updated) {
					updated[opts.updatedAt.name].should.be.above(updated[opts.createdAt.name]);
					done();
				});
			}, 1000);
		});
	});

	after(function() {
                mongoose.close();
        });
});
