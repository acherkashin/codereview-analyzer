# Engineering Principles

- Strictly follow SOLID, KISS, and DRY principles.
- Prefer readability and maintainability over clever solutions.
- Avoid premature optimization, but do not write obviously inefficient code.
- Keep functions and React components small, focused, and single-purpose.
- Do not mix business logic with UI logic; React components should focus on rendering and UI composition.
- Move non-trivial business logic into hooks, helper files, classes, or focused abstractions when it makes responsibilities clearer.
- Do not introduce new abstractions unless they provide clear value for the current code.
- Handle edge cases explicitly.
- Respect existing project conventions and patterns.

# Boundaries

## MUST

- Update `AGENTS.md` if project structure changes
- Ask whether you need to write new tests

# Project Structure Notes

- `src/pages/TeamReviewPage/` contains the multi-member Team Review screen and its relationship matrix.
- `src/utils/TeamReviewUtils.ts` contains Team Review relationship aggregation and summary logic; keep non-trivial team metrics there instead of embedding them in React components.
