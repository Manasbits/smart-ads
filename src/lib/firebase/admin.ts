import {
  initializeApp,
  getApps,
  cert,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _app: App | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;

function ensureApp(): App {
  if (!_app) {
    _app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
              clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
                /\\n/g,
                "\n"
              ),
            }),
          });
  }
  return _app;
}

export function getAdminAuth(): Auth {
  if (!_auth) _auth = getAuth(ensureApp());
  return _auth;
}

export function getAdminDb(): Firestore {
  if (!_db) _db = getFirestore(ensureApp());
  return _db;
}

// Legacy exports — lazy getters
export const adminAuth = {
  verifyIdToken: (...args: Parameters<Auth["verifyIdToken"]>) =>
    getAdminAuth().verifyIdToken(...args),
  verifySessionCookie: (...args: Parameters<Auth["verifySessionCookie"]>) =>
    getAdminAuth().verifySessionCookie(...args),
  createSessionCookie: (...args: Parameters<Auth["createSessionCookie"]>) =>
    getAdminAuth().createSessionCookie(...args),
  revokeRefreshTokens: (...args: Parameters<Auth["revokeRefreshTokens"]>) =>
    getAdminAuth().revokeRefreshTokens(...args),
};

export const adminDb = {
  collection: (...args: Parameters<Firestore["collection"]>) =>
    getAdminDb().collection(...args),
};
