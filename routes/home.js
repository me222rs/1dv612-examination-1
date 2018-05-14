/*jshint esversion: 6 */
const router = require("express").Router();
const express       = require("express");
var User = require('../models/user.js');
var Settings = require('../models/settings.js');
var Webhooks = require('../models/webhook.js');
var Repository = require('../models/repository.js');
var Notifications = require('../models/notifications.js');
const octonode      = require("octonode");
var xss = require("xss");
router.route("/")
.get((req, res) => {
  console.log("I home");
  var githubOAuth = require('github-oauth')({
    githubClient: process.env.GITHUB_CLIENT_ID,
    githubSecret: process.env.GITHUB_CLIENT_SECRET,
    baseURL: 'http://b38f4b20.ngrok.io/:' + 3000,
    loginURI: '/login',
    callbackURI: '/callback',
    scope: 'read:org, user, repo, write:repo_hook, write:org, admin:org_hook'
  });
  req.app.set("githubOAuth", githubOAuth);

  githubOAuth.on('error', function(err) {
    console.error('there was a login error', err);
  });

  githubOAuth.on('token', function(_token, serverResponse) {
    token = _token.access_token;
    //req.session.token = _token_access_token;
    const githubAPI = require("../githubAPICalls.js")(token);
    req.app.set("githubAPI", githubAPI);
    githubAPI.getCurrentUser().then(currentUser => {
      req.session.currentUser = currentUser;
      req.app.set("loggedIn",currentUser);
      //console.log(session.currentUser.login);
      serverResponse.redirect("/orgs");
    });
  });
  res.render("webhook/login", {});
});

router.route("/orgs/:name")
.get((req, res) => {
  var repositories = [];
  var org = req.params.name;
  var temp = [];
  var newEvents = [];
  var githubAPI = req.app.get("githubAPI");
  var use;

  if(typeof req.session.currentUser !== 'undefined'){

    githubAPI.getOrganizationRepos(req.params.name).then(repos => {
      //githubAPI.getCurrentUser().then(currentUser => {
      //console.log(req.session.currentUser.login);
      Repository.find({ username: req.session.currentUser.login, org: req.params.name}, function(err, repo) {
        if(repo.length === 0){

          console.log("Not subbed to any repos!");
          for (var k = 0; k < repos.length; k++) {
            repositories.push({name: repos[k].name, checked: "" });
          }
          res.render("webhook/repos", {repositories, org});
        }
        else {
          console.log("repo:");
          console.log(repo);
          for (var i = 0; i < repos.length; i++) {

            for (var j = 0; j < repo.length; j++) {

              //Om det är flera repo
              if(typeof(repo[j].repos.checked) === "object"){

                for (var h = 0; h < repo[j].repos.checked.length; h++) {
                  if(repo[j].repos.checked[h] === repos[i].name){
                    temp.push(repo[j].repos.checked[h]);
                    console.log(1);
                    repositories.push({name: repo[j].repos.checked[h], checked: "checked" });
                  }
                }
              }
              //Om det bara är ett enda repo
              else {
                console.log(repo[j].repos.checked +"-----"+ repos[i].name);
                if(repo[j].repos.checked.indexOf(repos[i].name) > -1){
                  temp.push(repos[i].name);
                  console.log(2);
                  repositories.push({name: repos[i].name, checked: "checked" });
                }
                else{
                  temp.push(repos[i].name);
                  console.log(3);
                  repositories.push({name: repos[i].name, checked: "" });
                }
              }

              if(temp.indexOf( repos[i].name ) === -1){
                var found = false;
                for(var a = 0; a < repositories.length; a++) {
                  if (repositories[a].org ===  repos[i].name) {
                    found = true;
                    break;
                  }
                }
                if(found === false){
                  console.log(4);
                  repositories.push({name: repos[i].name, checked: "" });
                }
              }
            }
          }
          console.log("repositories");

          console.log(repositories);
          res.render("webhook/repos", {repositories, newEvents, org, csrfToken: req.csrfToken()});
        }
      });
      //});
    });
  }
  else {
    res.status(403).render("403", {message: "You have to be logged in! ", link: "/login", linkName:"Login"});
  }
});

router.route("/repos/:org")
.post((req, res) => {
  if(typeof req.session.currentUser !== 'undefined'){
    var githubAPI = req.app.get("githubAPI");
    //githubAPI.getCurrentUser().then(currentUser => {

    Repository.find({username: req.session.currentUser.login, org: req.params.org},function(err, repo){
      if(repo.length > 0){
        console.log("repo är större än 0");
        Repository.findOneAndUpdate({ username: req.session.currentUser.login, org: req.params.org }, { repos: {checked: xss(req.body.checked)} }, function(err, r){
        });

      }
      else {
        //TODO CREATE
        console.log("I create!");
        var repository = Repository({
          username: req.session.currentUser.login,
          repos:{checked: xss(req.body.checked)},
          org:xss(req.params.org)
        });
        repository.save(function(err) {
          if (err) throw err;
          //req.app.set("flash",{type: "success", text: "Saved repository settings!"});
          //req.session.flash = {type: "success", text: "Saved repository settings!"};
          console.log('Repository settings saved!');
        });
      }
    });
    //});
    res.redirect("/orgs");
  }else {
    res.status(403).render("403", {message: "You have to be logged in! ", link: "/login", linkName:"Login"});
  }
});

router.route("/orgs")
.get((req, res) => {
  //console.log("flash: "+req.app.get("flash"));
  if(typeof req.app.get("loggedIn") === 'undefined' || req.app.get("loggedIn") === ""){
    res.status(403).render("403", {message: "You have to be logged in! ", link: "/login", linkName:"Login"});
  }
  else{
    var githubAPI = req.app.get("githubAPI");
    githubAPI.getCurrentUser().then(currentUser => {
      req.session.currentUser = currentUser;
      //req.app.set("loggedIn",currentUser);

      User.find({ username: req.session.currentUser.login }, function(err, user) {
        if (err) throw err;

        if(user === undefined || user === "" || user.length < 1){
          // create a new user in database
          var newUser = User({
            username: req.session.currentUser.login,
            email:req.session.currentUser.email,
            wantOnlineNotifications:true,
            wantSlackNotifications:false,
            lastLogin:Date.now()
          });
          // save the user
          newUser.save(function(err) {
            if (err) throw err;

            console.log('User saved!');
          });

        }
        else{
          console.log("User already exists");
        }
      });
    });

    githubAPI.getAllOrganizations().then(orgs => {
      githubAPI.getCurrentUser().then(currentUser => {
        var newEvents = [];
        var use;
        User.find({ username: req.session.currentUser.login }, function(err, user) {
          use = user;
          Notifications.find({ username: req.session.currentUser.login }, function(err, note) {
            console.log(use);

            for (var i = 0; i < note.length; i++) {
              console.log(new Date(note[i].date) +"-------"+ use[0].lastActive);
              if(new Date(note[i].date) > new Date(use[0].lastActive)){
                newEvents.push(note[i]);
              }
            }
          });
        });

        Settings.find({ username: req.session.currentUser.login }, function(err, settings) {
          if(settings !== "" || settings !== undefined || settings.lenght > 0){

            var superArray = [];
            var hasSettings = [];
            var hasNotSettings = [];
            for (var i = 0, len = orgs.length; i < len; i++) {

              //if there is no settings yet
              if(settings.length < 1 && orgs[i].login !== ""){
                console.log("1");
                superArray.push({org: orgs[i].login, push:"", issue:"", repository:"", release:"", csrfToken: req.csrfToken()});
              }
              //if the settings for a org is found
              else{
                for (var o=0; o < settings.length; o++) {
                  if (settings[o].org === orgs[i].login) {
                    console.log("Has setting: "+ settings[o].org);
                    hasSettings.push(orgs[i].login);
                    superArray.push({org: settings[o].org, push:settings[o].push, issue:settings[o].issue, repository:settings[o].repository, release:settings[o].release, csrfToken: req.csrfToken()});
                  }
                }
              }

              for (var j = 0, length = settings.length; j < length; j++) {
                if (orgs[i].login !== settings[j].org ) {
                  console.log("Has not setting: "+ orgs[i].login);
                  if(hasSettings.indexOf( orgs[i].login ) === -1){
                    var found = false;
                    for(var a = 0; a < superArray.length; a++) {
                      if (superArray[a].org === orgs[i].login) {
                        found = true;
                        break;
                      }
                    }
                    if(found === false){
                      superArray.push({org: orgs[i].login, push:"", issue:"", repository:"", release:"", csrfToken: req.csrfToken()});
                    }
                  }
                }
              }
            }
            User.findOneAndUpdate({ username: req.session.currentUser.login}, {lastActive: Date.now() }, function(err, user){
              console.log("Last activity updated!");
            });
            res.render("webhook/callback", {superArray, newEvents});
          }
          else{
            res.render("webhook/callback", {orgs, csrfToken: req.csrfToken()});
          }
        });
      });
    });
  }
});

router.route("/webhook/:org")
.post((req, res) => {
  console.log(req.body);
  if(typeof req.session.currentUser !== 'undefined'){
    var githubAPI = req.app.get("githubAPI");

    var push ;
    var issue;
    var repository;
    var release;
    var events = [];

    if(req.body.push === ""||req.body.push === undefined||req.body.push.length < 1){
      push = "";
    }
    else {
      push = "checked";
      events.push("push");
    }

    if(req.body.issues === ""||req.body.issues === undefined||req.body.issues.length < 1){
      issue = "";
    }
    else {
      issue = "checked";
      events.push("issues");
    }

    if(req.body.repository === ""||req.body.repository === undefined||req.body.repository.length < 1){
      repository = "";
    }
    else {
      repository = "checked";
      events.push("repository");
    }

    if(req.body.release === ""||req.body.release === undefined||req.body.release.length < 1){
      release = "";
    }
    else {
      release = "checked";
      events.push("release");
    }

    githubAPI.getCurrentUser().then(currentUser => {
      var newSetting = Settings({
        username: req.session.currentUser.login,
        push:push,
        issue:issue,
        repository:repository,
        release:release,
        org:req.params.org
      });

      //Kolla om en setting finns
      Settings.find({ username: req.session.currentUser.login, org: req.params.org }, function(err, settings) {
        console.log("SETTINGS: "+settings);
        if(settings.length > 0){
          Settings.findOneAndUpdate({ username: req.session.currentUser.login, org: req.params.org }, { push: xss(newSetting.push), issue: xss(newSetting.issue), repository: xss(newSetting.repository), release: xss(newSetting.release) }, function(err, user){
            console.log("Settings uppdaterad!");
            Webhooks.find({ username: req.session.currentUser.login, org: req.params.org}, function(err, hook) {
              if(hook.length > 0){
                githubAPI.editOrganizationWebhook(req.params.org, events, hook[0]['webhookID']).then(res => {
                  console.log("Hook edited!");
                });
              }
            });
          });
        }
        //Om ingen setting hittades så spara som en ny setting
        else{
          newSetting.save(function(err) {
            if (err) throw err;
            console.log("Sparar ny setting!");
            Webhooks.find({ username: req.session.currentUser.login, org: req.params.org}, function(err, hook) {
              console.log("Kollar om hook existerar!");
              if(hook.length < 1){
                githubAPI.createOrganizationWebhook(req.params.org, events).then(res => {
                  console.log(res);
                  var newWebhook = Webhooks({
                    username: req.session.currentUser.login,
                    org:req.params.org,
                    webhookID:res.id
                  });
                  newWebhook.save(function(err) {
                    console.log("Hook saved!");
                  });
                });
              }
            });
          });
        }
      });
    });
    res.redirect("/orgs");
  }else {
    res.status(403).render("403", {message: "You have to be logged in! ", link: "/login", linkName:"Login"});
  }
});

module.exports = router;
