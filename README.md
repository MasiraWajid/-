# RED SKY — Air Combat (Browser Prototype)

A responsive browser-playable arcade prototype inspired by the screenshots supplied for the project. It uses original canvas-drawn graphics and does **not** contain the original game's source code or assets.

## Run locally
1. Extract the ZIP.
2. Open the folder in Visual Studio Code.
3. Install the **Live Server** extension (or use any static web server).
4. Right-click `index.html` → **Open with Live Server**.
5. Use the page's **PLAY GAME** button and enter a nickname (not your real name).

Opening `index.html` directly may work, but a local server is recommended.

## Controls
- Laptop: `A` / `D` or left/right arrows to steer, `W` / `S` or up/down arrows for vertical input, `Space` to fire, `P` to pause.
- Mobile: use the on-screen joystick and hold FIRE.
- Use the PAUSE button to pause. Resume from the pause dialog.

## Included prototype features
- Responsive landing page and first-person-inspired cockpit scene.
- Enemy aircraft waves, shooting, score and stage progression.
- Ammo and health pickups.
- Damage and game-over flow.
- Pause / resume / exit.
- Nickname and local best-score storage.
- Local leaderboard.
- Clearly labelled simulated ad placement after every third loss.
- Shareable site URL once deployed.

## Important limitations (read before submitting a test report)
This is a **prototype**, not the original game and not a claim that every feature is production-complete.
- Graphics are drawn by Canvas; they are not the original 3D assets.
- Simulated ads are not real ads and do not award a real ad-network reward.
- Leaderboard and profile data are stored in the current browser only; no cross-user online leaderboard/backend.
- The scene includes a visual ship and pickups, but advanced ship destruction/respawn, accurate bullet/ocean/plane death-condition parity, real rewarded ads, and server-synced leaderboard still need additional implementation and verification.
- “Install game” in this browser version means open the website; a PWA install flow can be added separately.

## Publish online with GitHub Pages
1. Sign in at https://github.com and create a new **public** repository, e.g. `red-sky-web-game`.
2. Upload `index.html`, `style.css`, `game.js`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then Save.
6. Wait for the published URL shown on the Pages screen. It normally looks like `https://YOUR-USERNAME.github.io/red-sky-web-game/`.
7. Open the URL on laptop and mobile and test it. Do not guess the URL before GitHub publishes it.

## Manual test checklist starter
- [ ] Open site on laptop and mobile.
- [ ] Create a nickname profile; refresh and confirm nickname remains.
- [ ] Start a mission and fire at enemies.
- [ ] Check score increases when an enemy is hit.
- [ ] Check ammo decreases; collect an ammo pickup.
- [ ] Collect health pickup and confirm hull bar rises.
- [ ] Pause, resume and exit.
- [ ] Lose a mission and confirm high score remains saved after refresh.
- [ ] Open leaderboard.
- [ ] Check the demo-ad placeholder after the third loss.
- [ ] Test touch joystick and FIRE on mobile.
- [ ] Record limitations separately; do not mark unsupported features as Pass.
