# Deskline — IT Help Desk & Customer Support Management System

A full-stack IT Help Desk and Customer Support Management System built with **React**, **Node.js**, **Express.js**, **MongoDB (Mongoose)**, and **Tailwind CSS**. It centralizes customer complaints, employee technical requests, priority assignment, SLA tracking, specialist routing, and issue resolution workflows in a single workspace.

---

## Key Features

- **Admin Monitoring Dashboard**: Real-time KPI summary tracking total tickets, pending triage, in-progress investigations, resolved issues, SLA compliance rate, and average resolution time.
- **Category Queues & Routing**: Dedicated categorization and specialist routing across **Hardware**, **Software**, **Network**, and **Account** support queues with interactive category breakdown bars.
- **Ticket Creation & Intake**: Structured ticket submission portal and quick-create modal with requester details, department, asset/device tag, SLA-mapped priority (`Low`, `Medium`, `High`, `Critical`), and optional automatic specialist assignment.
- **Searchable & Filterable Ticket Queue**: Filter by workflow status (`Pending`, `In Progress`, `Resolved`), category, priority, assigned engineer, or live keyword search across ticket IDs, subjects, requesters, and asset tags, plus one-click CSV export.
- **Issue Resolution & Audit Trail**: Slide-over ticket detail drawer supporting status transitions, priority escalation, engineer reassignment, documented resolution summaries, and an interactive worklog thread for agent/requester updates and automated system audit logs.
- **Team Workload View**: Overview of support specialists showing open, active, and resolved ticket counts per engineer with direct queue filtering.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express.js (`tsx` in development)
- **Database**: MongoDB via Mongoose (`MONGODB_URI`), with automatic fallback to a persistent local JSON document store (`data/helpdesk.json`) when no external MongoDB instance is configured

---

## Project Structure

```text
├── server.ts                  # Express server, REST API routes, and Vite middleware setup
├── server/
│   └── repository.ts          # Mongoose Ticket schema, MongoDB/JSON repository, and seed data
├── src/
│   ├── App.tsx                # Root workspace layout and state orchestration
│   ├── index.css              # Tailwind CSS v4 theme configuration
│   ├── lib/
│   │   └── api.ts             # Typed API client, SLA/date formatters, and CSV exporter
│   ├── types/
│   │   └── helpdesk.ts        # Shared TypeScript interfaces for tickets, agents, and stats
│   └── components/
│       ├── AdminOverview.tsx      # Admin dashboard metrics, category bars, and watchlist
│       ├── TicketQueue.tsx        # Filterable ticket data table and search toolbar
│       ├── TicketDetailDrawer.tsx # Ticket triage, resolution workflow, and worklog drawer
│       ├── TicketForm.tsx         # Ticket submission form and New Ticket modal
│       ├── TeamRoutingView.tsx    # Support specialists and workload overview
│       ├── SemanticLabels.tsx     # Status, priority, category labels, and agent avatars
│       ├── Sidebar.tsx            # Navigation sidebar and responsive mobile drawer
│       └── TopHeader.tsx          # Breadcrumb header and primary actions
├── .env.example               # Environment variable template
└── package.json               # Scripts and dependencies
```

---

## REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/agents` | List configured support specialists |
| `GET` | `/api/stats` | Compute dashboard totals, category breakdowns, SLA compliance, and recent notes |
| `GET` | `/api/tickets` | List tickets (supports `status`, `category`, `priority`, `assigneeId`, `search`) |
| `GET` | `/api/tickets/:id` | Retrieve a single ticket by UUID or ticket number (e.g., `HD-1041`) |
| `POST` | `/api/tickets` | Create a new support ticket with validation and optional specialist routing |
| `PATCH` | `/api/tickets/:id` | Update status, priority, category, assignee, or resolution summary |
| `POST` | `/api/tickets/:id/notes` | Append an agent or requester note to the ticket worklog |
| `DELETE` | `/api/tickets/:id` | Delete a ticket record |

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables (Optional)

Copy `.env.example` to `.env` if you want to connect an external MongoDB database:

```env
MONGODB_URI="mongodb://localhost:27017/deskline"
```

If `MONGODB_URI` is left blank or omitted, the server automatically stores and seeds ticket data in `data/helpdesk.json`.

### 3. Run in Development

```bash
npm run dev
```

The Express API and Vite frontend run together on `http://localhost:3000`.

### 4. Build & Run in Production

```bash
npm run build
NODE_ENV=production npm start
```

### 5. Typecheck

```bash
npm run lint
```
