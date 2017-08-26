Mongoose Timestamps Plugin [![Build Status](https://secure.travis-ci.org/drudge/mongoose-timestamp.png?branch=master)](https://travis-ci.org/drudge/mongoose-timestamp)
==========================

Simple plugin for [Mongoose](https://github.com/LearnBoost/mongoose) which adds `createdAt` and `updatedAt` date attributes
that get auto-assigned to the most recent create/update timestamp.

## Installation

`npm install mongoose-timestamp`

## Usage

```javascript
var timestamps = require('mongoose-timestamp');
var UserSchema = new Schema({
    username: String
});
UserSchema.plugin(timestamps);
mongoose.model('User', UserSchema);
var User = mongoose.model('User', UserSchema)
```
The User model will now have `createdAt` and `updatedAt` properties, which get
automatically generated and updated when you save your document.

```javascript
var user = new User({username: 'Prince'});
user.save(function (err) {
  console.log(user.createdAt); // Should be approximately now
  console.log(user.createdAt === user.updatedAt); // true
  // Wait 1 second and then update the user
  setTimeout( function () {
    user.username = 'Symbol';
    user.save( function (err) {
      console.log(user.updatedAt); // Should be approximately createdAt + 1 second
      console.log(user.createdAt < user.updatedAt); // true
    });
  }, 1000);
});
```
#### findOneAndModify (mongoose >= 4.0.1)

Mongoose 4.0.1 added support for findOneAndModify hooks. You must the mongoose promise exec for the hooks to work as mongoose uses mquery when a callback is passed and the hook system is bypassed.

```javascript
User.findOneAndUpdate({username: 'Prince'}, { password: 'goatcheese' }, { new: true, upsert: true })
            .exec(function (err, updated) {
                console.log(user.updatedAt); // Should be approximately createdAt + 1 second
                console.log(user.createdAt < user.updatedAt); // true
            });
```

You can specify custom property names by passing them in as options like this:

```javascript
mongoose.plugin(timestamps,  {
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
```

Any model's updatedAt attribute can be updated to the current time using `touch()`.

## License

(The MIT License)

Copyright (c) 2012-2016 Nicholas Penree &lt;nick@penree.com&gt;

Based on [mongoose-types](https://github.com/bnoguchi/mongoose-types): Copyright (c) 2012 [Brian Noguchi](https://github.com/bnoguchi)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
