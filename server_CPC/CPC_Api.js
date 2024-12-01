import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import admin from "firebase-admin";
import bcrypt from "bcrypt";
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

// Utility function to check if an admin exists (by email or adminId)
async function checkIfAdminExists(adminId, email) {
  const emailSnapshot = await db.collection("Person").where("email", "==", email).get();
  const adminIdSnapshot = await db.collection("Person").where("adminId", "==", adminId).get();
  return !emailSnapshot.empty || !adminIdSnapshot.empty;
}

// Function to add an admin
async function addAdmin(personData) {
  try {
    const personRef = db.collection("Person").doc(personData.adminId);

    const passwordToStore = personData.adminPass
      ? await bcrypt.hash(personData.adminPass, 10)
      : await bcrypt.hash('Hax', 10); // Default password for testing

    const personEntry = {
      ...personData,
      role: "admin", // Set role to "admin"
      adminPass: passwordToStore,
    };

    await personRef.set(personEntry);
    console.log("Admin added successfully with adminId:", personData.adminId);
  } catch (error) {
    console.error("Error adding admin:", error);
    throw new Error("Failed to add admin.");
  }
}

// Add a new admin route
app.post("/api/addAdmin", async (req, res) => {
  const { adminName, email, adminPass, adminId, phone, date } = req.body;

  if (!adminName || !email || !adminPass || !adminId || !phone || !date) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const exists = await checkIfAdminExists(adminId, email);
    if (exists) {
      return res.status(400).json({ message: "Admin already exists." });
    }

    const newPerson = { adminName, email, adminPass, adminId, phone, date };
    await addAdmin(newPerson);  // Correct function name
    res.status(200).json({ message: "Admin registered successfully!" });
  } catch (error) {
    console.error("Error adding admin:", error.message);
    res.status(500).json({ message: "Failed to add admin." });
  }
});

// Delete a person route
app.delete("/api/deleteAdmin/:adminId", async (req, res) => {
  const { adminId } = req.params;
  try {
    await db.collection("Person").doc(adminId).delete();
    res.status(200).json({ message: "Admin deleted successfully." });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ message: "Failed to delete admin." });
  }
});

// Fetch all admins route
app.get("/api/getAdmin", async (req, res) => {
  try {
    const persons = [];
    const personSnapshot = await db.collection("Person").get();
    personSnapshot.forEach((doc) => {
      const data = doc.data();
      delete data.adminPass; // Remove sensitive data
      persons.push({ id: doc.id, ...data });
    });
    res.status(200).json(persons);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admins." });
  }
});

// Fetch a person by ID route
app.get("/api/getAdmin/:adminId", async (req, res) => {
  const { adminId } = req.params;
  try {
    const personDoc = await db.collection("Person").doc(adminId).get();
    if (!personDoc.exists) {
      return res.status(404).json({ message: "Admin not found." });
    }
    const personData = personDoc.data();
    delete personData.adminPass; // Remove sensitive data
    res.status(200).json(personData);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin." });
  }
});
app.get("/api/getUser", async (req, res) => {
  try {
    const persons = [];
    const personSnapshot = await db.collection("Person").get(); // Get all users from the "Person" collection
    personSnapshot.forEach((doc) => {
      const data = doc.data();
      delete data.userNum; // Remove sensitive data (userNum)
      persons.push({ id: doc.id, ...data }); // Add user data with the document ID
    });
    res.status(200).json(persons); // Return all users
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users." }); // Handle errors
  }
});
app.get("/api/getUser/:userId", async (req, res) => {
  const { userId } = req.params; // Get userId from URL parameters
  try {
    const personDoc = await db.collection("Person").doc(userId).get(); // Fetch the user by their ID
    if (!personDoc.exists) {
      return res.status(404).json({ message: "User not found." }); // Handle user not found
    }
    const personData = personDoc.data();
    delete personData.userNum; // Remove sensitive data (userNum)
    res.status(200).json(personData); // Return the user's data
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user." }); // Handle errors
  }
});
// Update a person route
app.post("/api/updateAdmin/:adminId", async (req, res) => {
  const { adminId } = req.params;
  const { adminName, adminPass, date, email, phone } = req.body;

  if (!adminId) {
    return res.status(400).json({ message: "Admin ID is required." });
  }

  try {
    const updatedData = { adminName, adminId, date, email, phone, role: "admin" };

    if (adminPass) {
      updatedData.adminPass = await bcrypt.hash(adminPass, 10);
    }

    const personDoc = db.collection("Person").doc(adminId);
    const doc = await personDoc.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Admin not found." });
    }

    await personDoc.update(updatedData);
    res.status(200).json({ message: "Admin updated successfully." });
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({ message: "Failed to update admin." });
  }
});

// Person login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const personQuerySnapshot = await db.collection("Person").where("email", "==", email).get();

    if (personQuerySnapshot.empty) {
      return res.status(400).json({ message: "Admin data is incorrect." });
    }

    const docData = personQuerySnapshot.docs[0];
    const person = docData.data();

    const isPasswordValid = await bcrypt.compare(password, person.adminPass);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const adminId = docData.id;
    console.log("Admin ID from backend:", adminId);

    return res.status(200).json({
      adminId,
      role: person.role,
      email: person.email
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

// Check if admin is authenticated
app.get('/api/checkAdmin/:adminId', async (req, res) => {
  const { adminId } = req.params;
  try {
    const personDoc = await db.collection("Person").doc(adminId).get();
    if (!personDoc.exists) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    const personData = personDoc.data();
    if (personData.role !== "admin") { // Ensure only admins are authenticated
      return res.status(403).json({ message: 'Forbidden: Not an authorized admin.' });
    }

    res.status(200).json({ role: personData.role });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying admin.' });
  }
});



//---------------------------------------------------------------------------------User----------------------------------------------------------------------------------
async function addUser(userData) {
  try {
    // Use "Person" collection consistently
    const userRef = db.collection("Person").doc(userData.userId);  // Use userId as the document ID
    
    const userEntry = {
      ...userData,
      userId: userData.userId,  // Set userId equal to userId
      role: "user",
    };

    await userRef.set(userEntry);  // Use userId as the document ID when saving the user data
    console.log("User added successfully with ID:", userData.userId);
    
    return userEntry;  // Return user data including the userId (which is userId now)
  } catch (error) {
    console.error("Error adding user:", error);
    throw new Error("Failed to add user.");
  }
}

// Add a new user through API
app.post('/api/addUser', async (req, res) => {
  const { userName, useremail, userId, userphone, date } = req.body;

  // Check if all fields are provided
  if (!userName || !useremail || !userId || !userphone || !date) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if the user already exists based on email
    const userRef = db.collection('Person').where('useremail', '==', useremail);
    const snapshot = await userRef.get(userId);

    if (!snapshot.empty) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Create a new user document
    const newUser = {
      userName,
      useremail,
      userId,
      userphone,
      date,
    };

    const addedUser = await addUser(newUser);  // Add user and get the added user object

    // Respond with the added user data
    return res.status(201).json({ 
      message: 'User successfully registered', 
      user: addedUser 
    });
  } catch (error) {
    console.error('Error adding user to Firestore:', error);
    return res.status(500).json({ message: 'An error occurred while registering the user' });
  }
});
app.get('/api/getUser/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const userRef = db.collection('Person').doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(doc.data());
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({ message: 'Error fetching user data' });
  }
});

//---------------------------------------------IOT-----------------------------------------------------------------------------------------------------
app.post('/api/addIoTData', async (req, res) => {
  const { pmId, PM1, PM10, PM2_5, timestamp, address, location, status } = req.body;

  if (!pmId) {
    return res.status(400).json({ message: 'pmId is required.' });
  }

  try {
    const validData = {
      pmId: pmId || 'ไม่มีข้อมูล',
      PM1: PM1 || 0,
      PM10: PM10 || 0,
      PM2_5: PM2_5 || 0,
      address: address || 'ไม่มีข้อมูล',
      location: location || 'ไม่ระบุ',
      status: status || 'inactive',
      timestamp: timestamp || '',
    };

    const docRef = db.collection('PMData').doc(pmId);
    await docRef.set(validData, { merge: true });

    res.status(200).json({ message: 'Data added or updated successfully.', data: validData });
  } catch (error) {
    console.error('Error adding IoT data:', error);
    res.status(500).json({ message: 'Failed to add or update IoT data.' });
  }
});

// API to get IoT data
app.get('/api/getIoTData', async (req, res) => {
  try {
    const snapshot = await db.collection('PMData').get();

    if (snapshot.empty) {
      return res.status(404).json({ message: 'No IoT data found.' });
    }

    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('Error getting IoT data:', error);
    res.status(500).json({ message: 'Failed to retrieve IoT data.' });
  }
});

app.patch('/api/updateStatus/:pmId', async (req, res) => {
  const { pmId } = req.params;
  const { status } = req.body;

  // Validate the status
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Allowed values are active or inactive.' });
  }

  try {
    const pmRef = db.collection('PMData').doc(pmId);
    const pmDoc = await pmRef.get();

    if (!pmDoc.exists) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Update the status in Firestore
    await pmRef.update({ status });

    return res.status(200).json({ message: `Device ${pmId} status updated to ${status}` });
  } catch (err) {
    console.error('Error updating status:', err);
    return res.status(500).json({ message: 'Error updating status' });
  }

});

app.patch('/api/updateIOT/:pmId', async (req, res) => {
  const { pmId } = req.params;
  const updates = req.body;
  try {
    const docRef = db.collection('PMData').doc(pmId);
    await docRef.set(updates, { merge: true });
    res.status(200).json({ message: 'IoT data updated' });
  } catch {
    res.status(500).json({ message: 'Error updating IoT data' });
  }
});

const deleteIOT = async (pmId) => {
  const docRef = db.collection('PMData').doc(pmId);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error('Device not found');
  }
  await docRef.delete();
};

app.delete('/api/deleteDevice/:pmId', async (req, res) => {
  const { pmId } = req.params;
  console.log(`[INFO] Attempting to delete device with pmId: ${pmId}`);
  try {
    const docRef = db.collection('PMData').doc(pmId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Device not found' });
    }

    await docRef.delete();
    res.status(200).json({ message: 'Device deleted successfully' });
  } catch (err) {
    console.error(`[ERROR] Failed to delete device with pmId: ${pmId}`, err);
    res.status(500).json({ message: 'Failed to delete device', error: err.message });
  }
});
