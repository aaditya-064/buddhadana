# Buddha Dana Udhyog Pvt. Ltd. — CMS

Production Content Management System for Buddha Dana Udhyog Pvt. Ltd.

## Architecture

```
React/Vite Frontend (port 3000)
        │
        │ HTTP/HTTPS API
        ▼
Node.js + Express Backend (port 5000)
        │
   ┌────┴────┐
   ▼         ▼
MongoDB    Cloudinary
(truth)    (files)
   │
   ▼
  n8n (workflows)
```

## Project Structure

```
bdu_cms/
├── frontend/          → This directory (React/Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── contexts/
│   │   ├── types.ts
│   │   └── App.tsx
│   └── package.json
│
├── backend/           → Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   └── seed.ts
│   └── package.json
│
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Cloudinary account
- (Optional) n8n instance

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run seed    # Creates admin user
npm run dev     # Development server on port 5000
```

### 2. Frontend Setup

```bash
npm install
cp .env.example .env
# Set VITE_API_BASE_URL to your backend URL
npm run dev     # Development server on port 3000
```

## Environment Variables

### Backend (backend/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `ENCRYPTION_KEY` | ✅ | AES-256-GCM key for vault (min 32 chars) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `N8N_BASE_URL` | ❌ | n8n instance URL |
| `N8N_API_KEY` | ❌ | n8n API key |
| `N8N_WEBHOOK_SECRET` | ❌ | n8n webhook signing secret |
| `CORS_ORIGINS` | ❌ | Comma-separated allowed origins |
| `FRONTEND_URL` | ❌ | Frontend URL for CORS |
| `PORT` | ❌ | Server port (default: 5000) |
| `MAX_FILE_SIZE` | ❌ | Max upload size in bytes (default: 50MB) |

### Frontend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ | Backend API base URL |

## Production Build

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
npm run build
# Serve the dist/ directory with any static file server
```

## Deployment

### Environment Setup

1. Set up MongoDB (Atlas or self-hosted)
2. Create Cloudinary account
3. (Optional) Set up n8n instance
4. Configure all required environment variables
5. Run `npm run seed` to create the admin user
6. Start the backend and frontend

### SPA Routing

For production deployment, configure your web server to serve `index.html` for all routes:

**Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Vercel/Netlify:** Automatic SPA routing support.

## Features

- **Authentication**: JWT-based with bcrypt password hashing
- **Role-based Access**: Admin and Staff roles
- **File Management**: Cloudinary-backed file storage with folder organization
- **Projects**: Full project management with tasks
- **Analytics**: Sales, purchases, expenses tracking with charts
- **Data Import**: XLSX, CSV, JSON import with validation
- **Vault**: AES-256-GCM encrypted credential storage
- **n8n Integration**: Real workflow management and execution
- **Audit Logging**: Complete activity tracking

## Security

- Passwords hashed with bcrypt (12 rounds)
- Vault credentials encrypted with AES-256-GCM
- JWT authentication with configurable expiration
- Backend authorization for all destructive operations
- No secrets exposed to frontend
- Cloudinary server-side uploads only
- n8n API key never reaches browser
- CORS configured for specific origins
- File type and size validation
- Audit logging for sensitive operations

## Troubleshooting

### "Failed to fetch" errors
- Verify backend is running and accessible
- Check `VITE_API_BASE_URL` matches your backend URL
- Verify CORS origins include your frontend URL

### File upload fails
- Check Cloudinary credentials in backend .env
- Verify file type is in the allowed list
- Check file size doesn't exceed MAX_FILE_SIZE

### n8n shows "Not Configured"
- Set `N8N_BASE_URL` and `N8N_API_KEY` in backend .env
- Verify n8n instance is accessible from backend

### Vault access denied
- Only admin users can reveal passwords
- Check `ENCRYPTION_KEY` hasn't changed since entries were created
