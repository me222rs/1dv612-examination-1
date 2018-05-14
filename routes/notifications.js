/*jshint esversion: 6 */
const router = require("express").Router();
const express       = require("express");
const octonode      = require("octonode");
//const github        = require("github");

var Settings = require('../models/settings.js');
var Repository = require('../models/repository.js');
var Notifications = require('../models/notifications.js');
module.exports = {
    startNotifications: function(app, io){
      console.log("Noti");
      var github = app.get("github");
        //Offline notifications
        github.on('*', function (event, repo, data) {
          var githubAPI = app.get("githubAPI");
          var online;

          try{
            githubAPI.getCurrentUser().then(currentUser => {
              console.log("Kommer ej skicka Offline notifikation");
              online = true;
            });
          }catch(error){
            online = false;
          }

          if(online === false){
            var message;
            //Hitta alla som prenumererar på denna organisation
            Settings.find({org: data.organization.login }, function(err, settings) {
              for(var i=0;i<settings.length;i++){
                //Hitta om man prenumererar på repositoriet händelsen skedde i
                Repository.find({org: data.organization.login }, function(err, r) {
                  for (var i = 0; i < r.length; i++) {
                    if(r[i].repos.checked.indexOf(repo) > -1){
                      //ISSUE
                      if(settings[i].issue === "checked" && event === 'issues'){
                        console.log("Incoming offline notification! (issue)");
                        console.log("Skickar till: "+settings[i].username);
                        message = {channel: '@'+settings[i].username, text: 'Issue was opened/closed in '+data.organization.login, username: 'Bot'};
                      }
                      //PUSH
                      else if (settings[i].push === "checked" && event === 'push') {
                        console.log("Incoming offline notification! (push)");
                        console.log("Skickar till: "+settings[i].username);
                        message = {channel: '@'+settings[i].username, text: 'A push was made in '+data.organization.login, username: 'Bot'};
                      }
                      //REPOSITORY
                      else if (settings[i].repository === "checked" && event === 'repository') {
                        console.log("Incoming offline notification! (repository)");
                        console.log("Skickar till: "+settings[i].username);
                        message = {channel: '@'+settings[i].username, text: 'A repository created in '+data.organization.login, username: 'Bot'};
                      }
                      //Release
                      else if (settings[i].release === "checked" && event === 'release') {
                        console.log("Incoming offline notification! (release)");
                        console.log("Skickar till: "+settings[i].username);
                        message = {channel: '@'+settings[i].username, text: 'A release was made in '+data.organization.login, username: 'Bot'};
                      }
                      else {
                        console.log("Incoming fail!");
                        return false;
                      }
                      //Save the notifications for offline user in the database
                      var notification = Notifications({username: settings[i].username,message:message.text});
                      notification.save(function(err) {
                        if (err) throw err;
                        console.log('Notification saved!');
                      });
                      slack.send(message);
                    }
                  }
                });
              }
            });
          }
        });

        //Online notifications
        io.on('connection', function (socket) {
          console.log("Connected to socket!");
          github.on('*', function (event, repo, data) {
            var githubAPI = app.get("githubAPI");
            var currentUser = app.get("loggedIn");
            if(currentUser){
              //githubAPI.getCurrentUser().then(currentUser => {
              Settings.find({ username: currentUser.login, org: data.organization.login }, function(err, settings) {
                Repository.find({username: currentUser.login, org: data.organization.login}, function(err, repos){

                  //Om man prenumererar på händelsen så visa notifikation
                  if(repos[0].repos.checked.indexOf(repo) > -1){
                    if(settings[0].issue === "checked" && event === 'issues'){
                      console.log("Incoming online notification! (issue)");
                      socket.send("An issue was "+data.action+" in the "+ repo +" repository in "+ data.organization.login);
                    }
                    else if (settings[0].push === "checked" && event === 'push') {
                      console.log("Incoming online notification! (push)");
                      socket.send("A push was made in "+repo +" repository in "+ data.organization.login);
                    }
                    //REPOSITORY
                    else if (settings[0].repository === "checked" && event === 'repository') {
                      console.log("Incoming online notification! (repository)");
                      socket.send("A repository was "+data.action+" in "+repo +" repository in "+ data.organization.login);
                    }
                    //Release
                    else if (settings[0].release === "checked" && event === 'release') {
                      console.log("Incoming online notification! (release)");
                      socket.send("A release was made in "+repo +" repository in "+ data.organization.login);
                    }
                    else {
                      console.log("Incoming fail!");
                    }
                  }else{
                    console.log("Not subscribed to any repos");
                  }
                });
              });
            }
            else{
              console.log("No user online");
            }
            //});
        });
      //});
});
}
//module.exports = router;
};
