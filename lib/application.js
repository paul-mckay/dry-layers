/* Copyright (c) 2015 Paul McKay
 * 
 * This file is part of the 'dry-layers' package for Node.js and is subject to
 * the terms of the MIT license.  If the license does not accompany this file, 
 * download it from:
 * https://raw.githubusercontent.com/pmckay/dry-layers/master/LICENSE. 
 */

var mongodb = require('mongodb');

var Registry = require('./registry.js')

var Application = function (requestListener) {
      
    var self = this;

    this.connect = function (server, port) {
        mongodb.MongoClient.connect(Registry.getDatabaseUrl(), function (err, res) {
            if (err) {
                if (res) {
                    res.close();
                    res = null;
                }
            }
            Registry.setDatabase(res);
        });
    }
        
    this.getDatabase = function () {
        return Registry.getDatabase();
    }

    this.getDatabaseUrl = function () {
        return Registry.getDatabaseUrl();
    }
    
    this.getRequestListener = function () {
        return _requestListener;
    }
    
    var _requestListener = requestListener;
    
    this.setDatabaseUrl = function (value) {
        Registry.setDatabaseUrl(value);
    }
    
    this.start = function (server, port) {
        mongodb.MongoClient.connect(_databaseUrl, function (err, res) {
            if (err) {
                if (res) {
                    res.close();
                    res = null;
                }
            }
            _database = res;
            server.listen(process.env.PORT || port, function () {
                console.log('Listening on port ' + server.address().port);
            });
        });
    }   
}

module.exports = {
    
    Application : Application

};

