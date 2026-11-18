# ACME Salary Management

A web app for the HR manager to **manage the salaries of 10,000 employees** (many countries) and to **answer "how do we pay people?"**. It replaces the Excel sheets.

- **Live demo:** https://acme-salary-management-2iku.onrender.com (hosted on a free plan, so the first visit can take about a minute to wake up and data resets on restart)
- **Demo video:** [`demo/salary-management-demo.webm`](demo/salary-management-demo.webm)
- **Read first:** [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) (written before the code), then [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/AI_USAGE.md`](docs/AI_USAGE.md)

## What it does

| Area | What you can do |
|---|---|
| Employees | Search, filter (country, department, level, status, USD salary range), sort, page, add, edit, deactivate |
| Salary changes | A separate action that needs an **effective date and a reason**. It writes a history row in the same database transaction |
| Insights | Headcount, payroll, median pay, pay by country / department / level / job title / gender, salary distribution, gender pay gap |
| Excel migration | CSV **import** (bad rows are listed with the row number) and CSV **export** of the current filters |
| Many currencies | Everyone is paid in their local currency. All comparisons use USD with fixed, dated rates |

## Tech

| Part | Choice |
|---|---|
| Backend | **Ruby on Rails 8.1** (API mode), Ruby 3.4, Puma |
| Database | **SQLite** (as suggested in the brief) |
| Tests | **RSpec** (+ FactoryBot): model, service and request specs |
| Frontend | **React 18** + TypeScript + Vite, **MUI** components, TanStack Query, Recharts |
| Deploy | One Docker container: Rails serves the API **and** the built React app |

## Run it on your computer

You need **Ruby 3.4**, **Node 22** and Git. On Windows use **WSL2 (Ubuntu)** and keep the project in the Linux home folder (for example `~/acme-salary-management`), because SQLite does not work well on `/mnt/c`.

```bash
git clone https://github.com/chanchal-ch0udhary/acme-salary-management.git
cd acme-salary-management

bundle install
bin/rails db:setup        # creates the database, runs migrations, adds 10,000 employees (about 2 seconds)

cd frontend && npm install && npm run build && cd ..   # builds the React app into public/

bin/rails server          # open http://localhost:3000
```

For development with hot reload, run `bin/rails server` and, in a second terminal, `cd frontend && npm run dev` and open http://localhost:5173.

### Useful commands

| Command | What it does |
|---|---|
| `bundle exec rspec` | Run all Rails specs (about 80, a few seconds) |
| `cd frontend && npm test` | Run the React tests |
| `RESET=1 bin/rails db:seed` | Delete everything and seed 10,000 employees again |
| `COUNT=500 bin/rails db:seed` | Seed a smaller data set (only when the tables are empty) |
| `cd frontend && npm run demo` | Record the demo video (server must be running) |

## API (short)

| Method and path | What it does |
|---|---|
| `GET /api/employees` | List. Params: `q, country, department, level, status, min_salary_usd, max_salary_usd, sort_by, sort_dir, page, page_size` |
| `POST /api/employees` | Create (country sets the currency) |
| `PATCH /api/employees/:id` | Edit profile fields (salary and country are ignored here) |
| `POST /api/employees/:id/salary` | `{ new_salary, effective_date, reason }`: updates the salary and the history together |
| `GET /api/employees/:id/salary_history` | History, newest first |
| `GET /api/employees/export.csv` / `POST /api/employees/import` | CSV with the same filters / raw CSV body |
| `GET /api/insights/overview`, `breakdown?by=`, `distribution`, `pay_gap?by=` | Dashboard numbers (USD, active employees) |
| `GET /api/meta`, `GET /up` | Dropdown lists, health check |

Errors always look like `{ "error": { "code", "message", "details" } }`. Validation errors are HTTP 422 with one entry per field.

## Folder map

```
app/models/         Employee, SalaryChange, Country
app/controllers/    api/employees, api/insights, api/meta, frontend (serves the React app)
app/services/       EmployeeQuery, PayInsights, SalaryStats, EmployeeCsv, EmployeeGenerator, EmployeeSeeder
db/                 migrations, schema.rb, seeds.rb
spec/               models, services, requests (RSpec)
frontend/           React app (builds into public/)
docs/               requirements, architecture, AI usage
```

## Deploy

The `Dockerfile` builds the React app and the Rails app into one image. `render.yaml` is a Render blueprint (health check `/up`). On the free plan the disk is temporary, so the database is created and seeded again on every restart. For permanent data use a paid plan with a disk, or switch `config/database.yml` to PostgreSQL.

## Left out on purpose

No login or roles, no payroll or bonus, no live exchange rates, no background jobs. See the table in [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md). Login (roles + 2FA) and an audit log of *who* changed a salary would be the first things to add before using real data.
