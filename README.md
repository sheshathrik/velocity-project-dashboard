# Velocity — Real-Time Client Project Dashboard

A full-stack, enterprise-grade web application built for the **Velozity Global Solutions Technical Hiring Assessment**.

[![Live App on Vercel](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://velocity-project-dashboard.vercel.app)
[![Backend API on Render](https://img.shields.io/badge/Backend%20API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://velocity-project-dashboard.onrender.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## 🌐 Live Production Deployments

- 🖥️ **Live Web Application (Vercel)**: **[https://velocity-project-dashboard.vercel.app](https://velocity-project-dashboard.vercel.app)**
- ⚡ **Live Backend API (Render)**: **[https://velocity-project-dashboard.onrender.com](https://velocity-project-dashboard.onrender.com)**
- 🩺 **API Health Check**: **[https://velocity-project-dashboard.onrender.com/health](https://velocity-project-dashboard.onrender.com/health)**
- 📁 **GitHub Repository**: **[https://github.com/sheshathrik/velocity-project-dashboard](https://github.com/sheshathrik/velocity-project-dashboard)**

---

## Quick Demo Credentials

All test accounts share the default password: **`Password123!`**

| Role | Name | Email | Permissions & Data Isolation |
| :--- | :--- | :--- | :--- |
| **Admin** | Alex Vance | `admin@velozity.com` | Full access: all clients, projects, tasks, global live feed, active user count. |
| **Project Manager** | Sarah Connor | `pm.sarah@velozity.com` | Can only view and edit projects she created; sees activity for her projects only. |
| **Project Manager** | Michael Scott | `pm.michael@velozity.com` | Completely isolated from Sarah's projects; manages mobile banking app. |
| **Developer** | Ravi Kumar | `dev.ravi@velozity.com` | Can only view and update tasks assigned to him; strictly blocked from other devs. |
| **Developer** | Anita Desai | `dev.anita@velozity.com` | Can only view and update tasks assigned to her; strictly isolated. |

> [!TIP]
> **1-Click Role Switcher**: A quick account switcher is embedded both on the **Login page** and in the **Top Navigation Bar** to allow evaluators to instantly switch roles without retyping passwords.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Client["React 18 + TypeScript Client (Vite + Tailwind CSS)"]
        UI["Modern Responsive UI"]
        AuthCtx["Auth Context (Access Token in Memory)"]
        SocketCtx["Socket Context (WebSockets Transport)"]
        FilterHook["React Router URL Query Params"]
    end

    subgraph Server["Node.js + Express + TypeScript Backend"]
        REST["Express REST API (/api)"]
        AuthMid["authenticateJWT & authorizeRoles Middleware"]
        ZodVal["Zod Server-Side Validation"]
        CronJob["node-cron Overdue Scheduler (Every 1m)"]
        SocketServer["Socket.io Server (Rooms & Presence)"]
    end

    subgraph Database["PostgreSQL 16/18 Database"]
        Prisma["Prisma ORM"]
        Tables[("Users, Projects, Tasks, Logs, Notifications, RefreshTokens")]
    end

    UI -->|"Bearer Auth & HttpOnly Cookie"| REST
    UI <-->|"Pure WebSocket Protocol"| SocketServer
    REST --> AuthMid
    AuthMid --> ZodVal
    ZodVal --> Prisma
    Prisma --> Tables
    CronJob -->|"Periodic Overdue Scan (Every 1m)"| Prisma
    CronJob -->|"Broadcast Overdue Events"| SocketServer
    SocketServer -->|"Real-Time Feed & Live Presence"| SocketCtx
```

---

## Local Setup Instructions

### Option A: Running with Docker (Preferred)

1. Ensure Docker Desktop is installed and running.
2. Clone the repository and navigate into the folder:
   ```bash
   git clone <repo-url>
   cd Velocity
   ```
3. Launch all services with Docker Compose:
   ```bash
   docker-compose up --build
   ```
4. Access the applications:
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)

---

### Option B: Local Setup with Node.js & PostgreSQL

#### 1. Prerequisites
- Node.js `v20+` or `v22+`
- PostgreSQL `14+` running locally on port `5432`

#### 2. Environment Configuration
Create `server/.env` (or copy `.env.example`):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/velocity_dashboard?schema=public"
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET="velozity_access_super_secret_jwt_key_2026_x89"
JWT_REFRESH_SECRET="velozity_refresh_super_secret_jwt_key_2026_q41"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_DAYS=7
```

#### 3. Database Initialization & Seeding
```bash
# In the repository root
npm run install:all

# Generate Prisma Client & push schema to PostgreSQL
cd server
npx prisma generate
npx prisma db push

# Seed 1 Admin, 2 PMs, 4 Developers, 3 Projects, 16 Tasks, and Logs
npm run seed
cd ..
```

#### 4. Start Development Servers
```bash
# In the repository root, run both backend & frontend concurrently:
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## Database Schema & Indexing Decisions

### Schema Structure
- **`User`**: Core accounts, hashed bcrypt passwords, role enum (`ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`).
- **`RefreshToken`**: Cryptographically secure 80-char tokens, expiration timestamps, revocation flags for token rotation.
- **`Client`**: Organization details for agency clients.
- **`Project`**: Client project managed by a specific PM (`managerId`) with foreign key constraint to `Client`.
- **`Task`**: Int autoincrement ID (enabling human-readable references like `"Task #12"`), relations to `Project` and `User` (assigned developer), status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`), priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and `isOverdue` boolean flag.
- **`TaskActivityLog`**: Immutable audit logs recording `userId`, `taskId`, `projectId`, `details`, and human-formatted `message` (e.g., `"Ravi moved Task #12 from In Progress → In Review"`).
- **`Notification`**: In-app notifications with `isRead` flag and timestamps.

### Indexing Decisions & Justifications
| Index | Table | Justification |
| :--- | :--- | :--- |
| `@@index([assignedDeveloperId])` | `Task` | Fast lookups for the Developer dashboard and role filtering when a developer queries only tasks assigned to them. |
| `@@index([projectId])` | `Task` | Optimizes project Kanban board loads when fetching all tasks belonging to a specific client project. |
| `@@index([status])` | `Task` | High-frequency filtering by task lane on boards and dashboard metrics aggregations. |
| `@@index([dueDate, status])` | `Task` | **Composite index** optimizing the background overdue cron scheduler. The query `WHERE dueDate < NOW() AND status != 'DONE' AND isOverdue = false` executes an index range scan rather than a full sequential table scan. |
| `@@index([managerId])` | `Project` | Ensures $O(1)$ indexed retrieval when a Project Manager queries only projects they created. |
| `@@index([projectId, createdAt(sort: Desc)])` | `TaskActivityLog` | Speeds up the 20-event activity feed retrieval scoped to a specific project. |
| `@@index([createdAt(sort: Desc)])` | `TaskActivityLog` | Optimizes Admin global feed and pagination for the most recent system-wide events. |
| `@@index([userId, isRead])` | `Notification` | Accelerates fetching the unread count badge on every user session without scanning all notifications. |

---

## Architectural Decisions

### 1. WebSocket Library Choice: Socket.io with Pure WebSocket Transport
- **Why Socket.io?**: Socket.io provides production-tested room primitives (`socket.join('project:<id>')`, `socket.join('user:<id>')`, `socket.join('role:ADMIN')`), built-in reconnection management with exponential backoff, and stateful socket attachments.
- **Enforcing Pure WebSockets**: Standard HTTP polling is explicitly disabled (`transports: ['websocket']`) to strictly comply with assessment requirements ("no long-polling, no SSE").
- **Presence Tracking**: Live online presence is maintained in memory using connected unique user IDs, broadcasting `presence:update` to all connected clients.

### 2. Job Queue Choice: `node-cron`
- **Why `node-cron` over Bull/BullMQ?**:
  - `node-cron` executes directly in-process with zero external infrastructure overhead (avoiding the need for a standalone Redis cluster for an evaluation environment).
  - The overdue check is an idempotent, batched query (`UPDATE tasks SET isOverdue = true WHERE dueDate < NOW() AND status != 'DONE' AND isOverdue = false`).
  - BullMQ is the recommended upgrade path in distributed, horizontally scaled multi-container clusters where a distributed lock is necessary to prevent duplicate worker execution.

### 3. Token Storage Approach: Short-Lived Access Token + HttpOnly Refresh Cookie
- **Access Token**: Short-lived (15 minutes), held strictly in JavaScript memory (`AuthContext`). It is never written to `localStorage` or `sessionStorage`, eliminating exposure to Cross-Site Scripting (XSS) credential theft.
- **Refresh Token**: Stored in a secure `HttpOnly`, `SameSite=Lax`, `Path=/api/auth` cookie. JavaScript running in the browser cannot read this cookie, providing strong mitigation against token exfiltration.
- **Refresh Token Rotation**: Each time `/api/auth/refresh` is hit, the current token is revoked in PostgreSQL and an entirely new refresh token is issued. If a revoked token is ever presented, the request is immediately rejected.

---

## Role-Based Access Control (RBAC) Enforcement

Security is enforced at the **API layer** across all Express controllers:
1. **Developer Isolation**:
   - `GET /api/tasks`: If `req.user.role === 'DEVELOPER'`, the database query forcefully sets `where.assignedDeveloperId = req.user.userId`. Passing foreign task IDs returns `403 Forbidden`.
   - `PATCH /api/tasks/:id/status`: Before updating, the API checks `task.assignedDeveloperId === req.user.userId`. A developer cannot alter another developer's task even by crafting manual curl requests.
   - Developers are blocked from creating projects or deleting tasks (`403 Forbidden`).
2. **Project Manager Isolation**:
   - `GET /api/projects/:id` and `PUT /api/projects/:id`: Verifies `project.managerId === req.user.userId`. PMs cannot view, edit, or delete another PM's projects.
   - Activity feeds and task lists are strictly filtered to the PM's managed projects.
3. **Admin**:
   - Holds unrestricted access across all client projects, global activity feeds, and user listings.

---

## Explanation Field (150–250 Words)

> **Hardest problem solved, real-time role-filtered feed, and what I'd do differently:**
>
> The most intricate engineering challenge was building the real-time activity feed with dual-layer role filtering that remains resilient across reconnections. I solved this by decoupling event persistence from real-time dispatch: every state mutation atomically commits a formatted `TaskActivityLog` row to PostgreSQL before emitting socket events. For real-time delivery, sockets join scoped rooms (`role:ADMIN`, `user:<managerId>`, `user:<developerId>`, and `project:<projectId>`). When a task changes, the backend broadcasts to the project room, the Admin role room, the project manager's user room, and the assigned developer's user room. This ensures developers only receive events for their assigned tasks, PMs only receive events for their projects, and Admins monitor a single global stream—without transmitting unauthorized payloads across the wire. For offline catchup, rather than relying on ephemeral in-memory queues that drop messages on restart, clients fetch the last 20 missed events directly from PostgreSQL via an indexed `createdAt DESC` query filtered by the authenticated user's role.
>
> If building this for a large-scale enterprise cluster, I would replace `node-cron` with BullMQ backed by Redis for distributed task locking, add Redis Pub/Sub adapter to Socket.io to support horizontal node scaling, and implement Cursor-based keyset pagination for historical activity logs.

---

## Known Limitations
1. **Single Node Scheduler**: `node-cron` runs within the Express process; running multiple backend replicas in production would trigger concurrent cron executions without an advisory database lock (e.g., `pg_advisory_lock`) or Redis-based distributed queue like BullMQ.
2. **In-Memory Presence Set**: The online user presence count is tracked in a local Node process Set. In a multi-instance deployment, this should use a Redis Set (`SADD` / `SREM` / `SCARD`).

---

## License
MIT License. Developed for Velozity Global Solutions Technical Hiring Assessment.

