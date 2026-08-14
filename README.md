# TalkWise Play

Standalone gaming site for TalkWise Academy.

This is a separate repository, separate Next.js app, and separate Vercel
project from [TalkWise-Website](https://github.com/morrowfam2019-dev/TalkWise-Website)
(the main marketing/content site). Nothing here shares deployment config,
environment variables, or domains with that project.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- TypeScript

## Development

```bash
npm install
npm run dev
```

Runs on port 3002 locally so it doesn't collide with the main site's dev
server (port 3001).

## Roadmap

- Game catalog / library UI
- First playable game(s)
- Whop integration for access/paywall (planned, not yet implemented)

## Deployment

Deploy as its own Vercel project, importing this repository directly.
Do not link this repo to the existing TalkWise-Website Vercel project.
