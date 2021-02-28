// These  values must be filled with the appropriate Emotiv credentials to be able to use the Cortex SDK
// We have our credentials stored in environement variables

const CLIENT_ID = process.env.CLIENT_ID; // Created through Cortex Apps page on Emotiv.com
const CLIENT_SECRET = process.env.CLIENT_SECRET; // Created through Cortex Apps page on Emotiv.com
const LICENSE_ID = process.env.LICENSE_ID; // Visible on My Account page of Emotiv.com

const envVars = { CLIENT_ID, CLIENT_SECRET, LICENSE_ID };
Object.keys(envVars).forEach((k) =>
  console.log(typeof envVars[k] === 'string')
);

module.exports = { CLIENT_ID, CLIENT_SECRET, LICENSE_ID };
