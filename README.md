# 🌟 SeatPulse — Workshop Registration Engine with Seat Limits & Waitlist Auto-Promotion

A full-stack web application designed to solve workshop seat limit management, prevent race conditions & duplicate registrations, manage priority waitlist queues with automatic promotions, and synchronize seat availability in real time via WebSockets.

---

## 🎯 Key Capabilities & Architecture

### 1. 🛡️ Backend-Enforced Seat Limits (Zero Browser Trust)
- Seat calculations are computed entirely on the server via database queries (`COUNT(*) WHERE status = 'REGISTERED'`).
- The frontend never dictates or overrides the remaining seat count.
- Concurrency and duplicate attempts are protected via atomic transactions.

### 2. 🚫 Duplicate Email & Full Workshop Handling
- **Duplicate Prevention:** The backend checks active registrations and waitlists. Duplicate registrations with the same email for the same workshop are immediately rejected with an explicit HTTP 409 Conflict.
- **Full Workshop Guard:** When a workshop reaches capacity (e.g. 30/30 seats), direct registration is blocked and the UI displays a disabled button and `"Workshop Full"` badge.
- **Priority Waitlist:** Full workshops offer an instant `"Join Priority Waitlist"` option. The student is added to the FIFO queue (e.g. Position #1, #2).

### 3. 🔄 Automatic Waitlist Promotion on Cancellation
- When any confirmed attendee cancels their registration:
  1. The attendee's seat is released and status changed to `CANCELLED`.
  2. The backend queries the oldest entry on the waitlist for that workshop (`FIFO`).
  3. The waitlisted student is automatically promoted to `REGISTERED`.
  4. An automated notification email is generated and logged in the system.
  5. A real-time WebSocket broadcast updates all connected clients instantly without requiring page refreshes!

### 4. ⚡ Live Real-Time WebSockets
- Powered by Socket.io.
- Whenever anyone registers, cancels, or is promoted from the waitlist, all connected browsers update live seat progress meters, badges, attendee lists, and activity streams.

### 5. 📧 Simulated Transactional Email Service
- Formatted transactional emails with HTML previews are generated and recorded in the database:
  - **Seat Confirmation Email** (with details and direct cancellation link + token)
  - **Waitlist Confirmation Email** (with queue position)
  - **Auto-Promotion Email** (notifying that a seat opened up)
  - **Cancellation Email**
- Built-in **Live Pulse & Email Inbox** viewer tab allows inspecting all generated emails and copying cancellation tokens.

### 6. 🛡️ Organizer Management Portal
- Switch between workshops.
- View confirmed attendees, waitlist queue, and cancellation audit logs.
- Search and filter students by name or email.
- 1-Click Cancel/Remove attendee (with live demonstration of auto-promotion).
- 1-Click **Export to CSV**.
- **Create New Workshop** with custom seat capacity and tags.
- **1-Click Reset Demo Data** button to quickly restore seed state.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm

### 1. Running the Backend Server
```bash
cd server
npm install
npm start
```
*The server will start at `http://localhost:5000` with WebSocket support enabled.*

### 2. Running the Frontend Client
```bash
cd client
npm install
npm run dev
```
*The client will start at `http://localhost:5173`.*

---

## 🧪 Testing Scenarios (Evaluation Guide)

1. **Test Pre-Seeded 3 Sample Workshops:**
   - **Workshop 1:** *Generative AI & Autonomous Agents* (30 seats, 26 filled $\rightarrow$ 4 seats left).
   - **Workshop 2:** *Next.js 15 & React 19 Masterclass* (5 seats, 5 filled $\rightarrow$ **FULL** with 2 students on the waitlist).
   - **Workshop 3:** *Cloud-Native Kubernetes* (15 seats, 8 filled $\rightarrow$ 7 seats left).

2. **Test Duplicate Email Rejection:**
   - Try registering for Workshop 1 with an existing student email (e.g. `alice.walker@example.com`).
   - Notice the backend rejection banner: `"You are already registered for this workshop with this email address."`

3. **Test Full Workshop & Waitlist Queue:**
   - Open Workshop 2 (*Next.js 15 Masterclass*).
   - Notice the disabled `"Full (0 Seats Left)"` button and the `"Join Waitlist #3"` button.
   - Click `"Join Waitlist"`, submit your details.
   - You will be placed at Position #3 on the priority waitlist!

4. **Test Waitlist Auto-Promotion on Cancellation:**
   - Open the **Organizer Portal** or click **Cancel Seat**.
   - For Workshop 2, cancel a confirmed student (e.g. `Bruce Wayne`).
   - Watch the backend instantly promote `Oliver Queen` (Position #1) to a confirmed seat, log an automated promotion email, and broadcast the update to all connected clients!

5. **Test Student Self-Service Lookup:**
   - Navigate to the **My Registrations** tab.
   - Search for `bruce.wayne@example.com` or `oliver.queen@example.com`.
   - Inspect active workshop passes and cancel with one click.
