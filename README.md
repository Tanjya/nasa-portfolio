# NASA Daily Explorer

A minimalist, fast, dark-mode friendly space dashboard:
- **APOD** (Astronomy Picture of the Day)
- **Mars Rover Gallery** (filter by rover/camera/date)
- **Near-Earth Objects** (7-day NEO feed with hazard & distance)
- **NASA Image Search** (public images library)

## Tech
HTML5, Tailwind (CDN, `darkMode: 'class'`), Vanilla JS modules, NASA APIs.

## Live Demo
[![Live Demo](https://img.shields.io/badge/Live-Demo-informational)](https://tanjya.github.io/nasa-portfolio/nasa-daily-explorer)
[![Source](https://img.shields.io/badge/GitHub-Repo-black)](https://github.com/Tanjya/nasa-portfolio)


## Features
- Class-based **theme toggle** (persists via `localStorage`)
- Robust loading/error/empty states
- Accessible modals with keyboard/backdrop close
- Clean, scalable componentized JS (`src/ui.js`, page modules)

## Getting Started
Clone and open `index.html` locally (or via Live Server).
- Add your NASA key in `src/mars.js` / `src/asteroids.js` if needed.
- Search page uses the public Images API (no key).

## Screenshots
<div align="center">
  <img src="./nasa-daily-explorer/assets/" alt="APOD" width="45%"/>
  <img src="./nasa-daily-explorer/assets/mars.png" alt="Mars Rover Gallery" width="45%"/><br/>
  <img src="./nasa-daily-explorer/assets/asteroids.png" alt="Near-Earth Objects" width="45%"/>
  <img src="./nasa-daily-explorer/assets/search.png" alt="NASA Image Search" width="45%"/>
</div>

## License
MIT © Tanjya Akther
