Author <br>
1.Quazi Md Sadman <br>
2.Moontashir Azim

## Run the landing page, login, and dashboard

Requirements: Node.js 20.19+ (or 22.12+) and a MongoDB connection string.

1. Install dependencies from the repository root:

   ```sh
   npm run install:all
   ```

2. Copy `tourgenie-server/.env.example` to `tourgenie-server/.env` and set
   `MONGODB_URI` and a private `JWT_SECRET`.
3. Seed the demo user and trips:

   ```sh
   npm run seed --prefix tourgenie-server
   ```

4. Start the API and client in separate terminals:

   ```sh
   npm run dev:server
   npm run dev:client
   ```

Open the Vite URL shown in the client terminal. The demo login is
`moontashir@tourgenie.ai` / `Traveler123!`.

The client contains four routes: `/`, `/login`, `/register`, and
`/dashboard`. You can create an account from the Register page; the API stores
accounts and saved trips in MongoDB. The demo account remains available after
seeding.
