// Firebase Admin SDK initialization
const admin = require('firebase-admin');

let firebaseApp = null;

function initFirebase() {
  if (firebaseApp) return firebaseApp;

  // Only initialize if credentials are available
  if (!process.env.FCM_SERVER_KEY || process.env.FCM_SERVER_KEY === '...') {
    console.log('⚠️  Firebase not configured (missing FCM_SERVER_KEY)');
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('✅ Firebase Admin initialized');
    return firebaseApp;
  } catch (err) {
    console.error('❌ Firebase init failed:', err.message);
    return null;
  }
}

function getFirebaseAdmin() {
  return firebaseApp;
}

module.exports = { initFirebase, getFirebaseAdmin };
