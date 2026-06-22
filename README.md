 HireWise AI 🚀

> An AI-powered career platform that helps job seekers optimize their resumes, practice interviews, and close skill gaps — all in one place.


## 📸 Preview

<!-- Add 2-3 screenshots or a GIF here. This is the single biggest thing recruiters look at. -->
<!-- ![Dashboard](./assets/dashboard.png) -->

## ✨ Features

- **ATS Resume Scanner** — Checks resumes against Applicant Tracking System rules and gives a compatibility score
- **AI Resume Builder** — Generates ATS-friendly resumes from user input
- **Mock Interviews (Voice-enabled)** — Simulated interview practice with real-time AI feedback
- **Skill Gap Analysis** — Compares user's current skills against target job roles
- **LinkedIn Profile Analysis** — Reviews and suggests improvements for LinkedIn profiles
- **AI Career Coach** — Conversational guidance for career decisions and job search strategy

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | [e.g. Next.js / React + Tailwind] |
| Backend | Firebase Genkit / Firebase Studio |
| AI Models | Google Gemini (via Google AI Studio) |
| Database | Cloud Firestore |
| Auth | Firebase Authentication |
| Hosting | Vercel |

## 🏗️ Architecture

```
User → Next.js Frontend → Firebase Genkit Flows → Gemini API
                              ↓
                        Cloud Firestore (data persistence)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project with Firestore + Auth enabled
- A Gemini API key (from Google AI Studio)

### Installation

```bash
# Clone the repo
git clone https://github.com/Mayan-git/hirewise-ai.git
cd hirewise-ai

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env.local

# Run locally
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=
```

## 📂 Project Structure

```
hirewise-ai/
├── src/
│   ├── app/              # Pages/routes
│   ├── components/       # UI components
│   ├── genkit/           # Firebase Genkit flows (AI logic)
│   ├── lib/               # Firebase config, utilities
│   └── types/             # TypeScript types
├── public/
└── .env.example
```

## 🗺️ Roadmap

- [ ] Add multi-language resume support
- [ ] Export resume as PDF
- [ ] Interview performance history/analytics
- [ ] Mobile app version

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a PR.

## 📄 License

This project is licensed under the MIT License.


⭐ If you find this project useful, consider giving it a star!
