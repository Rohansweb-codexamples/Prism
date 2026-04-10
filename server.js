/**
 * PRISM CLOUD BACKEND (DEPLOY TO RENDER)
 * - Firebase Admin for secure persistent storage
 * - JWT Verification for Google Auth tokens (Optional enhancement)
 */

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin using Service Account from Environment Variables
// Add the content of your service account JSON to a variable named FIREBASE_SERVICE_ACCOUNT
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase initialized successfully.");
} else {
    console.warn("FIREBASE_SERVICE_ACCOUNT environment variable is missing. Running in local mock mode.");
}

const db = admin.apps.length ? admin.firestore() : null;

// SYNC SESSIONS
app.post('/api/sync', async (req, res) => {
    const { userId, sessions } = req.body;
    if (!userId || !sessions) return res.status(400).send("Missing payload");

    try {
        if (db) {
            await db.collection('prism_sessions').doc(userId).set({
                sessions,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        res.status(200).json({ status: "success", syncedAt: new Date().toISOString() });
    } catch (err) {
        console.error(err);
        res.status(500).send("Sync Error");
    }
});

// FETCH SESSIONS
app.get('/api/load/:userId', async (req, res) => {
    try {
        if (!db) return res.json({ sessions: [] });
        const doc = await db.collection('prism_sessions').doc(req.params.userId).get();
        if (!doc.exists) return res.json({ sessions: [] });
        res.json(doc.data());
    } catch (err) {
        res.status(500).send("Fetch Error");
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Prism Backend Engine active on port ${PORT}`));
