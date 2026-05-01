# Word Shooter 🔥

A high-speed, cyber-defense typing game built with Vanilla JavaScript and HTML5 Canvas.

![Game Concept](https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000)

## 🎯 Core Idea
This is NOT a spaceship shooting downward enemies.
Instead:
- **Theme**: Cyber defense system / firewall protecting a server core.
- **Enemies**: Words representing "incoming corrupted packets".
- **Player**: A defense AI typing commands to neutralize threats.

## 🎮 Gameplay Features
- **Multi-directional Enemies**: Packets come from all sides, some orbiting or zig-zagging.
- **Core Defense**: Protect the central core; typing fires pulses directly from the center.
- **Targeting System**: Typing the first letter locks onto the nearest threat.
- **Heat System**: Typing too fast causes the system to overheat, temporarily slowing your defense.
- **Combo System**: Build multipliers with consecutive correct characters.
- **Adaptive Difficulty**: Word length and spawn rates scale as the game progresses.

## ⚙️ Tech Stack
- **Engine**: HTML5 Canvas (Vanilla JS)
- **Styling**: Vanilla CSS (Glassmorphism & Neon aesthetic)
- **Typography**: Orbitron (Titles) & JetBrains Mono (Typing)
- **Performance**: Lightweight, no external dependencies, < 2s load time.

## 💰 Monetization Setup

This project is pre-integrated with **Google AdSense**. Follow these steps to activate ads:

1. **Deploy your site**: Use [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/) to host your game.
2. **AdSense Application**: 
   - Sign in to [Google AdSense](https://www.google.com/adsense/start/).
   - Add your deployed URL under "Sites".
   - Copy your **Publisher ID** (looks like `ca-pub-XXXXXXXXXXXXXXXX`).
3. **Configuration**:
   - Open `index.html`.
   - Search for `ca-pub-XXXXXXXXXXXXXXXX`.
   - Replace all occurrences with your actual Publisher ID.
4. **Ad Slots**:
   - Create Display Ad units in your AdSense dashboard.
   - Replace the `data-ad-slot="XXXXXXXXXX"` placeholders in `index.html` with your actual slot IDs.

### Compliance
- **Privacy Policy**: Located at `/privacy-policy.html`.
- **Terms of Service**: Located at `/terms.html`.
- **Links**: Automatically added to the game footer.

## 🚀 How to Run
1. Clone the repository.
2. Since the project uses ES Modules, you need to serve it via a local server (to avoid CORS issues).
3. If you have Node.js installed, run:
   ```bash
   npx serve .
   ```
4. Open your browser at `http://localhost:3000`.

## 🌐 Deployment
This is a static site and can be deployed instantly to **Vercel**, **Netlify**, or **GitHub Pages**.
- Simply push to a GitHub repository.
- Connect the repo to your favorite static hosting service.

## 📈 Future Roadmap
- [ ] Global Leaderboard (Firebase/Supabase integration)
- [ ] Multiplayer "Race" mode
- [x] Sound Effects (Web Audio API)
- [ ] Custom word packs (JavaScript, Python, Cyber-Security terms)

---
Developed as a premium, high-fidelity typing experience.
