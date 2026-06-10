# BotFlow Studio 🤖

A Next.js app for WhatsApp chatbot agencies to **build, edit, and demo** bot flows to clients.

Each client gets multiple bot flows. Each flow is a visual node graph built with **ReactFlow** — fully interactive, drag-and-drop, with a live WhatsApp chat simulator.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Flow canvas | @xyflow/react (React Flow v12) |

---

## Project Structure

```
botflow-app/
├── prisma/
│   ├── schema.prisma          # DB models: Client, BotFlow, FlowNode
│   └── seed.ts                # Seeds SpaceSolar demo client + 26 nodes
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── clients/
│   │   │       ├── route.ts                         # GET all, POST new client
│   │   │       └── [clientId]/
│   │   │           ├── route.ts                     # GET, DELETE client
│   │   │           └── flows/
│   │   │               ├── route.ts                 # GET flows, POST new flow
│   │   │               └── [flowId]/
│   │   │                   ├── route.ts             # GET, PUT, DELETE flow
│   │   │                   └── nodes/
│   │   │                       └── route.ts         # GET nodes, POST, PUT bulk-save
│   │   │
│   │   └── (dashboard)/
│   │       ├── layout.tsx                           # Sidebar layout
│   │       └── clients/
│   │           ├── page.tsx                         # Client list
│   │           └── [clientId]/
│   │               ├── page.tsx                     # Client detail + flows
│   │               └── flows/
│   │                   └── [flowId]/
│   │                       └── page.tsx             # 🔥 ReactFlow builder page
│   │
│   ├── components/
│   │   ├── flow/
│   │   │   ├── BotNode.tsx      # Custom ReactFlow node component
│   │   │   └── NodeEditor.tsx   # Right-panel node editor
│   │   └── simulator/
│   │       └── ChatSimulator.tsx # WhatsApp UI chat simulator
│   │
│   └── lib/
│       ├── prisma.ts            # Singleton Prisma client
│       └── types.ts             # Shared TypeScript types
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local and set your DATABASE_URL
```

### 3. Push schema to DB

```bash
npm run db:push
```

### 4. Seed sample data (SpaceSolar — 26 nodes)

```bash
npm run db:seed
```

### 5. Run dev server

```bash
npm run dev
```

Open http://localhost:3000

---

## How It Works

### Data model

```
Client (e.g. SpaceSolar)
  └── BotFlow (e.g. "SpaceSolar Support Bot")
        └── FlowNode[]
              ├── key        → unique ID used in targets (e.g. "welcome_helio")
              ├── title      → display name
              ├── message    → bot message text
              ├── replies[]  → quick reply button labels (ordered)
              └── targets[]  → target node keys matching replies by index
```

### Flow Builder

- Visual drag-and-drop canvas powered by **@xyflow/react**
- Each `FlowNode` is rendered as a custom `BotNode` component
- Edges are auto-generated from `replies → targets` mappings
- Clicking a node opens the **NodeEditor** right panel
- In the editor: edit title, message, quick replies, and target routing
- Drag nodes to reposition; positions saved to DB
- **Auto Layout** button arranges nodes in a grid
- **Save** does a bulk `PUT /api/.../nodes` replacing all nodes in one transaction

### Chat Simulator

- Click **▶ Demo** button to open the WhatsApp simulator overlay
- Simulates real WhatsApp UI: bot bubbles (left), user bubbles (right)
- "Typing…" animation with realistic delay based on message length
- Click quick reply chips to navigate through the flow
- **Restart** resets to the first node

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/clients` | List all clients |
| POST | `/api/clients` | Create client `{name, industry, email, phone}` |
| GET | `/api/clients/:id` | Get client with flows |
| DELETE | `/api/clients/:id` | Delete client (cascades flows/nodes) |
| GET | `/api/clients/:id/flows` | List flows with nodes |
| POST | `/api/clients/:id/flows` | Create flow `{name, description}` — bootstraps welcome node |
| GET | `/api/clients/:id/flows/:fid` | Get flow with nodes |
| PUT | `/api/clients/:id/flows/:fid` | Update flow name/description |
| DELETE | `/api/clients/:id/flows/:fid` | Delete flow |
| GET | `/api/clients/:id/flows/:fid/nodes` | List nodes |
| POST | `/api/clients/:id/flows/:fid/nodes` | Add single node |
| PUT | `/api/clients/:id/flows/:fid/nodes` | **Bulk-save all nodes** (used by builder) |

---

## Adding a New Client Demo

1. Go to `/clients` → **+ New Client** → fill name/industry
2. Click the client → **+ New Flow** → name it (e.g. "Restaurant Menu Bot")
3. The flow opens with a single welcome node
4. Add nodes with **+ Node**, edit messages and quick replies
5. Use **Auto Layout** to arrange, then **Save**
6. Click **▶ Demo** to show the client

---

## Extending

- **Shareable demo link** — add a public `/demo/[flowId]` route with just the simulator (no editing)
- **Auth** — wrap dashboard in NextAuth or Clerk for agency owner login
- **Drag to connect** — ReactFlow `onConnect` is already wired; you can extend it to auto-create reply labels
- **Import from JSON** — add a button to paste the JSON from the original HTML flow editor
- **Templates** — duplicate flows between clients using Prisma's createMany

---

## Docker Setup

### Production (recommended)

```bash
# 1. Build and start — Postgres + App in one command
docker compose up --build

# App runs at http://localhost:3000
# Postgres exposed at localhost:5432
```

On first boot the entrypoint script will:
1. Wait for Postgres to be healthy
2. Run `prisma db push` (creates all tables)
3. Seed SpaceSolar demo data (only if DB is empty)
4. Start Next.js

Data is persisted in the `postgres_data` Docker volume — restarts are safe.

### Dev mode (hot reload)

```bash
docker compose -f docker-compose.dev.yml up
```

Source files are mounted live — edit locally, browser auto-reloads. No rebuild needed.

### Useful commands

```bash
# View logs
docker compose logs -f app
docker compose logs -f postgres

# Open Prisma Studio (DB browser) — run on host, not in container
DATABASE_URL=postgresql://botflow:botflow_secret@localhost:5432/botflow_db npx prisma studio

# Stop everything
docker compose down

# Stop and wipe DB volume (fresh start)
docker compose down -v

# Rebuild app image only
docker compose build app
docker compose up -d app
```

### Environment variables

| Variable | Default in compose | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://botflow:botflow_secret@postgres:5432/botflow_db` | Postgres connection string |
| `PORT` | `3000` | Next.js port |
| `NODE_ENV` | `production` | Node environment |

To change the Postgres password, update `POSTGRES_PASSWORD` in `docker-compose.yml` and the `DATABASE_URL` in the app service to match.
