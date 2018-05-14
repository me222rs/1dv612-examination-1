/*jshint esversion: 6 */

// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var repository = new Schema({
  org: { type: String, required: true }, //Org name
  repos: { type: Object, required: true }, //Org name
  username: { type: String, required: true } // Username of who wants to listen
});

module.exports = mongoose.model('Repository', repository);
