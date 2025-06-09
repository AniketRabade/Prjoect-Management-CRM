const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  // Core Project Info
  name: {
    type: String,
    required: [true, "Project name is required"],
    trim: true,
    maxlength: [100, "Project name cannot exceed 100 characters"]
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },

  // Timeline
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !this.startDate || value > this.startDate;
      },
      message: "End date must be after start date"
    }
  },

  // Project Details
  description: {
    type: String,
    maxlength: [2000, "Description cannot exceed 2000 characters"]
  },

  status: {
    type: String,
    enum: ["Not Started", "In Progress", "On Hold", "Completed", "Cancelled"],
    default: "Not Started"
  },

  // Team & Ownership
  projectManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Financials
  budget: {
    type: Number,
    min: 0
  },

  expenses: {
    type: Number,
    default: 0,
    min: 0
  },

  // Project Tracking
  milestones: [{
    name: String,
    dueDate: Date,
    completed: Boolean,
    completedDate: Date
  }],

  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium"
  },

  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
}, { 
  timestamps: true,
});



module.exports = mongoose.model('Project', ProjectSchema);