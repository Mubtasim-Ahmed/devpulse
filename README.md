# DevPulse

**Internal Tech Issue & Feature Tracker** — a REST API for software teams to report bugs, request features, and manage issue workflows with role-based access control.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Express](https://img.shields.io/badge/Express-4.18-lightgrey)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20%7C%20Local-blue)

---

## About

DevPulse is a backend API built with **TypeScript**, **Express.js**, and **PostgreSQL** (hosted on [Neon](https://neon.tech)). It supports JWT authentication, two user roles (**Contributor** and **Maintainer**), and full CRUD operations on issues with filtering and sorting.

---

## Key Features

| Feature | Description |
| --- | --- |
| **JWT Authentication** | Secure signup/login with bcrypt-hashed passwords (10 salt rounds) and 7-day tokens |
| **Role-Based Access** | Contributors and Maintainers with distinct permissions |
| **Issue Tracking** | Create bugs and feature requests with validation (title, description, type, status) |
| **Workflow** | Status flow: `open` → `in_progress` → `resolved` (Maintainers control status changes) |
| **Filtering & Sorting** | Filter by `type` and `status`; sort by `newest` or `oldest` |
| **RESTful API** | Consistent JSON responses with proper HTTP status codes |
| **Raw SQL** | Native `pg` driver with parameterized queries (no ORM, no JOINs) |
| **Cloud-Ready DB** | Works with Neon PostgreSQL (SSL) or any PostgreSQL instance |

---

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript (strict mode)
- **Framework:** Express.js
- **Database:** PostgreSQL ([Neon](https://neon.tech) recommended)
- **Auth:** jsonwebtoken + bcrypt
- **Other:** cors, dotenv

---

## User Roles

### Contributor
- Register and log in
- Create issues (`bug` or `feature_request`)
- View all issues
- Edit **own open** issues (title, description, type)
- Cannot delete issues or change status

### Maintainer
- Everything a Contributor can do
- Update **any** issue
- Change issue **status** on any issue
- **Delete** any issue

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- [npm](https://www.npmjs.com/)
- A PostgreSQL database ([Neon](https://neon.tech) free tier works well)


### Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | Public | Register a new user |
| `POST` | `/auth/login` | Public | Login and receive JWT |

**Signup body example:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123",
  "role": "contributor"
}
```

**Login body example:**

```json
{
  "email": "jane@example.com",
  "password": "SecurePass123"
}
```

Use the returned token in the `Authorization` header for protected routes:

```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

(`Bearer` prefix is also supported.)

### Issues

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/issues` | Authenticated | Create an issue |
| `GET` | `/issues` | Public | List issues (filter & sort) |
| `GET` | `/issues/:id` | Public | Get one issue |
| `PATCH` | `/issues/:id` | Authenticated | Update an issue |
| `DELETE` | `/issues/:id` | Maintainer | Delete an issue |

**Query parameters for `GET /issues`:**

| Param | Values |
| --- | --- |
| `sort` | `newest` (default), `oldest` |
| `type` | `bug`, `feature_request` |
| `status` | `open`, `in_progress`, `resolved` |

**Create issue example:**

```json
{
  "title": "Login button not responding",
  "description": "On mobile Safari the login button does nothing after tap",
  "type": "bug"
}
```

---

## Quick Test (cURL)

```bash
# Health check
curl http://localhost:5000/health

# Register
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"SecurePass123","role":"contributor"}'

# Login (save the token from the response)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123"}'

# List issues
curl http://localhost:5000/api/issues

# Create issue (replace TOKEN)
curl -X POST http://localhost:5000/api/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: TOKEN" \
  -d '{"title":"Test Bug","description":"At least twenty characters required here","type":"bug"}'
```

Test with [Postman](https://www.postman.com/) or any HTTP client for `POST`, `PATCH`, and `DELETE` routes.

---

## Response Format

**Success:**

```json
{
  "success": true,
  "message": "Operation description",
  "data": {}
}
```

**Error:**

```json
{
  "success": false,
  "message": "Error description",
  "errors": "Optional details"
}
```

---

## Database Schema

**users** — `id`, `name`, `email`, `password`, `role`, `created_at`, `updated_at`  

**issues** — `id`, `title`, `description`, `type`, `status`, `reporter_id`, `created_at`, `updated_at`

Tables are created automatically on server start and via `npm run db:setup`.

---

## npm Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start dev server with hot reload (tsx) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run db:setup` | Create database tables |

---

## Deployment

1. Push the repo to GitHub.
2. Deploy to [Vercel](https://vercel.com) or similar.
3. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`.
4. Build command: `npm run build` — Start command: `npm start`.

Use a managed PostgreSQL provider (Neon recommended) for production.

---

## Security Notes

- Never commit `.env` (it is listed in `.gitignore`).
- Use a strong `JWT_SECRET` (32+ characters) in production.
- Rotate database credentials if they were exposed.
- Passwords are never returned in API responses.

---



## Author

**Your Name** — replace with your GitHub profile when publishing.

- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)

---

Built with TypeScript, Express.js, and PostgreSQL.
