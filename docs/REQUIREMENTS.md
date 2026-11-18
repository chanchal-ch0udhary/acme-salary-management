# Requirements: ACME Salary Management

**User:** the HR Manager at ACME (10,000 employees, many countries, everything in Excel today).

## 1. Goal

Replace the Excel sheets with a web app where the HR manager can

1. **Manage salaries** of ~10,000 employees quickly and safely.
2. **Answer "how do we pay people?"** without making pivot tables.

Success means:
- Find and update any employee in a few seconds.
- See payroll, average / median pay, pay by country / department / level and the gender pay gap on one page.
- Know **who got which salary, when, and why** (Excel could not tell us this).

## 2. Questions HR asks and the feature that answers them

| Question | Feature |
|---|---|
| What is our total payroll and median salary? | Insights dashboard (all amounts in USD) |
| How does pay differ by country / department / level? | Breakdown table + chart (min, P25, median, P75, max) |
| How are salaries spread? | Salary distribution chart |
| Are women and men paid equally? | Gender pay gap (overall, by level, by department) |
| What was this person paid before, and why did it change? | Salary history on the employee page |
| We already have the data in Excel. | CSV import (with a clear error list) |
| Finance wants a list. | CSV export of the current filters |

## 3. In scope (version 1)

- Employees: list, search, filter, sort, pagination, add, edit, deactivate.
- Salary change as a **separate action** that needs an effective date and a reason. It saves a history row in the same database transaction.
- Many currencies: every employee is paid in their country's currency. Reports use USD (fixed, dated exchange rates).
- Insights dashboard (see section 2).
- CSV import and export.
- Seed script that creates **10,000** employees.
- Automated tests (RSpec).
- One deployable app (Rails API serves the React UI), plus a demo video.

## 4. Deliberately left out (and why)

| Left out | Reason |
|---|---|
| Login / roles (RBAC, 2FA) | Only one user type in the brief. It is the first thing to add before real data. |
| Payroll runs, tax, payslips | That is a different product. We manage salary *records*. |
| Bonus, equity, total compensation | Base salary answers the problem. Can be added as a new table later. |
| Approval workflow for raises | Needs more than one user type. The history with a reason gives accountability for now. |
| Live exchange rates | Needs an outside service and makes numbers change. A small fixed table is enough and is easy to explain. |
| Background jobs (Sidekiq/Redis) | Nothing here is slow enough to need them (10k rows). |

## 5. Quality requirements

- Pages respond in well under half a second with 10,000 employees (database indexes, simple queries).
- Money is stored as whole numbers (no float errors).
- All input is validated on the server and errors are returned per field.
- Code stays simple: standard Rails (models, controllers, a few small service classes), no clever tricks.

## 6. Assumptions

- Salary means **annual base salary** in local currency.
- About 12 countries, 11 departments and 7 levels are enough to be realistic.
- Gender is optional. The pay gap compares only F and M, and only when each group has at least 5 people.
