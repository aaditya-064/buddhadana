import 'dotenv/config';
import { validateEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function main() {
  validateEnv();
  await connectDB();
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`[BDU CMS] Server running on port ${PORT}`);
    console.log(`[BDU CMS] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

main().catch((err) => {
  console.error('[BDU CMS] Fatal startup error:', err.message);
  process.exit(1);
});
