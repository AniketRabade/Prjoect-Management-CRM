import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`)
});

// Add validation for required variables
const requiredVars = ['MONGO_URI', 'PORT'];
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`❌ Missing required environment variable: ${varName}`);
  }
});

export default {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT,
  // Add other variables here
};