    var Server = require('../../../lib/topologies/server')
      , bson = require('bson');

    // Attempt to connect
    var server = new Server({
        host: configuration.host
      , port: configuration.port
      , size: 10
      , bson: new bson()
    });

    // Add event listeners
    server.on('connect', function(server) {
      var db = 'develop';
  
      const cmd = {
        "find": "user",
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
      
      server.command(db + ".$cmd", cmd, {}, (err, response) => {
        console.log(err, response);
      });
    });

