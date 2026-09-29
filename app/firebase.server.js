import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function getFirestoreDatabase() {
  const projectId = process.env.FIREBASE_PROJECT_ID || "cart-forge-4e09e";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY environment variable",
    );
  }

  const firebaseApp =
    getApps()[0] ||
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });

  return getFirestore(firebaseApp);
}
