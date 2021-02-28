// These  values must be filled with the appropriate Emotiv credentials to be able to use the Cortex SDK
// We have our credentials stored in environement variables

const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const CLIENT_ID = process.env.CLIENT_ID; // Created through Cortex Apps page on Emotiv.com
const CLIENT_SECRET = process.env.CLIENT_SECRET; // Created through Cortex Apps page on Emotiv.com
const LICENSE_ID = process.env.LICENSE_ID; // Visible on My Account page of Emotiv.com

module.exports = { USERNAME, PASSWORD, CLIENT_ID, CLIENT_SECRET, LICENSE_ID };
