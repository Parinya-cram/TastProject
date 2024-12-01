import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import admin from "firebase-admin";
import axios from 'axios'; // Add Axios for HTTP requests
import serviceAccount from './server/config/CPC_Fire_DB.json' assert { type: "json" };

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
const port = 3005;

// Middleware
app.use(bodyParser.json());
app.use(cors());


// Starting the server
app.listen(port, () => {
  console.log(`Web application listening on port ${port}.`);
});
app.delete('/api/deleteIOT/:pmId', (req, res) => {  // Use :pmId in URL params
  const { pmId } = req.params;  // Access pmId from URL params
  deleteIOT(pmId)
    .then(() => res.status(200).json({ message: '[INFO] Deleted device successfully.' }))
    .catch((err) => {
      console.error('Error deleting device:', err);
      res.status(500).json({ message: 'Failed to delete device', error: err });
    });
});