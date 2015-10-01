/* Copyright (c) 2015 Paul McKay
 *
 * This file is part of the 'dry-layers' package for Node.js and is subject to
 * the terms of the MIT License.  If a copy of the license was not distributed 
 * with this file, you can get one at:
 * https://raw.githubusercontent.com/pmckay/dry-layers/master/LICENSE. 
 */

var express = require('express');
var mongodb = require('mongodb');
var passport = require('passport');

var LocalStrategy = require('passport-local').Strategy;
var Registry = require('./registry.js');
var Renderer = require('./renderer.js');

var SecurityService = function () {
    
    var self = this;
    
    var authenticate1 = function (strategy) {
        var base = base = '/sign_in';
        if (strategy) {
            base = base + '/' + strategy;
        }
        base = base + '?url=';
        return function (req, res, next) {
            if (req.isAuthenticated()) {
                return next();
            }
            url = base + encodeURIComponent(req.originalUrl);
            res.redirect(url);
        }
    }
    
    this.authenticate = function (strategy) {
        return [connect3,
            authenticate1(strategy)];
    }
    
    var authorize1 = function (spec) {
        return function (req, res, next) {
            if (!spec(req)) {
                res.status(401);
                res.send('Unauthorized');
                return;
            }
            next();
        }
    }
    
    this.authorize = function (strategy, spec) {
        return [connect3,
            authenticate1(strategy),
            authorize1(spec)];
    }
    
    var connect3 = function (req, res, next) {
        if (null != Registry.getDatabase()) {
            return next();
        }
        err = new Error('Cannot connect to database.');
        res.status(500);
        res.render('error', {
            message: err.message,
            error: err
        });
    }
    
    this.connect = function () {
        return connect3;
    }
    
    this.createRouter = function () {
        
        var router = express.Router();
        
        router.get('/users/signed_in', function (req, res) {
            if (!req.user) {
                res.status(404);
                res.send("Not Found");
                return;
            }
            res.json(req.user);
        });
        
        router.get('/users/signed_in/avatar', function (req, res) {
            if (!req.user) {
                res.status(404);
                res.send("Not Found");
                return;
            }
            sendImage(res, req.user.avatar);
        });
        
        router.get('/users/:id/avatar', function (req, res) {
            
            var collection = Registry.getCollection('user');
            collection.findOne({ _id : req.params.id }, { avatar : 1 }, function (err, doc) {
                if (err) {
                    res.status(500).json({ error : err })
                    return;
                }
                if (doc) {
                    sendImage(res, doc.avatar);
                    return;
                }
                var collection = Registry.getCollection('meeting');
                collection.findOne({ 'users._id' : req.params.id }, { 'users.$' : 1 }, function (err, doc) {
                    if (err) {
                        res.status(500);
                        res.json({ error : err });
                        return;
                    }
                    sendImage(res, doc.users[0].avatar);
                });
            });
        });
        
        router.get('/sign_in', function (req, res) {
            if (!req.query.url) {
                res.status(400);
                res.send("Bad request");
                return;
            }
            var html = Renderer.render('views/sign_in.jade', {
                title : 'Sign In',
                url : req.query.url
            });
            res.send(html);
        });
        
        router.get('/sign_out', function (req, res) {
            var html = Renderer.render('views/sign_out.jade', {
                title : 'Sign Out'
            });
            res.send(html);
        });
        
        router.post('/sign_in', function (req, res, next) {
            passport.authenticate('local', function (err, user, info) {
                if (err) {
                }
                if (!user) {
                    res.send(401);
                    res.send("Unauthorized");
                    return;
                }
                req.logIn(user, function (err) {
                    if (err) {
                    }
                    res.json({});
                });
            })(req, res, next);
        });
        
        router.post('/sign_out', function (req, res) {
            req.logOut();
            res.json({});
        });
        
        router.put('/users/signed_in', function (req, res) {
            var user = req.user;
            if (!user.meeting) {
                res.json({});
                return;
            }
            var meeting = user.meeting;
            var data = req.body;
            if (data.password === "") {
                delete data.password;
            }
            var collection = Registry.getCollection('meeting');
            collection.updateOne({ _id: meeting._id, 'users._id' : user._id }, {
                $set: {
                    'users.$.pseudonym' : data.pseudonym,
                    'users.$.avatar' : data.avatar
                }
            }, function (err, result) {
                if (err) {
                    res.status(500);
                    res.json({ error : err });
                    return;
                }
                res.json({});
            });
        });
        
        var sendImage = function (res, dataUrl) {
            var regex = /^data:(.+\/.+);base64,(.*)$/;
            var matches = dataUrl.match(regex);
            var type = matches[1];
            var data = matches[2];
            res.writeHead(200, { 'Content-Type': type });
            var buffer = new Buffer(data, 'base64');
            res.end(buffer, 'binary');
        }
        
        return router;
    }
    
    this.createStrategy = function () {
        
        return new LocalStrategy({
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true
        }, function (req, username, password, done) {
            process.nextTick(function () {
                var users = Registry.getCollection('user');
                users.findOne({ username: username }, function (err, user) {
                    if (err) {
                        return done(err);
                    }
                    if (!user) {
                        return done(null, false, { message: 'Unknown user ' + username });
                    }
                    if (user.password != password) {
                        return done(null, false, { message: 'Invalid password' });
                    }
                    return done(null, {
                        user : user, 
                        meeting : null
                    });
                });
            });
        });
    }
    
    if (SecurityService.caller != SecurityService.getInstance) {
        throw new Error('')
    }
}

SecurityService.getInstance = function () {
    if (this.instance == null) {
        
        passport.serializeUser(function (authenticated, done) {
            var serialized = {
                user : authenticated.user._id,
                meeting : null
            };
            if (authenticated.meeting) {
                serialized.meeting = authenticated.meeting._id;
            }
            done(null, serialized);
        });
        
        passport.deserializeUser(function (serialized, done) {
            if (serialized.meeting) {
                var meetings = Registry.getCollection('meeting');
                meetings.findOne({
                    _id : serialized.meeting
                }, {
                    name : 1, 
                    location : 1,
                    users : { $elemMatch: { _id: serialized.user } }
                }, function (err, meeting) {
                    var user = meeting.users[0];
                    delete meeting.users;
                    user.meeting = meeting;
                    done(err, user);
                });
                return;
            }
            var users = Registry.getCollection('user');
            users.findOne({ _id : serialized.user }, { password : 0 }, function (err, user) {
                done(err, user);
            });
        });
        
        this.instance = new SecurityService();
    }
    return this.instance;
}

SecurityService.instance = null;

module.exports = SecurityService.getInstance();