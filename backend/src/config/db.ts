import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI!;

  try {
    await mongoose.connect(uri);
    console.log('[BDU CMS] Connected to MongoDB.');
  } catch (err) {
    console.error('[BDU CMS] MongoDB connection error:', (err as Error).message);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('[BDU CMS] MongoDB error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[BDU CMS] MongoDB disconnected.');
  });
}
