# Vaultly

A lightweight, self-hosted media and file storage platform — think Google Drive / Dropbox, but you control the infrastructure.

## Features

- **File Upload & Management**: Upload images, videos, documents, and more with drag-and-drop support
- **Chunked/Resumable Uploads**: Large files (videos) won't fail on slow connections via tus protocol
- **Thumbnail Generation**: Automatic thumbnail generation for images (WebP) and videos (poster frames)
- **Video Transcoding**: Background conversion to H.264 MP4 for web playback
- **Folder Organization**: Create nested folders, drag-and-drop files between them
- **Sharing**: Generate public share links with optional password protection and expiration
- **Trash**: Soft-delete with 30-day retention and restore capability
- **Admin Dashboard**: User management, storage oversight, content moderation, audit logging
- **Dark Mode**: Full light/dark theme support
- **Responsive**: Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui components |
| Database | PostgreSQL 16 via Prisma ORM |
| Auth | NextAuth.js (Auth.js) v5 — email/password + optional Google OAuth |
| Storage | S3-compatible (AWS S3 or MinIO) via @aws-sdk/client-s3 |
| Image Processing | sharp |
| Background Jobs | BullMQ + Redis |
| Containerization | Docker + docker-compose |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and docker-compose (for production-like setup)
- PostgreSQL 16 (for local dev without Docker)

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://vaultly:vaultly@localhost:5432/vaultly` |
| `NEXTAUTH_SECRET` | Random secret for session encryption | (required) |
| `S3_ENDPOINT` | S3-compatible storage endpoint | `http://localhost:9000` |
| `S3_BUCKET` | S3 bucket name | `vaultly` |
| `S3_ACCESS_KEY` | S3 access key | `minioadmin` |
| `S3_SECRET_KEY` | S3 secret key | `minioadmin` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `DEFAULT_STORAGE_QUOTA_GB` | Default per-user quota | `5` |
| `MAX_UPLOAD_SIZE_MB` | Maximum file upload size | `500` |

### Development

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push

# Seed demo data
npm run db:seed

# Start dev server
npm run dev
```

### Production with Docker

```bash
# Build and start all services
docker-compose up -d

# Run database migrations
docker-compose exec app npx prisma db push

# Seed demo data
docker-compose exec app npm run db:seed
```

The app will be available at `http://localhost:3000`.

## Demo Accounts

After seeding:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vaultly.com | Admin123! |
| User | user@vaultly.com | User1234! |

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload a file (multipart form) |
| `/api/files` | GET | List files with filters/pagination |
| `/api/files/:id` | GET/PATCH/DELETE | File detail, rename, move, soft-delete |
| `/api/folders` | GET/POST | List and create folders |
| `/api/folders/:id` | PATCH/DELETE | Rename and delete folders |
| `/api/share` | GET/POST | List and create share links |
| `/api/share/:token` | GET | Resolve a public share link |
| `/api/dashboard/summary` | GET | User dashboard stats |
| `/api/admin/*` | Various | Admin-only endpoints |

## Project Structure

```
vaultly/
├── app/                    # Next.js App Router pages and API routes
│   ├── (auth)/            # Login and signup pages
│   ├── (dashboard)/       # User dashboard pages (library, shared, trash, settings)
│   └── (admin)/           # Admin pages
│   └── api/               # REST API routes
├── components/             # React components
│   └── ui/                # shadcn/ui primitives
├── lib/                    # Core library code
│   ├── auth.ts            # NextAuth configuration
│   ├── db.ts              # Prisma client
│   ├── s3.ts              # S3 storage helpers
│   ├── queue.ts           # BullMQ job queues
│   ├── audit.ts           # Audit logging
│   └── validations.ts     # Zod schemas
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Demo data seeder
├── workers/                # Background job workers
│   ├── thumbnail-worker.ts
│   ├── transcode-worker.ts
│   └── scan-worker.ts
├── types/                  # TypeScript type declarations
├── docker-compose.yml      # Multi-service Docker setup
└── Dockerfile              # App container image
```

## Security

- File type validation via magic bytes (not client-provided MIME)
- Signed, time-limited URLs for private file downloads
- Rate limiting on upload and auth endpoints
- Filename sanitization to prevent path traversal
- CSRF protection via NextAuth
- Role-based access control (USER / ADMIN)
- All admin actions are audit-logged

## License

MIT
