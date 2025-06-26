//User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    // Update the phone validation regex to be more flexible
phone: {
  type: String,
  required: [true, "Please provide a phone number"],
  trim: true,
  validate: {
    validator: function(v) {
      // More flexible phone number validation
      return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,15}$/.test(v);
    },
    message: props => `${props.value} is not a valid phone number!`
  }
},
    accountType: {
      type: String,
      enum: ["admin", "manager", "employee"],
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
      default: 'default-profile.jpg'
    },
  },
  { timestamps: true }
);

// Hash password before saving
// UserSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) {
//     next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });
UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    console.error('Password hashing error:', err);
    next(err);
  }
});

// Method to compare passwords
// UserSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };
UserSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (err) {
    console.error('Password comparison error:', err);
    return false;
  }
};






export default mongoose.model("User", UserSchema);