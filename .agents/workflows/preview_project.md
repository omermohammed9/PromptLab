---
description: Start the development preview server for PromptLab.
---

# Preview Project

This workflow outlines the commands to start the Next.js development server. Note that in Firebase Studio / Antigravity, the server may already be running automatically via IDX preview manager. If you need to manually start it:

## 1. Start Dev Server
```bash
// turbo
npm run dev
```

## 2. Preview
Once the server is running (usually on port 3000 or the dynamically assigned IDX port), ensure the preview pane renders without errors.

> [!NOTE]
> Do not manually run `next dev` if the Firebase Studio preview pane is already running and managing the dev server. Revisit logs if errors occur.
