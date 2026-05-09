import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCc4-s-zKa74iTauana6Y5uG3DPsdnjJN4",
  authDomain: "elibraryll.firebaseapp.com",
  projectId: "elibraryll",
  storageBucket: "elibraryll.appspot.com",
  messagingSenderId: "250468753439",
  appId: "1:250468753439:web:3e6e2c49cb25c636b6352a",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with persistence (only if not already initialized)
let auth;
try {
  auth = getAuth(app);
} catch (error) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
