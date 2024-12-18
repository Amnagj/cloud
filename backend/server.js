require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// MongoDB connection
const uri = process.env.MONGO_URI; // Add your MongoDB URI in .env
let db;
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db('cryptage_db');
    console.log('Connected to MongoDB');
  })
  .catch(error => console.error('Error connecting to MongoDB:', error));

// Function to write logs
const writeLog = (message) => {
  const fs = require('fs');
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync('logs/login_log.txt', logMessage);
};

// Endpoint for login
app.post('/login', async (req, res) => {
  const { username, password, captchaResponse } = req.body;

  if (!username || !password || !captchaResponse) {
    return res.status(400).json({ error: 'Veuillez remplir tous les champs.' });
  }

  // Verify reCAPTCHA
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const captchaVerificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaResponse}`;

  const captchaRes = await fetch(captchaVerificationUrl, { method: 'POST' });
  const captchaData = await captchaRes.json();

  if (!captchaData.success) {
    writeLog(`Tentative échouée : échec du CAPTCHA pour l'utilisateur ${username}.`);
    return res.status(400).json({ error: 'La vérification CAPTCHA a échoué.' });
  }

  // Query MongoDB for the user
  const usersCollection = db.collection('users');
  const user = await usersCollection.findOne({ username });

  if (!user) {
    writeLog(`Échec : nom d'utilisateur incorrect (${username}).`);
    return res.status(400).json({ error: 'Nom d\'utilisateur incorrect.' });
  }

  // Check password
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    writeLog(`Échec : mot de passe incorrect pour l'utilisateur ${username}.`);
    return res.status(400).json({ error: 'Mot de passe incorrect.' });
  }

  // Log successful login
  writeLog(`Connexion réussie pour l'utilisateur ${username} avec le rôle ${user.role}.`);

  // Create a session or token (for example, using JWT)
  // This is just a simple example without session or token management
  res.status(200).json({
    message: 'Connexion réussie.',
    role: user.role,
    username: user.username,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
