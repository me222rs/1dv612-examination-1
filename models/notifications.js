/*jshint esversion: 6 */

// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var notifications = new Schema({
  date: { type: Date, required: true, default: Date.now }, //Org name
  message: { type: String, required: true }, //Org name
  username: { type: String, required: true }
});

module.exports = mongoose.model('Notifications', notifications);
