var Server = require('./').Server
  , bson = require('bson');

// Attempt to connect
var server = new Server({
    host: 'localhost'
  , port: 27017
  , size: 10
  , bson: new bson()
});

// Add event listeners
server.on('connect', function(server) {
  var db = 'develop';

  const cmd = {
    "find": "develop.user",
    "filter": {
      "$or": [
        { "provider": "google", "providerData.id": "placeholder" },
        { "additionalProvidersData.google.id": "placeholder" },
        { "email": "placeholder" }
      ]
    },
    "limit": 1,
    "projection": {},
    "sort": {}
  };
  
  server.command("develop.$cmd", cmd, {}, (err, response) => {
    console.log(err, response);
  });
});

server.connect();
