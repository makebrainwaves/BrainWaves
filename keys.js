// These  values must be filled with the appropriate Emotiv credentials to be able to use the Cortex SDK
// We have our credentials stored in environement variables

var USERNAME = process.env.EMOTIV_USERNAME;
var PASSWORD = process.env.EMOTIV_PASSWORD;
var CLIENT_ID = process.env.EMOTIV_CLIENT_ID;// Created through Cortex Apps page on Emotiv.com
var CLIENT_SECRET = process.env.EMOTIV_CLIENT_SECRET; // Created through Cortex Apps page on Emotiv.com
var LICENSE_ID = process.env.EMOTIV_LICENSE_ID; // Visible on My Account page of Emotiv.com


module.exports = { USERNAME, PASSWORD, CLIENT_ID, CLIENT_SECRET, LICENSE_ID };
