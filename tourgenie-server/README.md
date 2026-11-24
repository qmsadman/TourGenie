# TourGenie API

This Express and MongoDB API supports the login, registration, dashboard and
destination pages. It exposes health, login, registration, current-user,
authenticated trip-list, destination catalogue and reference-data endpoints.

From the repository root, copy `.env.example` to `.env` in this directory and
set `MONGODB_URI` and `JWT_SECRET`. Install dependencies with `npm run
install:all`, then run `npm run seed --prefix tourgenie-server` to load the
catalogue and a demo account and trip. Start the API with `npm run dev:server`.

Demo login: `moontashir@tourgenie.ai` / `Traveler123!`.

## Seed and database scripts

Run these from this directory.

| Script | What it does |
|---|---|
| `npm run seed` | Loads countries, destinations and interest tags, then the demo account and trip |
| `npm run seed:catalog` | Loads only the countries, destinations and interest tags |
| `npm run seed:demo` | Loads only the demo account and trip |
| `npm run seed:validate` | Checks the seed data files for broken references, with no database needed |
| `npm run db:verify` | Runs one query per catalogue feature against the database and reports pass or fail |

Every seed write is an upsert on a stable key (country code, destination slug,
tag code, email), so the seed can be run again without creating duplicates.

## Catalogue endpoints

| Method and path | Returns |
|---|---|
| `GET /api/destinations` | Active destinations plus the countries with their destination counts. Filters: `country_code`, `type`, `q`, `limit` |
| `GET /api/destinations/:idOrSlug` | One destination |
| `GET /api/reference/countries` | Active countries for the register form's picker |
| `GET /api/reference/interest-tags` | Interest chips for trip planning |

`POST /api/auth/register` also accepts an optional `country_code`. It must
match an active country. Without one, the account defaults to Bangladesh.
