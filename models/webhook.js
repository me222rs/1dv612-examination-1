/*jshint esversion: 6 */

// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var WebhookSchema = new Schema({
  username: { type: String, required: true },
  org: { type: String, required: true },
  webhookID: { type: String, required: true }
});

module.exports = mongoose.model('Webhooks', WebhookSchema);
