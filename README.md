# EYLA — Productivity, reimagined.
### Turn ideas into a roadmap. Instantly.

EYLA is a minimalist AI-powered tool that transforms vague ideas into clear, actionable roadmaps — helping you think better, plan faster, and build with direction.

<img width="1024" height="1024" alt="eylaimage" src="https://github.com/user-attachments/assets/34f83357-1f81-409e-80bd-4b8b449898a6" />

EYLA started with a simple frustration:
ideas are easy… clarity is not.

This project is the first MVP of EYLA, a minimalist tool that helps you turn vague ideas into clear, structured, and actionable roadmaps — powered by a lightweight AI assistant.

No clutter.
No dashboards.
No complex productivity systems.

Just clarity.

<img width="1024" height="1024" alt="eylalogo" src="https://github.com/user-attachments/assets/e753c49b-40db-4338-9ed7-1c2eae72b016" />

### 🚀 What EYLA Does (MVP)

EYLA takes a raw idea from the user — for example:

"I want to build an online store for custom t-shirts"

And transforms it into:

A simple roadmap

Clear phases (Planning, Design, Development, Launch…)

Actionable steps

Fully editable by the user

Stored locally (no login, no server, no database)

All running on a clean, minimal, modern interface.

<img width="1024" height="1024" alt="EYLA" src="https://github.com/user-attachments/assets/338e0e9d-1859-4276-a441-3c5c1f740cb6" />

<img width="1024" height="1024" alt="eyla2" src="https://github.com/user-attachments/assets/61c7f4ac-aa89-4a62-997f-23d9a82b8326" />

🧠 The Philosophy Behind EYLA

EYLA is not a task manager.
It's not another productivity suite.
It's not competing with Notion, Asana, or Linear.

EYLA’s role is much simpler:

Turn mental chaos into structured clarity.
Help people think.

AI is used as a copilot, not an autopilot.
If the idea is vague, EYLA asks for more context.
If the user wants control, EYLA stays out of the way.

<img width="1536" height="1024" alt="eylalogo2" src="https://github.com/user-attachments/assets/5df61112-840c-4c15-8b9c-111d98a0bd0b" />


🏗️ Tech Stack

This MVP is intentionally simple and realistic:

Next.js (App Router)

TypeScript

Tailwind CSS

OpenAI API (gpt-4.1-mini for low cost)

Local state using useState

localStorage for saving roadmaps (Phase 3)

No backend, no auth, no complexity.
A junior dev can build and extend it with AI assistance.

🚀 How to Run & Test EYLA (Local Deployment)

EYLA is a client-side MVP and can be run locally in a few simple steps.

Requirements

Node.js v18 or higher

npm (or yarn / pnpm)

An OpenAI API key

Installation

Clone the repository and install dependencies:

npm install

Environment Variables

Create a .env.local file in the root of the project and add your OpenAI API key:

OPENAI_API_KEY=your_key_here


The app uses a lightweight OpenAI model for roadmap generation.
No backend, no database, no authentication is required.

Run the App

Start the development server:

npm run dev

Then open your browser at:

👉 http://localhost:3000

How to Test the MVP

Enter a vague or high-level idea (e.g. “I want to build an online store”)

Let the AI generate a roadmap

Edit phases and steps freely

Refresh the page to verify local persistence

Clear the roadmap if needed and start again

All data is stored locally in the browser (localStorage).

Notes for Evaluation

This is version 0.1 (MVP)

The focus is on clarity of thinking, structure, and interaction, not on scale or production infrastructure

The project intentionally avoids backend complexity to validate the core concept first

🔧 MVP Features
✔️ Core (Phase 1)

Input an idea

AI generates a structured roadmap

Roadmap displayed as minimal editable columns

Edit steps

Delete steps

✔️ UX (Phase 2)

Clean Notion/Linear-style interface

Smooth layout

Helpful feedback prompts

Simple and beautiful roadmap component

✔️ Local Save (Phase 3)

Auto-save roadmap

Load last roadmap

Clear stored roadmap

(Optional) Export to PDF

❌ Not in the MVP (Future Phases)

These are intentionally out of scope:

Authentication / accounts

Cloud sync

Collaboration

Databases

End-to-end encryption

Mobile app

Workspaces

Sharing features

All will come after validation — not before.

🧩 Project Structure

<img width="368" height="385" alt="image" src="https://github.com/user-attachments/assets/a6bf3dca-1927-40b1-9658-d7a4ca8566d8" />

🧪 How to Run Locally
npm install
npm run dev


Add your OpenAI key:

Create .env.local:

OPENAI_API_KEY=your_key_here


Then open:

👉 http://localhost:3000

🛣️ EYLA Roadmap (Meta-Roadmap)
Phase 0 — Setup

Clean structure + component foundation.

Phase 1 — Core

Idea → AI → roadmap → editable view.

Phase 2 — UX

Minimalist interface + smooth interactions.

Phase 3 — Persistence

localStorage saving + export.

Phase 4 — Future Vision (Not in MVP)

Mobile app, login, cloud sync, collaboration, encryption.


🌱 Why This MVP Matters

Because making progress in life starts with clarity.
EYLA is your starting point — not a productivity monster,
not a complex ecosystem — but a simple tool to think better.

This is version 0.1.

Small, intentional, and genuinely helpful.

More coming soon.
<img width="1536" height="1024" alt="eylabanner" src="https://github.com/user-attachments/assets/0b21d125-2968-40a1-9aeb-35b049ae6e13" />

