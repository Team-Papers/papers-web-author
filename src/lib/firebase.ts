import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDwaIYm8iUGW_il1g7jGYfZDFMyZ0KUcIs',
  authDomain: 'papersbook-f3826.firebaseapp.com',
  projectId: 'papersbook-f3826',
  storageBucket: 'papersbook-f3826.appspot.com',
  messagingSenderId: '232506897629',
  appId: '1:232506897629:web:c3c6d4dde4f71cca4d9734',
  measurementId: 'G-G7BS2NSR0F',
};

let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

export function getFirebaseApp() {
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth() {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getGoogleProvider() {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
  }
  return googleProvider;
}
