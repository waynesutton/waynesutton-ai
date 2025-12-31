# PRD: Clone and Create New Repo with Upstream Sync

## Overview

This document outlines the process for cloning an existing repository, creating a new repository from it, and keeping the new repository updated with changes from the original (upstream) repository.

---

## Step 1: Clone and Create the New Repo

### 1.1 Clone the Original Repository

```bash
git clone https://github.com/ORIGINAL_OWNER/ORIGINAL_REPO.git
cd ORIGINAL_REPO
```

### 1.2 Create Your New Repository

1. Go to GitHub and create a new empty repository (do not initialize with README, .gitignore, or license)
2. Copy the new repository URL

### 1.3 Change the Remote Origin

```bash
# Remove the original remote
git remote remove origin

# Add your new repository as origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_NEW_REPO.git

# Push to your new repository
git push -u origin main
```

### 1.4 Add the Original as Upstream

```bash
# Add the original repository as upstream
git remote add upstream https://github.com/ORIGINAL_OWNER/ORIGINAL_REPO.git

# Verify remotes are set correctly
git remote -v
```

Expected output:
```
origin    https://github.com/YOUR_USERNAME/YOUR_NEW_REPO.git (fetch)
origin    https://github.com/YOUR_USERNAME/YOUR_NEW_REPO.git (push)
upstream  https://github.com/ORIGINAL_OWNER/ORIGINAL_REPO.git (fetch)
upstream  https://github.com/ORIGINAL_OWNER/ORIGINAL_REPO.git (push)
```

---

## Step 2: Keeping Your Repo Updated

### 2.1 Fetch Updates from Upstream

```bash
# Fetch all branches and commits from upstream
git fetch upstream
```

### 2.2 Merge Updates into Your Branch

```bash
# Make sure you're on your main branch
git checkout main

# Merge upstream changes into your local main
git merge upstream/main
```

**Alternative: Rebase instead of merge**
```bash
git rebase upstream/main
```

### 2.3 Push Updates to Your Origin

```bash
git push origin main
```

---

## Quick Reference: Full Sync Workflow

Run these commands whenever you want to sync with upstream:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

---

## Handling Merge Conflicts

If you have local changes that conflict with upstream:

1. After `git merge upstream/main`, Git will notify you of conflicts
2. Open conflicting files and resolve the conflicts manually
3. Stage the resolved files: `git add <filename>`
4. Complete the merge: `git commit`
5. Push to your origin: `git push origin main`

---

## Best Practices

- **Sync regularly**: Fetch and merge upstream changes frequently to minimize conflicts
- **Work on branches**: Create feature branches for your changes, keep main clean for syncing
- **Review before merging**: Use `git diff main upstream/main` to preview changes before merging
- **Document customizations**: Keep track of your modifications so you can re-apply them after major upstream updates

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `git remote -v` | List all remotes |
| `git fetch upstream` | Download upstream changes |
| `git log upstream/main` | View upstream commit history |
| `git diff main upstream/main` | Compare your main with upstream |
| `git branch -a` | List all branches including remote |
