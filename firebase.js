const admin = require('firebase-admin');
const serviceAccount = require('./serviceKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'lighthouse-78743.appspot.com'
});

const bucket = admin.storage().bucket();

module.exports = { bucket };