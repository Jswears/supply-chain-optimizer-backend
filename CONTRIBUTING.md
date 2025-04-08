## ✅ `CONTRIBUTING.md`

```markdown
# Contributing Guide

Thank you for contributing to ChainOpt! Follow these steps to keep things clean and consistent.

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
- `feat(inventory): add product transfer endpoint`
- `fix(order): correct status update logic`
- `docs(readme): update quick start section`

**Types:** `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`

---

## 📋 Pull Request Checklist

- [ ] Code compiles locally
- [ ] Lint and type-check pass
- [ ] Tests are green (when implemented)
- [ ] README/docs updated if needed
- [ ] PR points to `dev` branch

---

## 🔍 Code Style

- Prettier + ESLint enforced
- Run `npm run format` and `npm run lint` before commits
- Husky pre-commit hooks will ensure formatting and lint rules are followed

## 🧪 Testing (Future Implementation)

- Unit tests for utilities and functions
- Integration tests for API endpoints
- Run tests with `npm test`

## 🚀 Development Workflow

1. Fork the repository and create your branch from `dev`
2. Install dependencies with `npm install`
3. Make your changes and ensure they follow our coding standards
4. Run linting and formatting with `npm run lint` and `npm run format`
5. Build the project with `npx tsx esbuild.config.ts`
6. Create a pull request to the `dev` branch

## 💻 Environment Setup

1. Configure your AWS credentials locally
2. Copy `.env.example` to `.env` and update values according to your environment
3. Make sure you're using Node.js version 22 or later

## 📝 Documentation Standards

- Update API documentation when endpoints are added or modified
- Keep README up to date with new features and configuration options
- Document environment variables in `.env.example`
- Use JSDoc for function documentation
```
