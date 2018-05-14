/*jshint esversion: 6 */
const router = require("express").Router();
const express       = require("express");

router.route("/callback")
    .get((req, res) => {
        console.log("Callback");
        var githubOAuth = req.app.get("githubOAuth");
        return githubOAuth.callback(req, res);
      });

module.exports = router;
