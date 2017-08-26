
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

var TimeCopSchema = new Schema({
    email: String,
    nemesis: { type: String, default: 'brian' }
});
TimeCopSchema.plugin(timestamps);
var TimeCop = mongoose.model('TimeCop', TimeCopSchema);

describe('update', function() {
    it('should have updatedAt greater than or equal to createdAt upon updating', function(done) {
	TimeCop.update({email:  'stewie@familyguysmatter.com'}, { $set: { nemesis: 'dave' } }, { upsert: false })
	    .exec(function (err, updated) {
		TimeCop.findOne({email:  'stewie@familyguysmatter.com'}, function(err, update) {

		    update.updatedAt.should.not.be.below(updated.createdAt);
		    
		    done();
		});
	    });
    })

    after(function() {
	mongoose.close();
    });
})
