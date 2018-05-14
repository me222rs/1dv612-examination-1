/*jshint esversion: 6 */
const rp = require('request-promise-native');
const USER_AGENT = "my-awesome-github-app";

function postAPIData(token, url, data) {
  let options = {
    uri: url,
    method: "POST",
    headers: {
      'User-Agent': USER_AGENT,
      "Authorization": `token ${token}`
    },
    json: true,
    body: data
  };
  return rp(options);
}

function getAPIData(token, url) {
  let options = {
    uri: url,
    method: "GET",
    headers: {
      'User-Agent': USER_AGENT,
      "Authorization": `token ${token}`
    },
    json: true
  };

  return rp(options);
}

module.exports = (token) => {
  return {
    //USER
    //Gets the current user
    getCurrentUser: function() {
      const url = "https://api.github.com/user";
        return getAPIData(token, url);
    },

    //ORGANIZATION
    //Gets one single organization of the current user
    getOrganization: function(org) {
      const url = `https://api.github.com/orgs/${org}`;
      return getAPIData(token, url);
    },
    // Gets all the organizations of the current user
    getAllOrganizations: function() {
      const url = "https://api.github.com/user/orgs";
      return getAPIData(token, url);
    },
    //Gets the repos of the organization
    getOrganizationRepos: function(org) {
      const url = `https://api.github.com/orgs/${org}/repos`;
      return getAPIData(token, url);
    },
    //Gets all of the events of the organization
    getOrganizationEvents: function(org) {
      const url = `https://api.github.com/orgs/${org}/events`;
      return getAPIData(token, url);
    },

    //WEBHOOKS
    //Creates a webhook for the organization
    createOrganizationWebhook: function(org, events) {
      const url = `https://api.github.com/orgs/${org}/hooks`;
      const data = {
        "name": "web",
        "active": true,
        "events": events,
        "config": {
          "url": "http://b38f4b20.ngrok.io/webhook",
          "content_type": "json",
          "secret": "thisisasecret",
          "insecure_ssl": "1"
        }
      };
      return postAPIData(token, url, data);
    },
    //Edits the webhook for the organization
    editOrganizationWebhook: function(org, events, id) {
      events = events || ["push"];
      const url = `https://api.github.com/orgs/${org}/hooks/${id}`;
      const data = {
        "active": true,
        "events": events,
        "secret": "thisisasecret"
      };
      return postAPIData(token, url, data);
    },
  };
};
