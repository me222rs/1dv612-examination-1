/*jshint esversion: 6 */
const router = require("express").Router();
const express       = require("express");
const octonode      = require("octonode");
const github        = require("github");
const request        = require("request");
const slack_invite = require('slack-invite');
var User = require('../models/user.js');
var Settings = require('../models/settings.js');
var xss = require("xss");


router.route("/invite")
.get((req, res) => {
  console.log("Invite");
  console.log("login: "+req.app.get("loggedIn"));
  console.log(typeof req.app.get("loggedIn"));
  if(typeof req.session.currentUser === 'undefined' || typeof req.app.get("loggedIn") === 'undefined' || req.app.get("loggedIn") === ""){
    res.status(403).render("403", {message: "You have to be logged in! ", link: "/login", linkName:"Login"});
  }else {
    res.render("webhook/invite", {csrfToken: req.csrfToken()});

  }
});

router.route("/verify")
.post((req, res) => {
  if(typeof req.session.currentUser !== 'undefined'){
    console.log("Verify");
    var githubAPI = req.app.get("githubAPI");
    let options = {
      uri: "https://slack.com/api/users.list?token=xoxp-145387390258-145318695331-151381671286-2ced33f388aedbbd83ace3ada48b17de",
      method: "POST",
      headers: {},
      json: true,
      //body: {token: "xoxp-145387390258-145318695331-151381671286-2ced33f388aedbbd83ace3ada48b17de"}
    };

    request(options, function (err, res, body) {
      //var email;
      var slackname;
      githubAPI.getCurrentUser().then(currentUser => {

        User.find({ username: currentUser.login }, function(err, user){
          console.log(user);
          //email = user.email;

          for(var i = 0; i < body.members.length; i++){

            if(body.members[i].profile.email === user[0].email){
              console.log("Inne i loop: "+user.email);
              slackname = body.members[i].name;
            }
          }

          //githubAPI.getCurrentUser().then(currentUser => {
          console.log("Slackname:"+slackname);
          User.findOneAndUpdate({ username: currentUser.login }, { slackUsername: slackname }, function(err, user){
            if(user.length > 0)
            req.session.flash = {type: "success", text: "Slack user found and saved!"};
            else {
              req.session.flash = {type: "fail", text: "Slack user was not found, please accept the invite!"};
            }
            console.log(user);
            console.log("Email saved!");
          });
          //});
        });
      });
    });

    res.redirect("/orgs");
  }else {
    res.status(403).render("403", {message: "You have to be logged in! ", link: "/login", linkName:"Login"});
  }
});

router.route("/slack")
.post((req, res) => {
  if(typeof req.session.currentUser !== 'undefined'){
    var githubAPI = req.app.get("githubAPI");
    githubAPI.getCurrentUser().then(currentUser => {

      console.log(req.body.email);
      //TODO Skicka email till slack api för invite
      slack_invite({
        email: req.body.email, // set your email to invite here
        channels: 'C49E09A9K', // set your auto joined channels here
        token: process.env.SLACK_TOKEN // set your token here
      }, function(response){
        //console.log(response);
        console.log("INVITE SENT");
      });

      //TODO Spara e-post till slack i databasen

      User.findOneAndUpdate({ username: currentUser.login }, { email: xss(req.body.email), wantSlackNotifications: true }, function(err, user){
        console.log(user);
        console.log("Email saved!");
      });
      res.render("webhook/verify", {username: currentUser.login, email: req.body.email, csrfToken: req.csrfToken()});
    });
    //res.redirect("/orgs");
  }else {
    res.status(403).render("403", {message: "You have to be logged in! ", link: "/login", linkName:"Login"});
  }
});

module.exports = router;
