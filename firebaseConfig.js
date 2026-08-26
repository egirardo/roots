import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/* Kommentera in detta om du vill använda från datorn och kommentera ut auth på rad 23 */
import { getAuth } from "firebase/auth";
export const auth = getAuth(app);

const firebaseConfig = {
  apiKey: "AIzaSyDnH1JY-IE2oiZjkLWwWC1bqtVc_Vs5cyQ",
  authDomain: "roots-58765.firebaseapp.com",
  projectId: "roots-58765",
  storageBucket: "roots-58765.firebasestorage.app",
  messagingSenderId: "113491726456",
  appId: "1:113491726456:web:7d83364a2e5fa326e01d8d",
  measurementId: "G-38MW25ZQVP"
};

const app = initializeApp(firebaseConfig);

// export const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(AsyncStorage),
// });

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
