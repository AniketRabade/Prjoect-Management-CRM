// Lead.js
import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema({
  // Basic Lead Information
  name: {
    type: String,
    required: [true, "Lead name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  
  // Company Information
  company: {
    type: String,
    trim: true,
    maxlength: [100, "Company name cannot exceed 100 characters"]
  },
  
  // Contact Information
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
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  
  // Lead Details
  source: {
    type: String,
    required: [true, "Lead source is required"],
    enum: [
      "Website",
      "Referral",
      "Social Media",
      "Email Campaign",
      "Cold Call",
      "Trade Show",
      "Other"
    ],
    default: "Website"
  },
  
  status: {
    type: String,
    required: true,
    enum: [
      "New",
      "Contacted",
      "Qualified",
      "Proposal Sent",
      "Negotiation",
      "Closed Won",
      "Closed Lost",
      "Nurturing"
    ],
    default: "New"
  },
  
  // Potential Value - Expected revenue from the lead
  potentialValue: {
    type: Number,
    min: 0,
    set: v => Math.round(v * 100) / 100 // Store as fixed decimal
  },
  
  // Notes and Details
  notes: {
    type: String,
    maxlength: [2000, "Notes cannot exceed 2000 characters"]
  },
  
  // Relationship to Client (when lead is converted)
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  
  // Ownership and Tracking
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Timeline
  lastContactDate: Date,
  nextFollowUpDate: Date,
  conversionDate: Date
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
LeadSchema.virtual('isHot').get(function() {
  return this.status === 'Qualified' || this.status === 'Negotiation';
});

LeadSchema.virtual('daysSinceCreation').get(function() {
  if (!this.createdAt) return null;
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Indexes
LeadSchema.index({ status: 1 });
LeadSchema.index({ assignedTo: 1 });
LeadSchema.index({ source: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ nextFollowUpDate: 1 });

export default mongoose.model('Lead', LeadSchema);