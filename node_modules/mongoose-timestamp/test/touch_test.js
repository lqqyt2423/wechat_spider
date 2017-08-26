
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

var UserSchema = new Schema({
  email: String
})

UserSchema.plugin(timestamps)
var User = mongoose.model('User', UserSchema)

describe('User Schema', function(){
  it('should have the method touch', function(){
    UserSchema.methods.hasOwnProperty('touch').should.equal(true)
  })
})

describe('timestamp',function(){
  it('should be updated on calling the method touch', function(done){
    var user = new User({email: "tyrion.lannister@westeros.com"})
    var past = undefined
    user.save(function (err) {
      past = user.updatedAt
    });
    setTimeout(function(){
      user.touch(function(){
        user.updatedAt.should.above(past)
        done()
      }) 
    },1500)
  })

    after(function() {
        mongoose.close();
    });
})


