const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  // Reference to Project
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },

  // Reference to Client
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },

  // Transaction Details (Owned by Sale)
  amount: {
    type: Number,
    required: true,
    min: 0,
    set: v => Math.round(v * 100) / 100 // Store as fixed decimal
  },
  saleDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'Bank Transfer', 'Check', 'Cash', 'Other'],
    required: true
  },

  // Sales Representative
  salesperson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // System Fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, { timestamps: true });


// Timestamp update
SaleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Sale', SaleSchema);