# Assumptions and questions

The assessment asks candidates to ask questions instead of guessing. To submit quickly, I made the assumptions below, wrote them down, and listed the questions I would have asked. I am happy to change anything after your answers.

## Assumptions I made

| # | Assumption | Where it shows in the code |
|---|---|---|
| 1 | There is **one kind of user** (the HR Manager). The brief names only this persona, so there is **no login or roles** in version 1. | `docs/REQUIREMENTS.md` section 4 |
| 2 | **Salary** means yearly base salary in the employee's local currency. Bonus, equity and tax are not included. | `employees.salary` |
| 3 | Reports compare people in **USD** using fixed, dated exchange rates (no live rates). | `Country`, `employees.salary_usd` |
| 4 | Around 12 countries, 11 departments and 7 levels are realistic enough for the seed data. | `Country`, `Employee::DEPARTMENTS`, `Employee::LEVELS` |
| 5 | **SQLite** is fine (the brief suggests it). PostgreSQL is a configuration change. | `config/database.yml` |
| 6 | Rails (API mode) for the backend and React for the UI is the expected stack for the ROR role. | `app/`, `frontend/` |
| 7 | A salary change always needs an **effective date and a reason** and is saved as history in the same transaction. | `Employee#change_salary` |
| 8 | An employee's **country cannot change** after creation (it would change the currency). | `Employee#country_cannot_change` |
| 9 | The gender pay gap compares F and M only, and only when each group has at least 5 people. | `PayInsights::MIN_GROUP_SIZE` |
| 10 | The live demo runs on a free plan, so its data resets on restart. | `render.yaml` |

## Questions I would have asked

1. Is one HR user with no login acceptable for this exercise, or do you expect authentication and roles (for example HR admin and read-only)?
2. Is SQLite fine for the database, or do you prefer PostgreSQL?
3. Is Rails API plus a React frontend what you expect for the ROR role?
4. Should the salary be one number, or do you want components (base, bonus, allowances)?
5. Should reports use fixed exchange rates, or live ones?
6. Is the demo video in the repository enough, or do you want a hosted link?
7. Do you prefer test-first commits, or are tests and code in the same commit fine?
8. Which reports would the HR manager use most? I chose payroll, pay by country / department / level, distribution and the gender pay gap.

## What I would do next

1. Login with roles (RBAC) and 2FA, and record **who** changed each salary (audit log).
2. PostgreSQL and a persistent disk for the live site.
3. Salary bands per level and country, and a flag for people outside the band.
4. Bulk raises with a preview, and bonus / equity as a separate table.
