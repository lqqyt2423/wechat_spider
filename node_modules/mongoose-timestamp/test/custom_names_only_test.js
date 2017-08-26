
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

var opts = {createdAt: 'customNameCreatedAt', updatedAt: 'customNameUpdatedAt'};

var CustomizedNameOnlyTimeCopSchema = new Schema({
	email: String
});
CustomizedNameOnlyTimeCopSchema.plugin(timestamps, opts);

var CustomizedNameOnlyTimeCop = mongoose.model('CustomizedNameOnlyTimeCop', CustomizedNameOnlyTimeCopSchema);

describe('timestamps custom names only', function() {
	it('should have the updatedAt field named "' + opts.updatedAt + '" with type "Date"', function(done) {
		var customCop = new CustomizedNameOnlyTimeCop({email: 'example@example.com'});
		customCop.save(function (err) {
			customCop.should.have.property(opts.updatedAt);
			customCop[opts.updatedAt].should.be.a.Date;
			done();
		});
	});
	
	it('should have the createdAt field named "' + opts.createdAt + '" with type "Date"', function(done) {
		var customCop = new CustomizedNameOnlyTimeCop({email: 'example@example.com'});
		customCop.save(function (err) {
			customCop.should.have.property(opts.createdAt);
			customCop[opts.createdAt].should.be.a.Date;
			done();
		});
	});
	
	it('should be set to the same value on creation', function(done) {
		var cop = new CustomizedNameOnlyTimeCop({ email: 'brian@brian.com' });
		cop.save( function (err) {
			cop[opts.createdAt].should.equal(cop[opts.updatedAt]);
			done();
		});
	});
	
	it('should have updatedAt greater than createdAt upon updating', function(done) {
		CustomizedNameOnlyTimeCop.findOne({email: 'brian@brian.com'}, function (err, found) {
			found.email = 'jeanclaude@vandamme.com';
			setTimeout( function () {
				found.save( function (err, updated) {
					updated[opts.updatedAt].should.be.above(updated[opts.createdAt]);
					done();
				});
			}, 1000);
		});
	});
	
	after(function() {
                mongoose.close();
        });
});
