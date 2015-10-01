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
var ObjectID = mongodb.ObjectID;
var Registry = require('./registry.js');
var Renderer = require('./renderer.js');

var MeetingService = function () {
	
	var self = this;
	
	this.createRouter = function () {
		
		var router = express.Router();
						
		router.get('/sign_in/meeting', function (req, res) {
			if (!req.query.url) {
				res.send(400);
				rese.send("Bad request");
				return;
			}
			var html = Renderer.render('views/meeting_sign_in.jade', {
				title : 'Meeting Sign In',
				url : req.query.url
			});            
			res.send(html);
		});
			   
		router.post('/sign_in/meeting', function (req, res, next) {
			passport.authenticate('meeting', function (err, user, info) {
				if (err) {
				}
				if (!user) {
					res.status(401);
					res.send('Unauthorized');
					return;
				}
				req.logIn(user, function (err) {
					if (err) {
					}
					res.json({});
				});
			})(req, res, next);
		});
		
		return router;
	}
	
	this.createStrategy = function () {
		
		return new LocalStrategy({
			usernameField : 'meeting',
			passwordField : 'password',
			passReqToCallback : true
		}, function (req, meeting, password, done) {
			process.nextTick(function () {
				var meetings = Registry.getCollection('meeting');
				meetings.findOne({ _id: meeting }, function (err, meeting) {
					if (err) {
						return done(err);
					}
					if (!meeting) {
						return done(null, false, { message: 'Unknown meeting ' + meeting });
					}
					if (meeting.password != password) {
						return done(null, false, { message: 'Invalid password' });
					}
					user = self.createUser();
					if (!meeting.users) {
						meeting.users = [];
					}
					meeting.users.push(user);
					meetings.update({ _id : meeting._id }, { $set : meeting }, function (err, result) {
						if (err) {
							return done(null, false, { message: 'Cannot update meeting' });
						}
						return done(null, {
							user : user, 
							meeting : meeting
						});
					});                             
				});
			});
		});
	}
	
	this.createUser = function () {
		return {
			_id : (new ObjectID()).toString(),
			username : '',
			roles : ['User']
		}      
	}
	
	if (MeetingService.caller != MeetingService.getInstance) {
		throw new Error('')
	}
}

MeetingService.getInstance = function () {
	if (this.instance == null) {
		this.instance = new MeetingService();
	}
	return this.instance;
}

MeetingService.instance = null;

module.exports = MeetingService.getInstance();