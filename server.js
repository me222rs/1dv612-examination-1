/*jshint esversion: 6 */
require('dotenv').config();
const fs = require("fs");
const https = require("https");
const hbs = require("express-handlebars");
const slack = require('slack-notify')(process.env.SLACK_WEBHOOK_URL);
const bodyParser    = require("body-parser");
const path          = require("path");
const mongoose = require('mongoose');
const GithubWebHook = require('express-github-webhook');
const octonode      = require("octonode");
const csrf         = require("csurf");
const helmet = require('helmet');

var session = require('express-session');
var Settings = require('./models/settings.js');
var Repository = require('./models/repository.js');
var Notifications = require('./models/notifications.js');

var token;
var express = require("express"),
app = express(),
port = 3000;

var server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});

/*var server = https.createServer({
key: fs.readFileSync("./config/sslcerts/key.pem"),
cert: fs.readFileSync("./config/sslcerts/cert.pem")
}, app).listen(port, function() {
console.log("Express started on https://localhost:" + port);
console.log("Press Ctrl-C to terminate...");
});*/

var io = require("socket.io")(server);

//Checking if database connection works, move to app.js later
mongoose.connect('mongodb://localhost/githubapp');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to database");
});

var github = GithubWebHook({path: '/webhook', secret: process.env.GITHUB_SECRET});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(express.static(__dirname + '/public'));
app.use('/static', express.static(path.join(__dirname, '/public')));
//app.use(session({secret: 'ssshhhhh'}));
app.use(session({
  name:   "githubapp",
  secret: "ssshhhhh",
  saveUninitialized: false,
  resave: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 60*60*24*1000 //24h
  }
}));
app.set('github', github);
app.use(github);

app.engine('handlebars', hbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(helmet());

app.use(csrf());

app.use(function(req, res, next){
  res.locals.csrfToken = req.csrfToken();
  next();
});
//CSRF error handling
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN'){
    return next(err);
  }
  res.status(403).render("403", {message: "You are not allowed to do that! Token is not valid!", link: "/login", linkName:"Log in"});
});
var noti = require("./routes/notifications.js");
noti.startNotifications(app, io);
app.use("/", require("./routes/home.js"));
app.use("/", require("./routes/login.js"));
app.use("/", require("./routes/callback.js"));
app.use("/", require("./routes/slack.js"));
//app.use("/", require("./routes/notifications.js"));
app.use("/webhook", require("./routes/payload.js"));

app.use(function(req, res, next) {
  res.locals.flash = req.session.flash;
  delete req.session.flash;

  next();
});
