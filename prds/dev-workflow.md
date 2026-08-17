# Dev workflow reference

Quick reference for the agentic dev workflow. Commands, shortcuts, and activation phrases.

## Cursor skills

| Skill | How to activate | What it does |
|-------|----------------|--------------|
| Update project docs | `@update` | Updates TASK.md, changelog.md, files.md with real git dates after a feature or fix |
| Create a PRD | `@create-prd` | Creates a structured PRD in `prds/` with template |
| Robel auth | `@robel-auth` | Integration guide for @robelest/convex-auth |
| Convex self-hosting | `@convex-self-hosting` | Integration guide for @convex-dev/self-hosting |

## Cursor rules (always on)

| Rule file | Job |
|-----------|-----|
| `workflow.mdc` | Plan-first, task tracking, 3-file doc updates, subagent strategy, self-improvement loop |
| `help.mdc` | Reflect before acting, 98% confidence before writing code |
| `dev2.mdc` | Developer identity, code quality, tech stack, Convex mutation patterns |
| `gitruels.mdc` | Git safety, never run destructive commands without approval |
| `convex2.mdc` | Convex function syntax, validators, schema patterns |
| `convex-write-conflicts.mdc` | Write conflict prevention patterns |

## Workflow steps

### Starting a non-trivial task

1. Write a PRD first: `@create-prd`
2. Add tasks to `TASK.md` under `## To Do`
3. Implement task by task, mark `[x]` as you go
4. Verify it works before marking done
5. Update project docs: `@update-project-docs`

### After every session

```bash
git log --date=short -n 10   # get real dates before updating changelog
```

Then run `@update` to hit all three files.

### Logging a lesson after a correction

Open `prds/lessons.md` and add an entry:

```
## YYYY-MM-DD - [short label]

**What happened**: ...
**Root cause**: ...
**Rule going forward**: ...
```

## Key project files

| File | Purpose |
|------|---------|
| `TASK.md` | Task tracking, current status, completed history |
| `changelog.md` | Version history (keepachangelog.com format) |
| `files.md` | Codebase file structure and descriptions |
| `prds/lessons.md` | Self-improvement log after corrections |
| `prds/dev-workflow.md` | This file |

## PRD rules

- All PRDs live in `prds/`
- Extension is always `.md`, never `.prd`
- Root files (`changelog.md`, `files.md`, `README.md`, `TASK.md`) stay in the root, not `prds/`
