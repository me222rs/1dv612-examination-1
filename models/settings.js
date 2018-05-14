/*jshint esversion: 6 */

// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var settings = new Schema({
  org: { type: String, required: true }, //Org name
  push: { type: String, required: false }, //Wants to listen to push event
  issue: { type: String, required: false }, //Wants to listen to issue event
  repository: { type: String, required: false }, //Wants to listen to issue event
  release: { type: String, required: false }, //Wants to listen to issue event
  username: { type: String, required: true } // Username of who wants to listen
});

module.exports = mongoose.model('Settings', settings);
