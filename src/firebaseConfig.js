import { initializeApp } from "firebase/app";
import { getAuth } from "@firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch(() => {
    // Firestore persistence may fail in some browsers or when multiple tabs are open.
  });
}

export { auth, db };