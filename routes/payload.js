/*jshint esversion: 6 */
const router = require("express").Router();

router.route("/")
    .get((req, res) => {
        res.render("webhook/payload");
    });

module.exports = router;
