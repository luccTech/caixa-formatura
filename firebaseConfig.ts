// firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC49Fze9xHxdfepiQ8ryx6eGTupgyT-ZU0",
  authDomain: "caixa-formatura.firebaseapp.com",
  projectId: "caixa-formatura",
  storageBucket: "caixa-formatura.firebasestorage.app",
  messagingSenderId: "954237583558",
  appId: "1:954237583558:web:54968336a38fc0949697c7",
  measurementId: "G-KNGFVBTMTG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
