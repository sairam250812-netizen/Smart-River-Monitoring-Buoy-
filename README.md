# RiverGuard AI

A modern, professional informational website for the RiverGuard AI smart river monitoring and floating waste collection system.

## Features
- Responsive landing page and project storytelling sections
- Smart technology overview
- Interactive AI assistant connected to the OpenAI API
- Mobile-friendly layout and smooth navigation

## Setup
1. Install dependencies:
   npm install
2. Create a `.env` file based on `.env.example`:
   cp .env.example .env
3. Add your OpenAI API key to `.env`.
4. Start the app:
   npm start
5. Open `http://localhost:3000`

## Environment variables
- `PORT` – local server port, default `3000`
- `OPENAI_API_KEY` – your API key from OpenAI
- `OPENAI_MODEL` – optional model name, default `gpt-4o-mini`

## Project structure
- `server.js` – Express server and AI API route
- `public/index.html` – main website structure
- `public/styles.css` – styling and responsive layout
- `public/script.js` – interactions and chatbot behavior
