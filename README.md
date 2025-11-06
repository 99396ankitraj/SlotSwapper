# SlotSwapper (ServiceHive Technical Challenge)

A peer-to-peer time-slot scheduling app where users can mark events as swappable and exchange them with other users.

- Frontend: React + Vite
- Backend: Node.js + Express + MongoDB (Mongoose)
- Auth: JWT Bearer

## Live URLs

- Frontend (Vercel): https://slot-swapper-plum.vercel.app/
- Backend (Render): https://slotswapper-jj5a.onrender.com/

## Folder Structure

- frontend/ — React app
- backend/ — Express API

## Prerequisites

- Node.js 18+
- MongoDB running locally (or cloud connection string)

## Quick Start

1) Backend

- Copy backend/.env.example to backend/.env and adjust values

```
PORT=4000
MONGO_URI=mongodb://localhost:27017/slotswapper
JWT_SECRET=supersecret_change_me
CLIENT_ORIGIN=http://localhost:5173
```

- Install deps and start

```
cd backend
npm install
npm run dev
```

Backend will be on http://localhost:4000

2) Frontend

- Copy frontend/.env.example to frontend/.env and adjust if needed

```
VITE_API_BASE=http://localhost:4000/api
```

- Install deps and start

```
cd frontend
npm install
npm run dev
```

Frontend will be on http://localhost:5173

## API Overview

Base URL (production): https://slotswapper-jj5a.onrender.com/api
Base URL (local): http://localhost:4000/api

Auth

- POST /auth/signup
  - Body: { name, email, password }
  - Resp: { token, user }
- POST /auth/login
  - Body: { email, password }
  - Resp: { token, user }

Events (Bearer token required)

- GET /events
  - List current user's events
- POST /events
  - Body: { title, startTime, endTime, status? }
  - Creates an event (status defaults to BUSY)
- PUT /events/:id
  - Update an owned event (e.g., { status: "SWAPPABLE" })
- DELETE /events/:id
  - Delete an owned event

Swap Logic (Bearer token required)

- GET /swappable-slots
  - All other users' events with status=SWAPPABLE
- POST /swap-request
  - Body: { mySlotId, theirSlotId }
  - Validates both are SWAPPABLE, locks both to SWAP_PENDING, creates SwapRequest (PENDING)
- POST /swap-response/:requestId
  - Body: { accept: true|false }
  - If rejected: SwapRequest -> REJECTED, both slots -> SWAPPABLE
  - If accepted: SwapRequest -> ACCEPTED, exchange owners of both slots, both -> BUSY
- GET /requests
  - Returns { incoming, outgoing } swap requests for current user

## Data Models

User

- name: string
- email: string (unique)
- passwordHash: string

Event

- title: string
- startTime: Date
- endTime: Date
- status: enum [BUSY, SWAPPABLE, SWAP_PENDING]
- userId: ref User

SwapRequest

- requesterId: ref User
- responderId: ref User
- mySlot: ref Event
- theirSlot: ref Event
- status: enum [PENDING, ACCEPTED, REJECTED]

## Frontend Pages

- Login / Signup: JWT auth flows
- Dashboard: list own events, create event, mark BUSY -> SWAPPABLE
- Marketplace: view others' swappable slots, request swap by offering one of your SWAPPABLE slots
- Requests: view Incoming (accept/reject) and Outgoing (pending/accepted/rejected)

## Assumptions & Notes

- Time conflicts are not resolved/validated beyond swap workflow (kept simple for the challenge)
- Simple optimistic flows; critical swap steps use MongoDB transactions (session) for owner exchange
- No email verification; password stored as hash (bcrypt)

## Future Enhancements (Bonus)

- Tests with Jest / Supertest for swap endpoints
- Real-time updates via WebSockets (e.g., socket.io)
- Docker & docker-compose for one-command setup
- Deployment: Render (API) + Vercel/Netlify (FE)

## Deployment Notes

- Backend is deployed on Render at https://slotswapper-jj5a.onrender.com/
  - Ensure environment variables in Render:
    - `MONGO_URI` = your MongoDB Atlas URI
    - `JWT_SECRET` = strong random secret
    - `CLIENT_ORIGIN` = https://slot-swapper-plum.vercel.app (no trailing slash)
- Frontend is deployed on Vercel at https://slot-swapper-plum.vercel.app/
  - Ensure environment variable in Vercel:
    - `VITE_API_BASE` = https://slotswapper-jj5a.onrender.com/api
