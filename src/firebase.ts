import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
// Note: firebaseConfig.firestoreDatabaseId is used to connect to the specific database instance
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connection test
async function testConnection() {
  try {
    // Attempt to fetch a non-existent doc to verify connection
    await getDocFromServer(doc(db, '_connection_test_', 'init'));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase connection failed: The client is offline. Please check your configuration.");
    }
    // Other errors (like 404) are fine as they imply a successful connection to the server
  }
}

testConnection();
