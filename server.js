import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';

// Load environment variables ASAP
import 'dotenv/config'; // Add this at the top

const PORT = process.env.PORT || 5000;

// 🛠️ Initialize database
connectDB();

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`➔ Health check: http://localhost:${PORT}/health`);
});

// ... rest of your shutdown handlers ...