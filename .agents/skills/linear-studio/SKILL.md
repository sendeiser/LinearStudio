---
name: linear-studio
description: >-
  Manage and automate project issues across all federated repositories in Linear Studio.
  Use when the user wants to list projects, create issues in any project, update issue status
  (e.g., mark as in_progress or done), or scan code for TODO/FIXME annotations to submit them.
metadata:
  publisher: antigravity
---

# Linear Studio & Antigravity Issue Automation Skill

This skill provides seamless integration between the Antigravity AI Agent and Linear Studio,
allowing automatic and user-driven management of issues across all federated projects
(such as `tincho/hyper-flow`, `boxtools`, `tincho/linear-studio-github`, etc.).

## Core Principles

1. **Human in Control:** The user decides and approves what issues are submitted. When scanning code for TODOs or test failures, present the findings and suggested commands to the user first unless explicitly instructed to create them immediately.
2. **Multi-Project Agnostic:** Linear Studio supports multiple linked repositories/projects. All issue creation and status updates can target any specific project or work globally.
3. **Status Workflow:** Antigravity can directly update issue states to reflect progress:
   - `in_progress`: When work begins on an issue.
   - `in_review`: When tests are passing and a PR or review is requested.
   - `done`: When an issue is completed or merged.
   - `todo` / `backlog`: When prioritized or deferred.

---

## CLI Tool: `scripts/linear_studio.py`

Antigravity executes commands through `python scripts/linear_studio.py` in the workspace.

### 1. List All Federated Projects
```bash
python scripts/linear_studio.py list-projects
```
Lists all workspaces and linked repositories registered in Linear Studio (e.g. `tincho/hyper-flow`, `boxtools`, `tincho/linear-studio-github`).

### 2. List Issues
```bash
python scripts/linear_studio.py list-issues
python scripts/linear_studio.py list-issues --project boxtools
python scripts/linear_studio.py list-issues --status in_progress
```

### 3. Create an Issue in Any Project
```bash
python scripts/linear_studio.py create-issue --project "boxtools" --title "Optimizar bundle Vite" --priority high --tags "performance,vite" --desc "Dividir chunks pesados"
```
Parameters:
- `--project` (required): Target project name or substring (e.g., `boxtools`, `hyper-flow`).
- `--title` (required): Issue title.
- `--priority`: `urgent`, `high`, `medium` (default), or `low`.
- `--status`: `todo` (default), `backlog`, `in_progress`, `in_review`, `done`.
- `--tags`: Comma-separated list of labels (e.g., `bug,security`).
- `--desc`: Optional description in markdown.
- `--assignee`: Optional assignee name (defaults to "Antigravity AI").

### 4. Update Issue Status (En Progreso / Completado)
```bash
# Mark as in progress
python scripts/linear_studio.py update-status --id 150 --project boxtools --status in_progress

# Mark as completed
python scripts/linear_studio.py update-status --id 150 --project boxtools --status done

# Move to in review
python scripts/linear_studio.py update-status --id 150 --project boxtools --status in_review
```

### 5. Code Scanner for TODOs & FIXMEs
```bash
python scripts/linear_studio.py scan-todos
python scripts/linear_studio.py scan-todos --project "boxtools"
```
Scans the current codebase for `// TODO:`, `// FIXME:`, `// BUG:`, `// HACK:`, `// PERF:`, outputs exact file and line locations, and generates the exact copy-paste command for the user to submit each one to Linear Studio.
