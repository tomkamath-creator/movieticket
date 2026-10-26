# 🎟️ BucketPass — Personal Cinema Ticket Vault & Movie Diary

> **100% Free Forever** · Zero Cloud Costs · In-Browser AI Scanner · 100% Private Offline Storage

**BucketPass** is a personal cinema ticket vault and movie diary designed with a sleek, dark cinema aesthetic. It allows moviegoers to preserve and inspect collectible physical-style ticket stubs directly inside their browser, saving all tickets and original booking screenshots permanently on their own device.

---

## ✨ Features

- **🎟️ Physical Collectible Stubs**:
  - Realistic notched ticket edges, perforated tear-off divider, holographic foil badges, and barcode/QR graphics.
  - Deep obsidian and midnight tones with warm amber/gold accents.

- **🤖 In-Browser Ticket Scanner (OCR)**:
  - Drag & drop or upload screenshots from **BookMyShow, AMC, Fandango, PVR, Regal, Cinepolis**, etc.
  - Zero-cost client-side text recognition powered by Tesseract.js (WASM/Web Worker).
  - Automatically extracts: **Movie Title, Cinema Name, Showtime, Format (IMAX, Dolby Cinema, 4DX, 3D, 2D), Hall/Screen, and Seats**.

- **🎬 Automatic Theatrical Metadata**:
  - Automatically searches and fetches official theatrical posters, widescreen backdrop banners, release date, director, genres, and synopsis using free public cinema APIs (zero paid API keys required).

- **🎴 Three Browsing Modes**:
  1. **Swipe Deck**: Interactive 3D collectible card stack with touch swipe, arrow buttons, and keyboard navigation (`←` / `→`).
  2. **Grid Gallery**: Visual masonry wall of collectible ticket stubs.
  3. **List View**: Clean, compact chronological film log with mini thumbnails.

- **🔍 Pop-Open Inspection & Cinema Diary**:
  - **Left Side**: Original booking screenshot viewer with interactive pan, zoom controls (`+`, `-`, `Reset`), and download original.
  - **Right Side**: Official movie details, synopsis, and personal cinema diary:
    - Interactive 5-star rating with half-star precision (`0.5` to `5.0`).
    - Personal review, memories, and companions journal.
    - **Instant Auto-Save**: All changes are permanently persisted to your device's IndexedDB.

- **💾 Data Permanence & Portability**:
  - Nothing is ever deleted unless you choose to delete it.
  - Full vault backup with one-click **Export to JSON** (includes high-res original screenshots) and **Import Vault**.

- **📱 Mobile App & PWA Ready**:
  - Installable as a standalone app on iOS and Android via "Add to Home Screen".

---

## 🚀 Getting Started

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

### Production Build

```bash
npm run build
```

The compiled static assets will be in `dist/`.

---

## 🌐 Free Deployment via GitHub Pages

This repository includes a preconfigured GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

Every commit pushed to the `main` branch automatically builds and deploys BucketPass to GitHub Pages at:
`https://tomkamath-creator.github.io/movieticket/`

To enable GitHub Pages in your repo:
1. Go to **Settings** > **Pages** in your GitHub repository.
2. Under **Build and deployment** > **Source**, choose **GitHub Actions**.
3. Push to `main` — GitHub will automatically run the build and publish your app!

---

## 🔒 Privacy & Cost Guarantee

- **No paid cloud hosting**
- **No paid databases**
- **No paid AI/OCR APIs**
- All screenshots and diary entries live exclusively inside your browser's private IndexedDB sandbox on your device.
