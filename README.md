# Portfolio Website Backend

Express.js backend and static frontend for Akshay Ranjith's photography portfolio. Includes admin panel for photo management, password reset via email, and a minimal gallery UI with lightbox and theme toggle.

## Project Structure

```
├── .github/workflows/     # CI lint + Render deploy trigger
├── src/
│   ├── config/            # Centralized env-based configuration
│   ├── routes/            # Express route handlers (auth, photos)
│   ├── middleware/         # Multer upload middleware
│   ├── services/          # Business logic (admin, email, photos)
│   └── app.js             # Express app assembly
├── public/                # Static frontend (HTML, CSS, JS)
├── data/                  # Runtime JSON data (photos.json, admin.json)
├── uploads/               # Uploaded images (gitignored)
├── server.js              # Entry point
├── render.yaml            # Render deployment blueprint
└── .env.example           # Environment variable template
```

## Getting Started

### Prerequisites

- Node.js 18+

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/portfolio-website-backend.git
cd portfolio-website-backend

# Install dependencies
npm install

# Copy env template and edit as needed
cp .env.example .env

# Start the dev server (auto-restarts on changes)
npm run dev
```

The server starts at `http://localhost:8080`. On first run, a default admin account is created (`akshay` / `admin123`) — change the password immediately.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` or `production` |
| `PORT` | `8080` | Server port |
| `SMTP_HOST` | *(empty)* | SMTP server host (falls back to Ethereal test account) |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | *(empty)* | SMTP username |
| `SMTP_PASS` | *(empty)* | SMTP password |
| `ADMIN_EMAIL` | `akshay1996ranjith@gmail.com` | Admin email for password resets |
| `DATA_DIR` | `./data` | Path to JSON data directory |
| `UPLOADS_DIR` | `./uploads` | Path to uploaded images |

### Scripts

| Command | Description |
|---|---|
| `npm start` | Start production server |
| `npm run dev` | Start dev server with auto-reload |
| `npm run lint` | Run ESLint |

## Deployment (Render)

1. Push this repo to GitHub.
2. In **Render**, create a new Web Service and connect your repo, or use the `render.yaml` Blueprint for auto-configuration.
3. Set environment variables in the Render dashboard (SMTP credentials, admin email, etc.).
4. To enable GitHub Actions auto-deploy: in Render, go to your service Settings > Deploy Hook, copy the URL, and add it as a GitHub secret named `RENDER_DEPLOY_HOOK_URL`.

### CI/CD

- **Pull requests** to `main` trigger the `ci.yml` workflow (lint check).
- **Pushes** to `main` trigger the `deploy.yml` workflow (calls Render deploy hook).

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/login` | Admin login |
| `POST` | `/api/forgot-password` | Request password reset token |
| `POST` | `/api/reset-password` | Reset password with token |
| `GET` | `/api/photos` | List all photos |
| `POST` | `/api/photos` | Upload a new photo (multipart) |
| `PUT` | `/api/photos/:id` | Update photo title/description/image |
| `DELETE` | `/api/photos/:id` | Delete a photo |
