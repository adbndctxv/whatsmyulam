# Deployment (Netlify)

**Status: not deployed. Nothing here has been run yet.** There is no website to deploy until the Next.js app is scaffolded.

## Plan

- Use Netlify's supported Next.js integration. Do not force a static export.
- Connect the GitHub repository in Netlify. Netlify detects Next.js and sets the build command (`next build`) automatically.
- Use **deploy previews** for pull requests. Only the owner approves merging into the production branch.

## Environment variables

None are required for the MVP (see `.env.example`). If Supabase is added later, set values in Netlify's dashboard under *Site configuration, Environment variables*, never in committed files. The service-role key must stay server-side.

## Local development (after the app exists)

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Before the first production deploy

1. All tests and `npm run build` pass.
2. The owner reviews the preview deploy.
3. The owner explicitly approves production. No domain purchase or paid plan happens without approval.

Do not announce a live URL until a deployment has actually been completed and checked.
