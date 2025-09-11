import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCK4QNtnjr6jkt5cugtav84AeD6HGmlxq8",
  authDomain: "moodify-f6c52.firebaseapp.com",
  projectId: "moodify-f6c52",
  storageBucket: "moodify-f6c52.firebasestorage.app",
  messagingSenderId: "540003524394",
  appId: "1:540003524394:web:9ed5acd50905bf24344853",
  measurementId: "G-RK4507KX15"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export default app;
