# Alumni Portal - Windows Local Development Setup

Complete guide to run the Alumni Portal locally on Windows with VS Code.

## Prerequisites

Install these on your Windows machine:
1. **Node.js** (v18+): https://nodejs.org/
2. **Python** (v3.11+): https://www.python.org/
3. **Git**: https://git-scm.com/
4. **VS Code**: https://code.visualstudio.com/

## Project Structure

```
alumni-portal/
├── backend/          # FastAPI Python backend
│   ├── app/
│   ├── .env.example
│   └── requirements.txt
├── frontend/         # React/Vite frontend
│   ├── src/
│   ├── .env.example
│   └── package.json
├── start.sh          # Startup script
└── package.json
```

## Step 1: Clone & Setup Project

```bash
# Clone the repository
git clone <your-repo-url> alumni-portal
cd alumni-portal
```

## Step 2: Backend Setup

### 2.1 Create Python Virtual Environment

```bash
# Open terminal in VS Code (Ctrl + `)
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
```

### 2.2 Install Python Dependencies

```bash
# Install required packages
pip install -r requirements.txt
```

### 2.3 Configure Backend Environment

```bash
# Copy example to actual env file
copy .env.example .env
```

Edit `backend/.env` with your values:

```env
# MongoDB Connection (UPDATE WITH YOUR DATABASE)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/alumni?retryWrites=true&w=majority
DATABASE_NAME=alumni

# JWT Secret (Generate random: openssl rand -hex 32 or use online generator)
JWT_SECRET=your-min-32-character-random-key-here

# Admin Credentials
ADMIN_EMAIL=admin@alumni.com
ADMIN_PASSWORD_HASH=$2b$12$SlLKqT6CjvYtVWDEHkVSXuVjV1MBxFxqcr8K2WrH8q4QkqJ5A0QQu

# URLs for local development
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Environment
ENVIRONMENT=development

# Optional: Razorpay (for payments)
RZP_KEY_ID=your_key
RZP_KEY_SECRET=your_secret
RZP_WEBHOOK_SECRET=your_webhook_secret

# SMTP (for emails) - optional for local dev
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_TLS=True
```

### 2.4 Run Backend

```bash
# From backend directory with venv activated
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend running at: **http://localhost:8000**

API docs available at: **http://localhost:8000/docs**

## Step 3: Frontend Setup

### 3.1 Install Node Dependencies

Open a **new** terminal in VS Code:

```bash
cd frontend
npm install
```

### 3.2 Configure Frontend Environment

```bash
# Copy example to env file
copy .env.example .env.local
```

Edit `frontend/.env.local`:

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_APP_TITLE=Alumni Portal
VITE_LOG_LEVEL=debug
```

### 3.3 Run Frontend

```bash
# From frontend directory
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

## Step 4: Access the Portal

Open your browser and visit:

- **Alumni Portal**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5173/admin
- **API Documentation**: http://localhost:8000/docs

## Login Credentials

**Admin Login:**
- Email: `admin@alumni.com`
- Password: Your admin password (from `ADMIN_PASSWORD_HASH`)

**Test Alumni:**
- Create via Admin Dashboard → Users → Add User
- Temporary password format: `{registration_number}123`

## VS Code Setup (Recommended)

### Extensions to Install

1. **Python** - ms-python.python
2. **Pylance** - ms-python.vscode-pylance
3. **ES7+ React/Redux/React-Native** - dsznajder.es7-react-js-snippets
4. **Prettier** - esbenp.prettier-vscode
5. **Thunder Client** (or Postman) - rangav.vscode-thunder-client

### VS Code Settings

Create `.vscode/settings.json` in project root:

```json
{
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "ms-python.python"
  }
}
```

## Troubleshooting

### Backend Won't Start

```bash
# Clear Python cache
del backend\app\__pycache__ -Recurse -Force

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Frontend Won't Start

```bash
# Clear node cache
del frontend\node_modules -Recurse -Force
del frontend\package-lock.json

# Reinstall
npm install
```

### MongoDB Connection Error

- Verify `MONGO_URI` in `.env` is correct
- Check MongoDB connection string (IP whitelist, credentials)
- Ensure MongoDB cluster is running

### CORS Errors

This means frontend can't reach backend. Check:
- Backend URL in `.env.local`: `VITE_BACKEND_URL=http://localhost:8000`
- Backend is running and accessible
- No firewall blocking port 8000

## Development Workflow

1. **Terminal 1**: Backend
   ```bash
   cd backend
   venv\Scripts\activate
   python -m uvicorn app.main:app --reload
   ```

2. **Terminal 2**: Frontend
   ```bash
   cd frontend
   npm run dev
   ```

3. Edit code → Auto-reload happens automatically ✅

## Database

### MongoDB Connection

The app uses MongoDB. For local development, you can:

- **Option 1**: Use MongoDB Atlas (cloud) - easiest
- **Option 2**: Install MongoDB locally (Advanced)
- **Option 3**: Use Docker with `docker run mongo`

### Check Database

```bash
# Using MongoDB Compass GUI
# Connection: mongodb+srv://username:password@cluster.mongodb.net/alumni
```

## Production Build

```bash
# Build frontend
cd frontend
npm run build

# Output in: frontend/dist/
```

## Common Commands

```bash
# Backend
python -m uvicorn app.main:app --reload  # Dev mode
python -m uvicorn app.main:app           # Production

# Frontend
npm run dev      # Development
npm run build    # Production build
npm run preview  # Preview production build

# Database
# Use MongoDB Compass GUI for visual management
```

## Get Help

- **Backend Docs**: http://localhost:8000/docs
- **React Docs**: https://react.dev
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Vite Docs**: https://vitejs.dev

---

**Ready to start?** Run both terminals and navigate to http://localhost:5173 🚀
