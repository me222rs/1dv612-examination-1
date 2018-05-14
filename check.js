/*jshint esversion: 6 */
const rp = require('request-promise-native');
const USER_AGENT = "my-awesome-github-app";

module.exports = (token) => {
  return {
    //USER
    //Gets the current user
    getCurrentUser: function() {
      const url = "https://api.github.com/user";
        return getAPIData(token, url);
    }
  };
};
