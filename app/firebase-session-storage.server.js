import { Session } from "@shopify/shopify-api";
import { getFirestoreDatabase } from "./firebase.server";

const COLLECTION_NAME = "shopify_sessions";
const DELETE_BATCH_SIZE = 500;

function sessionDocument(id) {
  return getFirestoreDatabase()
    .collection(COLLECTION_NAME)
    .doc(encodeURIComponent(id));
}

function serializeSession(session) {
  return Object.fromEntries(session.toPropertyArray(true));
}

function deserializeSession(data) {
  return Session.fromPropertyArray(Object.entries(data), true);
}

export class FirebaseSessionStorage {
  async storeSession(session) {
    await sessionDocument(session.id).set(serializeSession(session));
    return true;
  }

  async loadSession(id) {
    const snapshot = await sessionDocument(id).get();

    if (!snapshot.exists) {
      return undefined;
    }

    return deserializeSession(snapshot.data());
  }

  async deleteSession(id) {
    await sessionDocument(id).delete();
    return true;
  }

  async deleteSessions(ids) {
    for (let offset = 0; offset < ids.length; offset += DELETE_BATCH_SIZE) {
      const batch = getFirestoreDatabase().batch();
      const batchIds = ids.slice(offset, offset + DELETE_BATCH_SIZE);

      for (const id of batchIds) {
        batch.delete(sessionDocument(id));
      }

      await batch.commit();
    }

    return true;
  }

  async findSessionsByShop(shop) {
    const snapshot = await getFirestoreDatabase()
      .collection(COLLECTION_NAME)
      .where("shop", "==", shop)
      .get();

    return snapshot.docs.map((document) =>
      deserializeSession(document.data()),
    );
  }
}

export const firebaseSessionStorage = new FirebaseSessionStorage();
