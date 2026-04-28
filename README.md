# 🧪 PromptLab

**PromptLab** is a premium, full-stack platform designed for high-velocity AI prompt engineering. It provides a sophisticated environment for developers and AI enthusiasts to create, test, version, and share prompts across multiple LLM providers.

---

## 🚀 Key Features

### 🤖 Multi-Model Intelligence
- **Unified Interface**: Generate and test prompts across **Google Gemini**, **OpenAI**, **Groq**, and **Hugging Face** from a single workbench.
- **Real-time Streaming**: Experience low-latency AI responses with optimized streaming support.
- **Version Control**: Built-in prompt versioning with a **Visual Diff** tool to track changes over time.
- **Genkit Integration**: Robust AI logic and flow orchestration powered by **Firebase Genkit**.

### 🌍 Global & Accessible
- **Full i18n Support**: Multilingual interface (English & Arabic) with automatic **RTL/LTR** layout switching.
- **Accessibility First**: WCAG 2.1 compliant with "Skip to Content" links, ARIA labels, and **Reduced Motion** support.
- **SEO Optimized**: Dynamic `sitemap.xml`, `robots.txt`, and optimized meta tags for maximum search visibility.

### 🛡️ Enterprise-Grade Admin
- **Intelligence Dashboard**: Real-time monitoring of AI model performance, latency, and success rates.
- **Infrastructure Control**: Dynamic "Kill-Switches" for AI providers and system-wide maintenance modes.
- **Moderation Queue**: Advanced tools for managing community content and user reports.
- **Usage Analytics**: Per-user daily quotas and detailed usage logs powered by **Upstash Redis**.

### 💎 Premium Experience
- **Aesthetic Design**: A sleek, glassmorphic UI built with **Tailwind CSS** and **Framer Motion**.
- **Dynamic Workbench**: An interactive workspace with markdown support, auto-saving, and syntax highlighting.
- **Community Feed**: Discover, like, and bookmark prompts from a curated public feed.

---

## 💻 Tech Stack

- **Frontend**: [Next.js 15+](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Framer Motion](https://www.framer.com/motion/)
- **i18n**: [next-intl](https://next-intl-docs.vercel.app/) for robust internationalization.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **Backend/Auth**: [Supabase](https://supabase.com/)
- **AI SDKs**: Genkit, Gemini, OpenAI, Groq, Hugging Face
- **Caching/Rate Limiting**: [Upstash Redis](https://upstash.com/)
- **Testing**: [Playwright](https://playwright.dev/) for E2E and Security testing.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 20+ 
- A Supabase Project
- API Keys for AI providers (Google, OpenAI, etc.)
- Upstash Redis instance

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
   UPSTASH_REDIS_REST_URL=your_url
   UPSTASH_REDIS_REST_TOKEN=your_token
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to see the lab in action.

---

## 🧪 Testing & Standards

We maintain high technical standards with a comprehensive testing suite:

```bash
# Run all tests (E2E, Security, Prompts)
npx playwright test

# Run specific security audit tests
npx playwright test tests/security.spec.ts

# Open Playwright UI
npx playwright test --ui
```

### 📋 Standards Compliance
- **ISO 27001 Ready**: Implemented security best practices and data encryption.
- **GDPR Compliant**: Integrated cookie consent and data privacy controls.
- **WCAG 2.1 AA**: Full accessibility support for screen readers and keyboard navigation.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆕 Recent Updates (April 2026)

### 🎨 UI/UX & Performance Audit
- **Theme Token System**: Fully migrated to HSL-based theme tokens for precise Light/Dark mode control.
- **Z-Index Governance**: Established a centralized Z-index scale to resolve floating component collisions.
- **Contrast Optimization**: Boosted text legibility across all components in Light Mode, achieving higher accessibility standards.
- **Transition Performance**: Optimized Framer Motion and CSS transitions by targeting specific properties, reducing CPU usage during animations.
- **Mobile Ergonomics**: Enhanced touch targets for navigation elements to meet WCAG 44x44px standards.

---
*Built with ❤️ by the PromptLab Team.*

