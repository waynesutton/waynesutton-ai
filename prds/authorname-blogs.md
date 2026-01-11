# Author Pages Implementation Plan

## Overview

Add author pages at `/author/:authorSlug` that display all posts by a specific author. Follows the existing tag pages pattern. Works with existing `npm run sync` workflow - no sync changes needed.

## Files to Modify

| File | Change |
|------|--------|
| `convex/schema.ts` | Add `by_authorName` index to posts table |
| `convex/posts.ts` | Add `getAllAuthors` and `getPostsByAuthor` queries |
| `src/pages/AuthorPage.tsx` | New component (based on TagPage.tsx pattern) |
| `src/App.tsx` | Add `/author/:authorSlug` route |
| `src/pages/Post.tsx` | Make authorName a clickable `<Link>` to author page |
| `convex/http.ts` | Add author pages to sitemap |
| `files.md` | Document new AuthorPage.tsx |

## Implementation Steps

### Step 1: Add Index to Schema

**File:** `convex/schema.ts`

Add index to posts table for efficient author queries:

```typescript
// In posts table definition, add to indexes:
.index("by_authorName", ["authorName"])
```

### Step 2: Add Convex Queries

**File:** `convex/posts.ts`

Add two new queries following existing patterns:

```typescript
// Get all unique authors (similar to getAllTags)
export const getAllAuthors = query({
  args: {},
  returns: v.array(v.object({
    name: v.string(),
    slug: v.string(),
    count: v.number(),
  })),
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();

    // Filter out unlisted posts and posts without author
    const publishedPosts = posts.filter(p => !p.unlisted && p.authorName);

    // Count posts per author
    const authorCounts = new Map<string, number>();
    for (const post of publishedPosts) {
      if (post.authorName) {
        const count = authorCounts.get(post.authorName) || 0;
        authorCounts.set(post.authorName, count + 1);
      }
    }

    // Convert to array with slugs
    return Array.from(authorCounts.entries())
      .map(([name, count]) => ({
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        count,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
  },
});

// Get posts by author slug (similar to getPostsByTag)
export const getPostsByAuthor = query({
  args: { authorSlug: v.string() },
  returns: v.array(v.object({
    _id: v.id("posts"),
    _creationTime: v.number(),
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    date: v.string(),
    published: v.boolean(),
    tags: v.array(v.string()),
    readTime: v.optional(v.string()),
    image: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    featuredOrder: v.optional(v.number()),
    authorName: v.optional(v.string()),
    authorImage: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();

    // Filter by author slug match and not unlisted
    const filtered = posts.filter(post => {
      if (!post.authorName || post.unlisted) return false;
      const slug = post.authorName.toLowerCase().replace(/\s+/g, "-");
      return slug === args.authorSlug;
    });

    // Sort by date descending
    const sortedPosts = filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return sortedPosts.map((post) => ({
      _id: post._id,
      _creationTime: post._creationTime,
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
      published: post.published,
      tags: post.tags,
      readTime: post.readTime,
      image: post.image,
      excerpt: post.excerpt,
      featured: post.featured,
      featuredOrder: post.featuredOrder,
      authorName: post.authorName,
      authorImage: post.authorImage,
    }));
  },
});
```

### Step 3: Create AuthorPage Component

**File:** `src/pages/AuthorPage.tsx` (new file)

Based on `src/pages/TagPage.tsx` pattern:

- Accept `authorSlug` from URL params
- Query `getPostsByAuthor(authorSlug)`
- Display author name as heading
- Show post count
- List/card view toggle with localStorage persistence
- Reuse PostList component
- Back button to blog page
- Handle loading and empty states

### Step 4: Add Route

**File:** `src/App.tsx`

Add route alongside tag route:

```typescript
<Route path="/author/:authorSlug" element={<AuthorPage />} />
```

### Step 5: Make Author Name Clickable

**File:** `src/pages/Post.tsx`

Change author name from `<span>` to `<Link>`:

```typescript
// Before:
{post.authorName && (
  <span className="post-author-name">{post.authorName}</span>
)}

// After:
{post.authorName && (
  <Link
    to={`/author/${post.authorName.toLowerCase().replace(/\s+/g, "-")}`}
    className="post-author-name post-author-link"
  >
    {post.authorName}
  </Link>
)}
```

### Step 6: Add Author Link Styles

**File:** `src/styles/global.css`

```css
.post-author-link {
  color: inherit;
  text-decoration: none;
}
.post-author-link:hover {
  text-decoration: underline;
}
```

### Step 7: Add to Sitemap

**File:** `convex/http.ts`

In sitemap generation, add author pages (similar to tag pages):

```typescript
const authors = await ctx.runQuery(api.posts.getAllAuthors);

// Add author page URLs
...authors.map(
  (author: { slug: string }) => `  <url>
    <loc>${SITE_URL}/author/${encodeURIComponent(author.slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`,
),
```

### Step 8: Update Documentation

**File:** `files.md`

Add AuthorPage.tsx entry:

```markdown
| `AuthorPage.tsx` | Author archive page displaying posts by a specific author. Includes view mode toggle (list/cards) with localStorage persistence |
```

## Testing Checklist

- [ ] Posts with `authorName` show clickable link
- [ ] `/author/wayne-sutton` displays correct posts
- [ ] Authors with multiple posts show all posts
- [ ] View toggle (list/cards) works and persists
- [ ] Empty author slug shows 404 or empty state
- [ ] Sitemap includes author pages
- [ ] Mobile responsive layout works
- [ ] All four themes display correctly

## No Changes Needed

- `scripts/sync-posts.ts` - authorName already syncs
- `convex/schema.ts` fields - authorName field exists
- Frontmatter format - works as-is

## References

- Tag pages pattern: `src/pages/TagPage.tsx`, `convex/posts.ts` (getPostsByTag, getAllTags)
- Convex best practices: `.claude/skills/convex.md`
- Schema patterns: `.claude/skills/dev.md`
