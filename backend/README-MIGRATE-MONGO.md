Migration to MongoDB
====================

This repository ships with a file-based JSON DB at `src/data/db.json`.
The included migration script `migrate-json-to-mongo.js` copies collections into MongoDB.

Steps:

1. Install mongoose

```powershell
cd backend
npm install mongoose
```

2. Set your Mongo URI (local or Atlas)

```powershell
$env:MONGO_URI = 'mongodb://127.0.0.1:27017/foodreservation'
```

3. Run migration

```powershell
node migrate-json-to-mongo.js
```

4. Create admin account (if not already migrated from JSON)

```powershell
npm run seed-mongo
```

This will create a default admin user with:
- Email: `admin@school.test`
- Password: `admin123`
- Student ID: `000000001`

5. Start server (it will use Mongo when MONGO_URI is set)

```powershell
node -r dotenv/config src/index.js
```

Notes:
- The migration script empties collections and inserts documents from `db.json`.
- Backup `db.json` before running the migration.
- If you're starting fresh (without migrating from JSON), use `npm run seed-mongo` to create the default admin account.
