---
description: Build the PromptLab Next.js project locally.
---

# Build Project

Follow these steps to safely install dependencies, typecheck, and build the Next.js project.

## 1. Install Dependencies
```bash
// turbo
npm install
```

## 2. Typecheck
Run the TypeScript compiler without emitting files to verify syntax and types.
```bash
// turbo
npx -y tsc --noEmit
```

## 3. Build Production Target
Compile the Next.js app for production. 
```bash
// turbo
npm run build
```
