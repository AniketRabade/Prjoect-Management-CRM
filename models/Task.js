//Task.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  // Basic task information
  name: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value >= new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['not started', 'in progress', 'completed', 'deferred', 'cancelled'],
    default: 'not started'
  },

  // Assignment information
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    // required: true
  },

  // Simplified relationship tracking
  relatedTo: {
    type: String,
    enum: ['Project', 'Lead', 'Client', 'Sale', 'Other'],
    required: true
  },
  relatedEntity: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'relatedTo'
  },
  

  // Time tracking
  completedAt: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || (this.status === 'completed' && value <= new Date());
      },
      message: 'Completed date must be when status is completed and in the past'
    }
  },
  reminders: [{
    type: Date,
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Reminder must be in the future'
    }
  }]
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Virtuals
taskSchema.virtual('formattedDueDate').get(function() {
  return this.dueDate?.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && 
         this.status !== 'completed' && 
         new Date() > this.dueDate;
});

// New virtuals for time calculations
taskSchema.virtual('totalDuration').get(function() {
  if (!this.completedAt || !this.createdAt) return null;
  return Math.round((this.completedAt - this.createdAt) / (1000 * 60)); // minutes
});

taskSchema.virtual('workingDays').get(function() {
  if (!this.dueDate || !this.createdAt) return null;
  const days = Math.ceil((this.dueDate - this.createdAt) / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
});

// Indexes
taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ relatedTo: 1, relatedEntity: 1 });

const Task = mongoose.model('Task', taskSchema);


export default Task;