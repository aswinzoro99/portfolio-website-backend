const admin = require('firebase-admin');
const config = require('../config');

function getServiceAccount() {
  const raw = config.firebaseServiceAccount;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is required');
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed;
  } catch (error) {
    throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT JSON: ${error.message}`);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
    storageBucket: config.firebaseStorageBucket,
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { db, bucket };
