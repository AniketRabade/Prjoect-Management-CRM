//Client.js
import mongoose from 'mongoose';
const ClientSchema = new mongoose.Schema({
  name: {
      type: String,
      required: [true, "Please provide a client name"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
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


export default mongoose.model('Client', ClientSchema);