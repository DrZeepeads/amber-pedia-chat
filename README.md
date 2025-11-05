# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/121c845b-8d84-48e9-ad38-30a84598e493

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/121c845b-8d84-48e9-ad38-30a84598e493) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/121c845b-8d84-48e9-ad38-30a84598e493) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## Nelson-GPT Streaming Chat Setup

This app streams responses from a Supabase Edge Function that calls Mistral AI with RAG over Nelson Textbook chunks.

Required configuration:

- Supabase Edge Function: `nelson-chat` (already included in `supabase/functions/nelson-chat/index.ts`)
- Secrets (run in your Supabase project):
  - `MISTRAL_API_KEY`: Your Mistral API key
  - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (functions runtime)
  - `SUPABASE_URL`: Your Supabase URL

Example (Supabase CLI):

```
supabase secrets set MISTRAL_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_URL=...
```

Notes:
- If `MISTRAL_API_KEY` is missing, the function returns a 500 with an error message.
- The frontend uses the Supabase JS client to invoke `nelson-chat` and parses Server-Sent Events (SSE) for smooth, real-time streaming.
- Conversations and messages are persisted to `nelson_conversations` and `nelson_messages`. LocalStorage is used only as an offline fallback.

