/*jshint esversion: 6 */
const router = require("express").Router();
const express       = require("express");
const octonode      = require("octonode");
const github        = require("github");


router.route("/login")
    .get((req, res) => {
      console.log("Login");
        var githubOAuth = req.app.get("githubOAuth");
        return githubOAuth.login(req, res);
          //res.render("webhook/login", {});
      });


router.route("/logout")
    .get((req, res) => {
      console.log("Logged out");
          //var githubAPI = req.app.get("githubAPI");
          req.app.set("loggedIn", "");
          req.app.set("githubAPI", "");
          res.redirect("/");
      });

module.exports = router;
