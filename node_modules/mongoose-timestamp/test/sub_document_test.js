
/**
 * @list dependencies
 **/

var mocha = require('mocha');
var should = require('should');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('../');

mongoose.Promise = global.Promise || mongoose.Promise;

mongoose = mongoose.createConnection('mongodb://localhost/mongoose_timestamps')
mongoose.on('error', function (err) {
        console.error('MongoDB error: ' + err.message);
        console.error('Make sure a mongoDB server is running and accessible by this application')
});

var SubDocumentSchema = new Schema({
  message: String
});
SubDocumentSchema.plugin(timestamps);

var TimeCopWithSubDocsSchema = new Schema({
  email: String,
  subDocs: [SubDocumentSchema]
});
TimeCopWithSubDocsSchema.plugin(timestamps);
var TimeCopWithSubDocs = mongoose.model('TimeCopWithSubDocs', TimeCopWithSubDocsSchema);

describe('sub document timestamps', function() {
  before(function (done) {
    TimeCopWithSubDocs.collection.remove(done);
  });
  it('should be set to the same value on creation', function(done) {
    var cop = new TimeCopWithSubDocs({ email: 'brian@brian.com' });
    cop.subDocs.push(cop.subDocs.create({message: 'Message from the future'}));
    cop.subDocs.push(cop.subDocs.create({message: 'Don\'t trust Fielding'}));
    cop.save( function (err) {
      if (err) return done(err);
      cop.subDocs.forEach(function (subDoc) {
        subDoc.createdAt.should.eql(subDoc.updatedAt);
      });
      done();
    });
  });

  it('should not have updatedAt change if parent was updated but not sub document', function(done) {
    TimeCopWithSubDocs.findOne({email: 'brian@brian.com'}, function (err, found) {
      found.email = 'jeanclaude@vandamme.com';
      setTimeout( function () {
        found.save( function (err, updated) {
          updated.updatedAt.should.be.above(updated.createdAt);
          updated.subDocs.forEach(function (subDoc) {
            subDoc.createdAt.should.eql(subDoc.updatedAt);
          });
          done();
        });
      }, 1000);
    });
  });

  it('should have updatedAt greater than createdAt if sub document was updated', function(done) {
    TimeCopWithSubDocs.findOne({email: 'jeanclaude@vandamme.com'}, function (err, found) {
      found.subDocs[1].message = 'Don\'t trust McComb';
      var lastUpdated = found.updatedAt;
      setTimeout( function () {
        found.save( function (err, updated) {
          updated.updatedAt.should.be.above(lastUpdated);
          var subDocs = updated.subDocs;
          subDocs[0].updatedAt.should.eql(subDocs[0].createdAt);
          subDocs[1].updatedAt.should.be.above(subDocs[1].createdAt);
          done();
        });
      }, 1000);
    });
  });

    after(function() {
        mongoose.close();
    });
});
