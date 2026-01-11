# How to Use Code Blocks

> A guide to syntax highlighting, diff rendering, and code formatting in your markdown posts.

---
Type: post
Date: 2026-01-07
Reading time: 4 min read
Tags: tutorial, markdown, code, syntax-highlighting
---

# How to Use Code Blocks

Code blocks are essential for technical writing. This guide covers standard syntax highlighting and enhanced diff rendering.

## Basic code blocks

Wrap code in triple backticks with a language identifier:

````markdown
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```
````

This renders with syntax highlighting:

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```

## Supported languages

Common languages with syntax highlighting:

| Language   | Identifier           |
| ---------- | -------------------- |
| JavaScript | `javascript` or `js` |
| TypeScript | `typescript` or `ts` |
| Python     | `python` or `py`     |
| Bash       | `bash` or `shell`    |
| JSON       | `json`               |
| CSS        | `css`                |
| SQL        | `sql`                |
| Go         | `go`                 |
| Rust       | `rust`               |
| Markdown   | `markdown` or `md`   |

## Code block features

Every code block includes:

- **Language label** in the top right corner
- **Copy button** that appears on hover
- **Theme-aware colors** matching your selected theme

## Diff code blocks

For showing code changes, use the `diff` or `patch` language identifier. These render with enhanced diff visualization powered by @pierre/diffs.

### Basic diff example

````markdown
```diff
--- a/config.js
+++ b/config.js
@@ -1,5 +1,5 @@
 const config = {
-  debug: true,
+  debug: false,
   port: 3000
 };
```
````

This renders as:

```diff
--- a/config.js
+++ b/config.js
@@ -1,5 +1,5 @@
 const config = {
-  debug: true,
+  debug: false,
   port: 3000
 };
```

### Multi-line changes

```diff
--- a/utils.ts
+++ b/utils.ts
@@ -10,12 +10,15 @@
 export function formatDate(date: Date): string {
-  return date.toLocaleDateString();
+  return date.toLocaleDateString('en-US', {
+    year: 'numeric',
+    month: 'long',
+    day: 'numeric'
+  });
 }

 export function parseDate(str: string): Date {
-  return new Date(str);
+  const parsed = new Date(str);
+  if (isNaN(parsed.getTime())) {
+    throw new Error('Invalid date string');
+  }
+  return parsed;
 }
```

### Diff view modes

Diff blocks include a view toggle button:

- **Unified view** (default): Shows changes in a single column with +/- indicators
- **Split view**: Shows old and new code side by side

Click the toggle button in the diff header to switch between views.

## Adding new functions

```diff
--- a/api.ts
+++ b/api.ts
@@ -5,6 +5,14 @@ export async function fetchUser(id: string) {
   return response.json();
 }

+export async function updateUser(id: string, data: UserUpdate) {
+  const response = await fetch(`/api/users/${id}`, {
+    method: 'PATCH',
+    body: JSON.stringify(data)
+  });
+  return response.json();
+}
+
 export async function deleteUser(id: string) {
   return fetch(`/api/users/${id}`, { method: 'DELETE' });
 }
```

## Removing code

```diff
--- a/legacy.js
+++ b/legacy.js
@@ -1,15 +1,8 @@
 const express = require('express');
 const app = express();

-// Old middleware - no longer needed
-app.use((req, res, next) => {
-  console.log('Request:', req.method, req.url);
-  next();
-});
-
 app.get('/', (req, res) => {
   res.send('Hello World');
 });

-// Deprecated route
-app.get('/old', (req, res) => res.redirect('/'));
-
 app.listen(3000);
```

## Inline code

For inline code, use single backticks:

```markdown
Run `npm install` to install dependencies.
```

Renders as: Run `npm install` to install dependencies.

Inline code is detected automatically when the content is short (under 80 characters) and has no newlines.

## Plain text blocks

Code blocks without a language identifier render as plain text with word wrapping:

```
This is a plain text block. It wraps long lines automatically
instead of requiring horizontal scrolling. Useful for logs,
output, or any text that isn't code.
```

## Tips

**Choose the right language**: Use the correct language identifier for accurate highlighting. TypeScript files should use `typescript`, not `javascript`.

**Keep examples focused**: Show only the relevant code. Long blocks lose readers.

**Use diffs for changes**: When explaining modifications to existing code, diff blocks clearly show what changed.

**Test your blocks**: Preview your post to verify syntax highlighting works correctly.

## Summary

| Block type         | Use case                                       |
| ------------------ | ---------------------------------------------- |
| Regular code block | Showing code snippets with syntax highlighting |
| Diff block         | Showing code changes with additions/deletions  |
| Plain text block   | Logs, output, or non-code text                 |
| Inline code        | Commands, function names, short references     |

Code blocks make technical content readable. Use the right format for your content type.