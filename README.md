# KisanSetu: Farmer-Buyer Agricultural Marketplace (MERN + Socket.IO)

Visitors browse products. Farmers manage their own listings. Buyers search, filter and chat live with farmers. Admins manage users and listings.
Demo logins after seeding: `admin@kisansetu.in` (Admin@123), `farmer@kisansetu.in` (Farmer@123), `buyer@kisansetu.in` (Buyer@123). Change the admin password with `ADMIN_PASSWORD` in `server/.env`.

## 1. Run on Windows (CMD)
Install Node.js 20 LTS first (nodejs.org). Then open CMD in this folder:
```
cd server
copy .env.example .env
notepad .env
npm install
npm run seed
npm run dev
```
Open a second CMD window:
```
cd client
npm install
npm run dev
```
Open http://localhost:5173. Check the API at http://localhost:5000/api/health.

### MongoDB Atlas (free database)
1. mongodb.com/atlas, create a free account and a free M0 cluster.
2. Database Access: add a user with a password (letters and numbers only keeps the URL simple).
3. Network Access: add IP `0.0.0.0/0` (allows Render to connect).
4. Connect, Drivers, copy the string, and put it in `server/.env` as `MONGO_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/kisansetu?retryWrites=true&w=majority`.
5. Run `npm run seed` again to fill the Atlas database.

## 2. Tests
Server: `cd server`, then `npm run lint` and `npm test` (checks JWT and role middleware, no database needed).
Client: `cd client`, then `npm run build`.

### Postman (Experiment 7)
1. Install Postman. Import `postman/kisansetu.postman_collection.json` and `postman/kisansetu.postman_environment.json`.
2. Choose the environment "KisanSetu Local" (top right). Set `jwtSecret` to the same `JWT_SECRET` as in `server/.env` (used to create an expired token for one test).
3. Run `npm run seed` first (the admin login is needed), keep the server running, then right-click the collection, Run collection, Run. Every request has automatic tests; they should all pass.
4. Re-running is safe: registering again returns 409, which the tests accept.

## 3. Chat (Experiment 8)
Login as buyer, open a product, press "Chat with farmer". In another browser (or a private window) login as the farmer, open "Dashboard", and open the chat. Messages appear instantly on both sides and are saved in MongoDB.
How it works: `server/socket.js` checks the JWT when the socket connects, only lets the two people of a conversation join its room, and saves each message before sending it to the room. `client/src/Chat.jsx` loads history over REST and listens for live messages.

## 4. Security notes (Experiments 5 and 6)
Helmet, CORS from `CLIENT_URL`, rate limits, 10kb JSON limit, express-validator on every write, `express-mongo-sanitize`, bcrypt, JWT with `JWT_EXPIRES_IN`, and a central error handler that never leaks details.
Token storage: this project keeps the JWT in `localStorage`. It is simple and works across Vercel and Render, but any XSS bug could steal it (React escapes output, which helps). The safer production option is an httpOnly cookie, which JavaScript cannot read, but it then needs CSRF protection and `SameSite=None; Secure` cookie setup between two domains.
Known limit: a deleted user's token stays valid until it expires.

## 5. Docker (Experiment 10)
Install Docker Desktop for Windows and start it. In this folder:
```
copy .env.example .env
docker compose up --build -d
docker compose exec server npm run seed
```
Website: http://localhost:8080, API: http://localhost:5000/api/health.
Useful: `docker compose ps` (status and health), `docker compose logs -f server`, `docker compose down` (stop), `docker compose down -v` (stop and delete the database).
Docker packages the app with everything it needs, so it runs the same on any computer: no installing Node or MongoDB by hand, one command to start.

## 6. Deploy (Experiment 9)
1. Put the project on GitHub: create an empty repository, then in CMD in this folder: `git init`, `git add .`, `git commit -m "KisanSetu"`, `git branch -M main`, `git remote add origin https://github.com/YOUR-NAME/kisansetu.git`, `git push -u origin main`. The `.gitignore` files keep `.env` and `node_modules` out.
2. Render (API): New, Web Service, connect the repo. Root Directory `server`, Build `npm install`, Start `npm start`, Health Check Path `/api/health`. Environment: `MONGO_URI` (Atlas), `JWT_SECRET` (long random text), `CLIENT_URL` (your Vercel URL, add after step 3), `NODE_ENV=production`. Copy the service URL, for example `https://kisansetu-api.onrender.com`.
3. Vercel (website): Add New, Project, import the repo. Root Directory `client`, Framework Vite. Environment variable `VITE_API_URL` = your Render URL (no trailing slash). Deploy, then put the Vercel URL into `CLIENT_URL` on Render (several URLs can be separated by commas) and redeploy Render.
4. Seed the hosted database once from your computer: put the Atlas `MONGO_URI` in `server/.env` and run `npm run seed`.
5. GitHub Actions (`.github/workflows/ci.yml`) runs lint, tests and build on every push and pull request. In GitHub, Settings, Secrets and variables, Actions: add variable `API_URL` (your Render URL) and optionally secret `RENDER_DEPLOY_HOOK` (Render, Settings, Deploy Hook). After CI passes on `main`, the `deploy-check` job triggers the hook and calls `/api/health` until it answers. Check the green tick in the Actions tab.
6. Verify yourself: open `RENDER_URL/api/health`, then register, login and send a chat message on the Vercel site. Render free services sleep, so the first request can take about a minute.

## 7. Experiment map
| Exp | Feature | Files | Demonstrate with |
|---|---|---|---|
| 1 | Responsive Tailwind UI: home, market, detail, login, dashboards, filters, loading and error states | `client/tailwind.config.js`, `client/src/App.jsx`, `pages.jsx`, `market.jsx`, `Admin.jsx` | Resize the browser; search and filter in "Sell and buy" |
| 2 | useState, useEffect with cleanup, useContext, custom hooks | `client/src/hooks.js` (useFetch, useDebounce, useWeather), `i18n.jsx` | Weather box on home, debounced search, language switch |
| 3 | Redux Toolkit for auth and listings, Context for language (EN, HI, MR) | `client/src/store.js`, `i18n.jsx` | Login, logout, refresh page (stays logged in), switch language |
| 4 | Mongoose models and REST API with pagination | `server/models.js`, `server/routes.js` | Postman folders 2, 3, 4 |
| 5 | Helmet, CORS, rate limit, validation, sanitize, error handler | `server/server.js`, `middleware.js` | Postman bad-input requests (400), `npm test` |
| 6 | JWT, roles, ownership checks, protected pages | `server/middleware.js`, `routes.js`, `client/src/App.jsx` (Guard) | Postman folders 1 and 5; open `/admin` as a buyer |
| 7 | Postman collection and environment with automatic tests | `postman/` | Run collection |
| 8 | Socket.IO chat saved in MongoDB | `server/socket.js`, `client/src/Chat.jsx` | Two browsers, buyer and farmer |
| 9 | CI/CD, Render, Vercel, health check | `.github/workflows/ci.yml`, `client/vercel.json` | Actions tab, `/api/health` |
| 10 | Docker and Compose with health checks | `docker-compose.yml`, `server/Dockerfile`, `client/Dockerfile` | `docker compose up --build` |

## 8. Changes from the previous version (no database migration needed)
Old listings still work: new fields `category` (default Other), `description` and `images` are optional. `GET /listings` now returns `{items, total, page, pages}` instead of a plain array. The old enquiry endpoint still exists, but the chat replaces it in the interface. `images` stores URLs only; file upload is not built.
