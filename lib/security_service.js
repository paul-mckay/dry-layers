﻿/* Copyright (c) 2015 Paul McKay
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
    
    this.authenticated = function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        var url = '/sign_in?url=' + encodeURIComponent(req.originalUrl);
        res.redirect(url);
    }

    this.createRouter = function () {
        
        var router = express.Router();
        
        router.get('/sign_in', function (req, res) {
            if (!req.query.url) {
                res.send("400", "Bad request");
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
                    res.send("401", "Unauthorized");
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
                    return done(null, user);
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
        
        passport.serializeUser(function (user, done) {
            done(null, user._id);
        });
        
        passport.deserializeUser(function (id, done) {
            var users = Registry.getCollection('user');
            users.findOne({ _id : id }, function (err, user) {
                done(err, user);
            });
        });
                      
        this.instance = new SecurityService();
    }
    return this.instance;
}

SecurityService.instance = null;

module.exports = SecurityService.getInstance();