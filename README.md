# 🧪 PromptLab

**PromptLab** is a premium, full-stack platform designed for high-velocity AI prompt engineering. It provides a sophisticated environment for developers and AI enthusiasts to create, test, version, and share prompts across multiple LLM providers.

---

## 🚀 Key Features

### 🤖 Multi-Model Intelligence
- **Unified Interface**: Generate and test prompts across **Google Gemini**, **OpenAI**, **Groq**, and **Hugging Face** from a single workbench.
- **Real-time Streaming**: Experience low-latency AI responses with optimized streaming support.
- **Version Control**: Built-in prompt versioning with a **Visual Diff** tool to track changes over time.

### 💎 Premium Experience
- **Aesthetic Design**: A sleek, glassmorphic UI built with **Tailwind CSS** and **Framer Motion**.
- **Dynamic Workbench**: An interactive workspace with markdown support, auto-saving, and syntax highlighting.
- **Community Feed**: Discover, like, and bookmark prompts from a curated public feed.

### 🛠️ Developer-First Tools
- **PDF Export**: Export your prompts and results into professional PDF documents.
- **Rate Limiting**: Integrated **Upstash Redis** to ensure fair usage and prevent API abuse.
- **Security First**: Powered by **Supabase Auth** with strict Row Level Security (RLS) policies.

---

## 💻 Tech Stack

- **Frontend**: [Next.js 15+](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Framer Motion](https://www.framer.com/motion/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **Backend/Auth**: [Supabase](https://supabase.com/)
- **AI SDKs**: Gemini, OpenAI, Groq, Hugging Face
- **Caching/Rate Limiting**: [Upstash Redis](https://upstash.com/)
- **Testing**: [Playwright](https://playwright.dev/)

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 20+ 
- A Supabase Project
- API Keys for AI providers (Google, OpenAI, etc.)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/omermohammed9/PromptLab.git
   cd PromptLab
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file in the root directory and add your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   GOOGLE_GENERATIVE_AI_API_KEY=your_key
   OPENAI_API_KEY=your_key
   # ... add other provider keys
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to see the lab in action.

---

## 🧪 Testing

We use **Playwright** for robust end-to-end testing.

```bash
# Run all tests
npx playwright test

# Open Playwright UI
npx playwright test --ui
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ by the PromptLab Team.*
