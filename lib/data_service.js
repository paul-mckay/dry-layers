/* Copyright (c) 2015 Paul McKay
 * 
 * This file is part of the 'dry-layers' package for Node.js and is subject to
 * the terms of the MIT license.  If the license does not accompany this file, 
 * download it from:
 * https://raw.githubusercontent.com/pmckay/dry-layers/master/LICENSE. 
 */

var express = require('express');
var mongodb = require('mongodb');

var Registry = require('./registry.js');

var ObjectID = mongodb.ObjectID;

var DataService = function () {
    
    var self = this;
    
    this.connect = function () {
        if (null != Registry.getDatabase()) {
            return;
        }
        if (true == connecting) {
            return;
        }
        connecting = true;
        mongodb.MongoClient.connect(Registry.getDatabaseUrl(), function (err, res) {
            if (err) {
                if (res) {
                    res.close();
                    res = null;
                }
                connecting = false;
                return;
            }
            Registry.setDatabase(res);
            connecting = false;
        });
        setInterval(monitor, 1000);
    }
    
    var connecting = false;
    
    this.createRouter = function (collectionName) {
        if (0 < arguments.length) {
            return createRouter1(collectionName);
        }
        return createRouter0();
    }
    
    var createRouter0 = function () {
        var router = express.Router();
        
        router.get('/collections', function (req, res) {
            Registry.getDatabase().listCollections().toArray(function (err, doc) {
                if (err) {
                    res.status(500).json({ error : err })
                }
                res.json(doc)
            });
        });
        
        router.get('/stats', function (req, res) {
            Registry.getDatabase().stats(function (err, doc) {
                if (err) {
                    res.status(500).json({ error : err })
                    return;
                }
                res.json(doc)
            })
        });
        
        router.get('/collections/:name/stats', function (req, res) {
            var collection = Registry.getCollection(req.params.name);
            collection.stats(function (err, doc) {
                if (err) {
                    res.status(500).json({ error : err })
                    return;
                }
                res.json(doc)
            })
        });
        
        return router;
    }
    
    var createRouter1 = function (collectionName) {
        
        var router = express.Router();
        
        router.delete('/:id', function (req, res) {
            var collection = Registry.getCollection(collectionName);
            collection.remove({ _id : req.params.id }, function (err, doc) {
                if (err) {
                    res.status(500).json({ error : err })
                    return;
                }
                res.json({});
            });
        });
        
        router.get('/', function (req, res) {
            var collection = Registry.getCollection(collectionName);
            collection.find({}, { password : 0 }).toArray(function (err, doc) {
                if (err) {
                    res.status(500).json({ error : err })
                    return;
                }
                res.json(doc);
            });
        });
        
        router.get('/:id', function (req, res) {
            var collection = Registry.getCollection(collectionName);
            collection.findOne({ _id : req.params.id }, { password : 0 }, function (err, doc) {
                if (err) {
                    res.status(500).json({ error : err })
                    return;
                }
                res.json(doc);
            });
        });
        
        router.post('/', function (req, res) {
            var collection = Registry.getCollection(collectionName);
            req.body._id = (new ObjectID()).toString();
            collection.insertOne(req.body, function (err, result) {
                if (err) {
                    res.status(500).json({ error : err })
                    return;
                }
                res.json({});
            });
        });
        
        router.put('/:id', function (req, res) {
            var data = req.body;
            if (data.password === "") {
                delete data.password;
            }
            var collection = Registry.getCollection(collectionName);
            collection.update({ _id : req.params.id }, { $set : req.body }, function (err, result) {
                if (err) {
                    res.status(500).json({ error : err })
                    return;
                }
                res.json({});
            });
        });
        
        return router;
    }
    
    var monitor = function () {
        database = Registry.getDatabase();
        if (null == database) {
            self.connect();
            return;
        }
        database.stats(function (err, res) {
            if (err) {
                database.close();
                Registry.setDatabase(null);
                return;
            }
        })
    }
    
    if (DataService.caller != DataService.getInstance) {
        throw new Error('')
    }
}

DataService.instance = null;

DataService.getInstance = function () {
    if (this.instance == null) {
        this.instance = new DataService();
    }
    return this.instance;
}

module.exports = DataService.getInstance();

