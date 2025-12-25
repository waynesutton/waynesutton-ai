# Contact

---
Type: page
Date: 2025-12-25
---

You found the contact page. Nice

## The technical way

This site runs on Convex, which means every page view is a live subscription to the database. You are not reading cached HTML. You are reading data that synced moments ago.

If you want to reach out, here is an idea: fork this repo, add a contact form, wire it to a Convex mutation, and deploy. Your message will hit the database in under 100ms. No email server required.

```typescript
// A contact form mutation looks like this
export const submitContact = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
```

## The human way

Open an issue on GitHub. Or find the author on X. Or send a carrier pigeon. Convex does not support those yet, but the team is probably working on it.

## Why Convex

Traditional backends make you write API routes, manage connections, handle caching, and pray nothing breaks at 3am. Convex handles all of that. You write functions. They run in the cloud. Data syncs to clients. Done.

The contact form example above is the entire backend. No Express. No database drivers. No WebSocket setup. Just a function that inserts a row.

That is why this site uses Convex.