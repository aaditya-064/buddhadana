const REQUIRED_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const OPTIONAL_VARS = [
  'N8N_BASE_URL',
  'N8N_API_KEY',
  'N8N_WEBHOOK_SECRET',
  'CORS_ORIGINS',
  'FRONTEND_URL',
];

export function validateEnv(): void {
  const missing: string[] = [];

  for (const v of REQUIRED_VARS) {
    if (!process.env[v] || process.env[v]!.trim() === '') {
      missing.push(v);
    }
  }

  if (missing.length > 0) {
    console.error('[BDU CMS] Missing required environment variables:');
    missing.forEach((v) => console.error(`  - ${v}`));
    console.error('\nPlease set these in your .env file. See backend/.env.example for reference.');
    process.exit(1);
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('[BDU CMS] JWT_SECRET must be at least 32 characters long.');
    process.exit(1);
  }

  // Validate ENCRYPTION_KEY
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 32) {
    console.error('[BDU CMS] ENCRYPTION_KEY must be at least 32 characters long.');
    process.exit(1);
  }

  console.log('[BDU CMS] Environment validation passed.');
}

export function isN8nConfigured(): boolean {
  return !!(process.env.N8N_BASE_URL && process.env.N8N_API_KEY);
}
