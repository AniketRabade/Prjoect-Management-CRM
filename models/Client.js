const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Client name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email"
    ]
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, "Description cannot exceed 500 characters"]
  }
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);