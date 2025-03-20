## ✅ `CONTRIBUTING.md`

```markdown
# Contributing Guide

Thank you for contributing! Follow these steps to keep things clean and consistent.

---

## 📁 Branching Strategy

| Branch      | Purpose                               |
| ----------- | ------------------------------------- |
| `main`      | Production-ready code                 |
| `dev`       | Active development and staging branch |
| `feature/*` | New features                          |
| `fix/*`     | Bug fixes                             |
| `docs/*`    | Documentation updates                 |
| `hotfix/*`  | Urgent fixes for production issues    |

---

## ✅ Commit Message Convention (Conventional Commits)

<type>(scope): <short description>

Example:
feat(inventory): add product transfer endpoint fix(order): correct status update logic docs(readme): update quick start section

**Types:** `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`

---

## 📋 Pull Request Checklist

- [ ] Code compiles locally
- [ ] Lint and type-check pass
- [ ] Tests are green
- [ ] README/docs updated if needed
- [ ] PR points to `dev` branch

---

(IN PROGRESS)

## 🔍 Code Style

- Prettier + ESLint enforced
- Run `` before commits
- Husky pre-commit hooks will ensure formatting
```
