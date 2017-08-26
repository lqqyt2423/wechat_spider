
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
    nemesis: String
});
TimeCopSchema.plugin(timestamps);
var TimeCop = mongoose.model('TimeCop', TimeCopSchema);

describe('timestamps', function() {
  it('should be set to the same value on creation', function(done) {
    var cop = new TimeCop({ email: 'brian@brian.com' });
    cop.save( function (err) {
      cop.createdAt.should.equal(cop.updatedAt);
      done();
    });
  })
  
  it('should have updatedAt greater than createdAt upon updating', function(done) {
    TimeCop.findOne({email: 'brian@brian.com'}, function (err, found) {
      found.email = 'jeanclaude@vandamme.com';
      setTimeout( function () {
        found.save( function (err, updated) {
          updated.updatedAt.should.be.above(updated.createdAt);
          done();
        });
      }, 1000);
    });
  })

  after(function() {
      mongoose.close();
  });
})
