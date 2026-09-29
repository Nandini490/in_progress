import mongoose from 'mongoose';

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Never logs or exposes connection credentials.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.trim()) {
    console.error('');
    console.error('══════════════════════════════════════════════════════════════════');
    console.error('  ❌  MONGODB_URI is not set. The database will NOT connect.');
    console.error('  📋  Copy server/.env.example to server/.env and configure it.');
    console.error('  💡  API requests requiring the database will return 500 errors.');
    console.error('══════════════════════════════════════════════════════════════════');
    console.error('');
    return false;
  }

  if (uri.includes('<username>') || uri.includes('<password>') || uri.includes('<cluster>')) {
    console.error('');
    console.error('══════════════════════════════════════════════════════════════════');
    console.error('  ❌  MONGODB_URI contains placeholder values.');
    console.error('  📋  Replace <username>, <password>, and <cluster> in your .env');
    console.error('  💡  Get your connection string from MongoDB Atlas dashboard.');
    console.error('══════════════════════════════════════════════════════════════════');
    console.error('');
    return false;
  }

  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅  [Database]: Connected successfully to MongoDB Atlas.');
    return true;
  } catch (err) {
    const safeMsg = (err.message || '').replace(/mongodb(?:\+srv)?:\/\/[^@\s]+@/gi, 'mongodb+srv://****:****@');
    console.error('❌  [Database Error]: Failed to connect to MongoDB Atlas:', safeMsg);
    return false;
  }
}

export function isConnected() {
  return mongoose.connection.readyState === 1;
}

export async function closeDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}
