const mongoose = require('mongoose');

// Define the schema for the user
const userSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },   // auto increment is usually handled in MongoDB via external libraries or manually
  name: { type: String, required: true },
  mail: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'superuser'], 
    required: true 
  },
  password: { type: String, required: true }
});

// Create a model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
