# SETUP

## Prerequisites

- [Bun](https://bun.sh) installed (`bun --version` to check)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

---

## 1. Start PostgreSQL and Redis

This project uses **local disk storage** (mock) instead of real S3.

Create `docker-compose.yml` in the project root:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: founder_files
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
```

Start both:

```bash
docker compose up -d
```

Verify they're running:

```bash
docker ps
```

You should see `postgres` and `redis` containers with status "Up".

---

## 2. Configure environment variables

Create a `.env` file in the project root:

```
DATABASE_URL="postgresql://username:password@localhost:5432/founder_files?schema=public"
PORT=4000
```

---

## 3. Install dependencies

```bash
bun install
```

Key packages: `express`, `@prisma/client` + `prisma`, `ioredis`, `bullmq`,
`multer`, `socket.io`.
``

---

## 4. Set up the database

Create the `founder_files` table via Prisma migration:

```bash
bunx prisma generate
bunx prisma migrate dev --name init
```

This reads `prisma/schema.prisma` (which defines the `FounderFile` model
and `FileStatus` enum: `UPLOADED | PROCESSING | PROCESSED | FAILED`) and
applies it to Postgres.

To inspect the database visually at any point:

```bash
bunx prisma studio
```

---

## 5. Run the service (3 processes)

This is an event-driven system — each piece runs as an independent
process, exactly as it would in production (separate services/containers).
Open **three terminals**:

**Terminal 1 — HTTP server (Express + Socket.IO):**
```bash
bun run src/server.ts
```

**Terminal 2 — Stream consumer** (reads Redis Stream, enqueues BullMQ jobs):
```bash
bun run src/infrastructure/redis/streamConsumer.ts
```

**Terminal 3 — BullMQ worker** (does the actual processing):
```bash
bun run src/infrastructure/queue/fileProcessWorker.ts
```

All three need to be running simultaneously for the full pipeline to work.

---

## 6. Example API calls

### Upload a file

```bash
curl.exe -X POST http://localhost:4000/api/founders/founder-123/files \
  -F "file=@C:\path\to\some\file.pdf"
```

Response:
```json
{
  "id": "b91c827d-39b1-42d3-8d95-6280898f3def",
  "founderId": "founder-123",
  "fileName": "file.pdf",
  "fileUrl": "/uploads/b91c827d-...-file.pdf",
  "status": "UPLOADED",
  "createdAt": "2026-07-02T13:30:13.753Z",
  "updatedAt": "2026-07-02T13:30:13.753Z"
}
```

At this instant, the file is saved to `/uploads`, the DB row exists, and an
event has been published to `file_processing_stream`.

### Check file status

```bash
curl.exe http://localhost:4000/api/founders/founder-123/files/b91c827d-39b1-42d3-8d95-6280898f3def
```

Response (once the worker has picked it up, a few seconds later):
```json
{
  "id": "b91c827d-39b1-42d3-8d95-6280898f3def",
  "founderId": "founder-123",
  "fileName": "file.pdf",
  "fileUrl": "/uploads/b91c827d-...-file.pdf",
  "status": "PROCESSED",
  "createdAt": "2026-07-02T13:30:13.753Z",
  "updatedAt": "2026-07-02T13:33:05.991Z"
}
```

`status` moves through `UPLOADED` → `PROCESSING` → `PROCESSED` (or
`FAILED`, simulated randomly in the worker for testing that path) as the
pipeline runs. Watch the consumer and worker terminal logs to see each
stage happen in real time.

---

## 7. Real-time updates via Socket.IO

A minimal test client is included: `test-client.html` in the project root.
Open it directly in a browser .

It connects to `http://localhost:4000`, and once processing completes, logs:

```json
{ "fileId": "...", "founderId": "founder-123", "status": "PROCESSED" }
```

Example client-side listener code:

```js
const socket = io("http://localhost:4000");

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("file_processed", (payload) => {
  console.log("file_processed:", payload);
});
```

---

