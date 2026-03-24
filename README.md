# Marvel Memory Card Game - Infinity Edition

A modern Marvel-themed memory game built with vanilla web technologies.

## Features

- Marvel-style animated background and 3D card effects
- Multiple difficulty levels: Easy, Medium, Hard, Legendary
- 10-stage campaign progression for each difficulty
- Stage rewards and persistent reward collection
- Timer, moves, streak, points, and progress tracking
- Legendary mode chaos mechanic (periodic shuffle)
- Hint system with limited uses
- Best-score persistence with `localStorage`
- Fully static and deployable to Render

## Tech Stack

- HTML5
- CSS3 (animations, gradients, 3D transforms)
- JavaScript (ES6+, DOM API)
- Node.js (lightweight static server for Render Web Service mode)
- JSON for card data

## Run Locally

Open `index.html` directly, or run a static server:

```bash
python -m http.server 5500
```

Then visit `http://localhost:5500`.

## Deploy on Render

This repo includes `render.yaml` for a static deployment.

1. Connect this GitHub repository to Render.
2. Create a new Blueprint deployment or Static Site.
3. Use branch `main`.
4. Publish path is the repo root (`.`).

If you already created a Render **Web Service**, use:

- Build Command: `npm install`
- Start Command: `npm start`

## Project Structure

- `index.html` - UI structure
- `style.css` - visual design and animations
- `index.js` - gameplay logic
- `data/cards.json` - card metadata
- `assets/` - card and theme images
- `render.yaml` - Render deployment config
- `server.js` - static file server (Render web service compatibility)
- `package.json` - start script for deployment
