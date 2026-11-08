# TourGenie API

This Express and MongoDB API supports the login and dashboard pages. It exposes
health, login, current-user, and authenticated trip-list endpoints.

From the repository root, copy `.env.example` to `.env` in this directory and
set `MONGODB_URI` and `JWT_SECRET`. Install dependencies with `npm run
install:all`, then run `npm run seed --prefix tourgenie-server` to add a demo
account and trip. Start the API with `npm run dev:server`.

Demo login: `moontashir@tourgenie.ai` / `Traveler123!`.
