import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide user ID']
  },
  date: {
    type: Date,
    required: [true, 'Please provide attendance date'],
    default: Date.now
  },
  checkIn: {
    type: Date,
    required: [true, 'Please provide check-in time']
  },
  checkOut: {
    type: Date
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday'],
    default: 'present',
    required: true
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  autoStatus: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  ipAddress: String,
  device: String
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted date
AttendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Indexes
AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ location: '2dsphere' });
AttendanceSchema.index({ status: 1 });
AttendanceSchema.index({ user: 1, status: 1 });

export default mongoose.model('Attendance', AttendanceSchema);