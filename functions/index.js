/**
 * Firebase Cloud Functions for MetEyes Application
 */

const {setGlobalOptions} = require("firebase-functions");

// Set global options for cost control
setGlobalOptions({maxInstances: 10});

// No cloud functions are currently defined.
// Add any future server-side functionality here.
