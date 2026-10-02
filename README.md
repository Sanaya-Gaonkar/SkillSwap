# SkillSwap

> **Learn. Teach. Swap.**  
> *Your skills have value. Exchange them.*  
> **Learn what you want + Teach what you know + Connect with others.**

SkillSwap is a collaborative peer-learning and skill exchange web application for students, teachers, and corporate employees. Instead of expensive bootcamps or rigid group classes, SkillSwap connects people who want to learn a skill directly with peers who can teach it—and vice versa—in a fair, mutually beneficial, two-way exchange.

---

## 1. Core Philosophy & Value Proposition

- **100% Peer-to-Peer:** Students are simultaneously teachers and learners.
- **Fair Two-Way Exchange:** I teach you Python; you teach me Graphic Design.
- **Hands-on & Collaborative:** 1-on-1 scheduling, practice sessions, feedback, and mutual reviews.
- **Community Safety:** Admin moderation, conduct reports, and student verifications.

---

## 2. Technology Stack

- **Frontend:** React 18, Vite, React Router 6, Lucide React icons, Poppins typography, and modern responsive CSS design system.
- **Backend:** Node.js, Express.js REST API.
- **Database:** SQLite with relational schema, foreign key constraints, and seed data. On Render, the database file is stored on a persistent disk shared by every visitor to the deployed app.
- **Security:** bcrypt password hashing, JSON Web Tokens (JWT) authentication, protected routes, and parameter-safe queries.

---

## 3. Project Structure

```text
SkillSwap/
│
├── backend/
│   ├── database/
│   │   ├── db.js             # SQLite connection & promise helpers
│   │   └── schema.sql        # Relational schema matching UML model
│   ├── middleware/
│   │   ├── auth.js           # JWT token verification
│   │   └── admin.js          # Admin authorization guard
│   ├── routes/
│   │   ├── auth.js           # Register, login, me
│   │   ├── users.js          # Student discovery & public profiles
│   │   ├── profile.js        # Profile viewing & updating
│   │   ├── skills.js         # Master skill catalog & admin CRUD
│   │   ├── userSkills.js     # User teaching & learning skills
│   │   ├── matches.js        # Rule-based skill matching engine
│   │   ├── learning.js       # Persistent goals, roadmaps, XP and learning activity
│   │   ├── connections.js    # Send/accept/reject peer connections
│   │   ├── messages.js       # One-on-one chat with REST polling
│   │   ├── exchanges.js      # Two-way skill exchange lifecycle
│   │   ├── sessions.js       # Online/offline session scheduling
│   │   ├── reviews.js        # 1-5 star reviews & ratings
│   │   ├── history.js        # Verified learning history
│   │   ├── notifications.js  # Notifications & unread counts
│   │   ├── reports.js        # Misconduct reporting & resolution
│   │   └── admin.js          # Metrics, user status toggle & catalog
│   ├── seed/
│   │   └── seed.js           # Interconnected demo data seeder
│   ├── utils/
│   │   └── notify.js         # Automated notification generator
│   ├── server.js             # Express entrypoint & static frontend host
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Logo.jsx                 # Dynamic SVG two-way arrows logo
│   │   │   ├── Navbar.jsx               # Navigation bar & demo persona switcher
│   │   │   ├── MobileNav.jsx            # Mobile bottom navigation
│   │   │   ├── SkillChip.jsx            # Teal (teach) & coral (learn) chips
│   │   │   ├── UserCard.jsx             # Discovery student card
│   │   │   ├── MatchCard.jsx            # Mutual overlap score card
│   │   │   ├── ExchangeModal.jsx        # Two-way exchange proposal modal
│   │   │   ├── ScheduleSessionModal.jsx # Session scheduling modal
│   │   │   ├── ReviewModal.jsx          # Star rating & feedback modal
│   │   │   └── ReportModal.jsx          # Conduct incident reporting modal
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Global auth state & notifications
│   │   ├── pages/
│   │   │   ├── Landing.jsx              # Hero, philosophy & features
│   │   │   ├── Login.jsx                # Login with show/hide & demo buttons
│   │   │   ├── Register.jsx             # Account registration with validation
│   │   │   ├── Home.jsx                 # Student dashboard & recommended matches
│   │   │   ├── LearningHub.jsx          # Goals, roadmaps, XP, streak and achievements
│   │   │   ├── Discover.jsx             # Search, skill/course/year filters
│   │   │   ├── Profile.jsx              # Profile, ratings & exchange actions
│   │   │   ├── EditProfile.jsx          # Edit bio, availability & avatar
│   │   │   ├── MySkills.jsx             # Add/remove teach & learn skill chips
│   │   │   ├── Connections.jsx          # Incoming/outgoing requests & peers
│   │   │   ├── Chat.jsx                 # Real-time polling 1-on-1 chat
│   │   │   ├── Exchanges.jsx            # Two-way skill swap tracking
│   │   │   ├── ExchangeDetail.jsx       # 5-step lifecycle milestone tracker
│   │   │   ├── Sessions.jsx             # Scheduled learning sessions
│   │   │   ├── History.jsx              # Completed skills learning history
│   │   │   ├── Notifications.jsx        # Notification feed & alerts
│   │   │   ├── NotFound.jsx             # 404 handler
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx   # Metrics & moderation tools
│   │   │       ├── AdminUsers.jsx       # Search & enable/disable accounts
│   │   │       ├── AdminSkills.jsx      # Skill catalog CRUD
│   │   │       └── AdminReports.jsx     # Report review & resolution
│   │   ├── services/
│   │   │   └── api.js                   # Unified REST API client
│   │   ├── App.jsx                      # Routing & route guards
│   │   ├── index.css                    # Poppins typography & color tokens
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── database/
│   └── skillswap.db          # Local SQLite database (not committed)
├── README.md
├── package.json              # Top-level scripts
└── .env.example
```

---

## 4. Demo Accounts & Credentials

All demo accounts are pre-seeded with rich, interconnected relationships:

| Role | Name | Email | Password | What They Teach ⇋ Learn |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | **Ashwet Pilankar** | `ashwet@skillswap.edu` | `password123` | Teaches: Python, Java, Web Dev<br>Learns: UI/UX, Figma, Graphic Design |
| **Student** | **Priya Sharma** | `priya@skillswap.edu` | `password123` | Teaches: Graphic Design, UI/UX, Visual Branding<br>Learns: Python, Web Dev |
| **Student** | **Rahul Patil** | `rahul@skillswap.edu` | `password123` | Teaches: UI/UX, Web Dev, HTML, CSS<br>Learns: Java, Figma |
| **Student** | **Rohan Mehta** | `rohan@skillswap.edu` | `password123` | Teaches: Python, Git/GitHub, SQL<br>Learns: UI/UX, Figma, Visual Branding |
| **Student** | **Ananya Sen** | `ananya@skillswap.edu` | `password123` | Teaches: Graphic Design, Photoshop, Video Editing<br>Learns: Python, Web Scraping, Excel |
| **Student** | **Marcus Vance** | `marcus@skillswap.edu` | `password123` | Teaches: Financial Modelling, Excel, R, Academic Writing<br>Learns: Spanish, Public Speaking |
| **Admin** | **Admin User** | `admin@skillswap.edu` | `admin123` | Administrator: metrics, user status, skills catalog, reports |

> 💡 **Quick Switcher:** When running the app, a top ribbon dropdown allows switching between any student or admin account in 1-click!

---

## 5. Quick Start Instructions

### Prerequisites
- Node.js (v18+) and npm.

### Option A: Run Full Application with 1 Command
The backend serves both the REST API and the current React frontend from port `5000`. The start command builds the frontend first:
```bash
npm run start
```
Then open your browser at:
👉 **`http://localhost:5000`**

---

### Option B: Run in Development Mode (Vite Hot-Reload)
To run backend and frontend separately with hot reload:

1. **Start Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *Runs on port 5000.*

2. **Start Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Runs on port 3000 with automatic `/api` proxy.*

---

### Database Seeding
To re-seed the SQLite database with clean interconnected demo data at any time:

```bash
npm run seed
```

> Seeding clears existing database contents. On a newly deployed Render service, run it once before users create accounts if you want the demo accounts and sample conversations; do not run it again on a database with real user data.

## Render Deployment

The repository includes a `render.yaml` Blueprint for a single web service. The service builds the Vite frontend, serves it from Express, and stores SQLite at `/var/data/skillswap.db` on a persistent disk so registrations, connections, and messages are shared across devices.

1. Push this project to a GitHub repository you own.
2. In Render, choose **New > Blueprint**, connect the repository, and apply the `render.yaml` configuration. The configured Starter web service and persistent disk are paid Render resources.
3. Wait for the first deployment to finish. Render generates `JWT_SECRET`; keep that value private and do not use the local development secret in production.
4. If you want the demo users, open the service Shell and run `npm run seed` once, before real accounts are created.
5. Open the public `onrender.com` URL shown on the Render service. This is the shareable SkillSwap link for computers and phones; the frontend calls the API on the same host, so users do not need a localhost or LAN address.

For future code changes, push to the connected GitHub branch; Render will rebuild and deploy automatically. Keep the persistent disk mounted at `/var/data` and retain the `DB_PATH` environment variable when updating the service.

---

## 6. Explainable Matching and Learning Progress

SkillSwap does not claim to use an AI service when none is configured. Matches are ranked by actual teach/learn overlaps; reciprocal exchanges rank above one-way overlaps. Additional skill overlap, schedule and online-mode compatibility, shared interests, current skill goals, course/year, and completed exchanges contribute small deterministic bonuses. Students with no direct skill overlap are not shown as matches. Cards include the reasons for each match rather than a random percentage.

The authenticated Learning Hub stores goals, roadmap steps, and learning activity in SQLite. Roadmap starters use transparent built-in templates. Completing roadmap steps, sessions, exchanges, and positive reviews can award XP; streaks are calculated from recorded learning activity, not logins.

The new database tables are additive and created during normal backend schema initialization. Existing tables and user data are preserved. No additional environment variables or manual migration command are required.

---

## 7. The Complete Skill Exchange Flow (Section 25)

1. **Offer & Request:** Proposer offers a skill they can teach and requests a skill from the receiver.
2. **Proposal Notification:** The other user receives an instant notification with proposal details.
3. **Acceptance:** Receiver accepts (or declines) the exchange proposal.
4. **Session Coordination:** Participants schedule an Online (video link) or Offline (campus room) session with date, time, and agenda.
5. **Session Execution:** Session progresses from `scheduled` → `started` → `completed`.
6. **Exchange Completion:** Participants mark the exchange as `completed`.
7. **Mutual Review & History Update:**
   - Both users submit a 1–5 star rating and feedback comment (duplicates prevented).
   - Learning History automatically records the learned skill, peer mentor, and completion date.

---

## 8. Verification & Functionality Checklist

- [x] **Authentication:** Register, Login, Logout, JWT tokens, bcrypt hashed passwords, Google OAuth button mockup.
- [x] **Profiles:** Profile view, Edit profile, avatar randomizer, course, year, bio, availability, learning preferences.
- [x] **My Skills:** Dedicated page with teal (teach) and coral (learn) chips, add, remove, search, and save.
- [x] **Discovery & Search:** Real-time search across student names and skills, filter by skill, course, and college year.
- [x] **Practical Discover Filters:** Profile-backed course, year, and availability options; skill direction; and a minimum review rating filter.
- [x] **Rule-Based Matching:** Calculates two-way and one-way match percentages without AI.
- [x] **Learning Hub:** Persistent goals, structured roadmap templates, XP, levels, achievements, and activity-based streaks.
- [x] **Learning Dashboard:** Teaching/learning skills, exchange totals, next scheduled session, XP, and streak summary.
- [x] **Connections:** Send request, accept/reject, pending badges, self-connection prevention.
- [x] **Chat / Messaging:** One-to-one messaging with timestamps, conversation list, auto-refresh polling (no WebSockets).
- [x] **Two-Way Skill Exchanges:** Propose, accept, reject, complete lifecycle.
- [x] **Sessions:** Schedule date/time/mode, Google Meet link, start session, complete session.
- [x] **Reviews & Ratings:** 1–5 star ratings, feedback comments, profile reviews showcase, duplicate prevention.
- [x] **Learning History:** Automatically updated portfolio of skills acquired from peers.
- [x] **Notifications:** Dynamic notification alerts for requests, swaps, messages, sessions, and reviews.
- [x] **Admin Console:** Platform metrics, search and enable/disable users, skill catalog CRUD, resolve incident reports.


## Administrator account

The packaged administrator account is protected and is not exposed in the demo switcher.

- Username: `admin`
- Email: `admin@skillswap.edu`
- Password: `admin12`
- Role: `Admin`

Public registration cannot create an Admin account.
