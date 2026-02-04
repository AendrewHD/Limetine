# Limetine

A modern, simple, self-hosted project timeline tool.

## Features
- **Modern Interface**: Built with Next.js and Tailwind CSS.
- **Self-Hosted**: Uses SQLite by default, easy to deploy.
- **Timelines**: Manage multiple project timelines and events.

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Initialize Database:**
    ```bash
    npx prisma migrate dev --name init
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000).

## Tech Stack
-   **Framework**: Next.js (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Database**: SQLite with Prisma ORM
