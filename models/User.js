
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Add this line at the top

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password in queries
    },
    phone: {
      type: String,
      required: [true, "Please provide a phone number"],
      unique: true,
      trim: true,
      match: [
        /^\+?[1-9]\d{1,14}$/,
        "Please provide a valid phone number",
      ],
    },
    accountType: {
      type: String,
      enum: ["admin", "manager", "employee", "client"],
      default: "employee",
    },
    permissions: {
      dashboard: { type: Boolean, default: false },
      users: { type: Boolean, default: false },
      tasks: { type: Boolean, default: false },
      leads: { type: Boolean, default: false },
      projects: { type: Boolean, default: false },
      clients: { type: Boolean, default: false },
      reports: { type: Boolean, default: false },
    },
    profilePicture: {
      type: String,
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);