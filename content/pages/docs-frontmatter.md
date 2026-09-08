---
title: "Frontmatter Options"
slug: "docs-frontmatter"
published: true
order: 3
showInNav: false
layout: "sidebar"
rightSidebar: true
showFooter: true
docsSection: false
docsSectionOrder: 3
docsSectionGroup: "Setup"
docsSectionGroupIcon: "Rocket"
---

## Frontmatter Options

Frontmatter is the YAML metadata at the top of each markdown file between `---` markers. It controls how content is displayed, organized, and discovered.

## Blog post fields

| Field                   | Required | Description                                                                                                                                                                                            |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`                 | Yes      | Post title                                                                                                                                                                                             |
| `description`           | Yes      | SEO description                                                                                                                                                                                        |
| `date`                  | Yes      | YYYY-MM-DD format                                                                                                                                                                                      |
| `slug`                  | Yes      | URL path (unique)                                                                                                                                                                                      |
| `published`             | Yes      | `true` to show                                                                                                                                                                                         |
| `tags`                  | Yes      | Array of strings                                                                                                                                                                                       |
| `readTime`              | No       | Display time estimate                                                                                                                                                                                  |
| `image`                 | No       | OG image and featured card thumbnail. See [Using Images in Blog Posts](/using-images-in-posts) for markdown and HTML syntax                                                                            |
| `ogImage`               | No       | Social share image override. Only changes the Open Graph and Twitter preview image; cards and headers keep using `image`. Set `ogImage: false` to disable the share image entirely.                    |
| `noOgImage`             | No       | Set `true` for a text-only share preview (no image). Social previews show just the title and description. Same effect as `ogImage: false`.                                                             |
| `showImageAtTop`        | No       | Set `true` to display the image at the top of the post above the header (default: `false`)                                                                                                             |
| `excerpt`               | No       | Short text for card view                                                                                                                                                                               |
| `featured`              | No       | `true` to show in the homepage featured section (its heading comes from `siteConfig.featuredTitle`). Requires `published: true` and no `unlisted: true`.                                                |
| `featuredOrder`         | No       | Order in the homepage featured section (lower = first)                                                                                                                                                 |
| `authorName`            | No       | Author display name shown next to date                                                                                                                                                                 |
| `authorImage`           | No       | Round author avatar image URL                                                                                                                                                                          |
| `layout`                | No       | Set to `"sidebar"` for docs-style layout with TOC                                                                                                                                                      |
| `rightSidebar`          | No       | Enable right sidebar with CopyPageDropdown (opt-in, requires explicit `true`)                                                                                                                          |
| `showFooter`            | No       | Show footer on this post (overrides siteConfig default)                                                                                                                                                |
| `footer`                | No       | Per-post closing note markdown (wins over Site Config copy and `footer.md`)                                                                                                                         |
| `showSocialFooter`      | No       | Show social footer on this post (overrides siteConfig default)                                                                                                                                         |
| `aiChat`                | No       | Enable AI chat in right sidebar. Set `true` to enable (requires `rightSidebar: true` and `siteConfig.aiChat.enabledOnContent: true`). Set `false` to explicitly hide even if global config is enabled. |
| `blogFeatured`          | No       | Show as featured on blog page (first becomes hero, rest in 2-column row)                                                                                                                               |
| `newsletter`            | No       | Override newsletter signup display (`true` to show, `false` to hide)                                                                                                                                   |
| `contactForm`           | No       | Enable contact form on this post                                                                                                                                                                       |
| `unlisted`              | No       | Hide from listings but allow direct access via slug. Set `true` to hide from blog listings, featured sections, tag pages, search results, related posts, sitemap, RSS, and API listings. The post remains accessible via direct link and serves a `noindex, nofollow` robots meta tag so search engines skip it. |
| `aiWritten`             | No       | Posts only. Set `true` to show a small note under the title: "This post was written with AI and proofed by a human." Set `false` to hide it. This field overrules the Drafts Inbox Written with AI default. Omitted means no note. |
| `audio`                 | No       | Posts only. `true` shows the listen player under the title and, on save or sync of a published post, generates the reading. `false` hides it. Omitted uses the Site Config default, which is on. Works on existing posts the same way: set it and save, or add it to the markdown file and run sync. |
| `audioVoice`            | No       | Posts only. `male` or `female`. Omitted uses the Site Config default voice (female). Changing the voice on a published post regenerates the file on the next save or sync. |
| `minimap`               | No       | Posts only. Set `true` to render a right-side heading outline (h1 to h6) that highlights the current section as the reader scrolls. Needs at least one heading. The rail sits in the right margin so the article stays centered. Hidden below 1135px, where the headings move into the mobile menu. Shown instead of `rightSidebar` when both are on. Default: `false`. |
| `hideNav`               | No       | Posts only. Set `true` to let the site navigation bar scroll away with the page instead of staying pinned to the top. The nav still shows when the reader is at the top of the post. Default: `false`.  |
| `docsSection`           | No       | Include in docs sidebar. Set `true` to show in the docs section navigation.                                                                                                                            |
| `docsSectionGroup`      | No       | Group name for docs sidebar. Posts with the same group name appear together.                                                                                                                           |
| `docsSectionOrder`      | No       | Order within docs group. Lower numbers appear first within the group.                                                                                                                                  |
| `docsSectionGroupOrder` | No       | Order of the group in docs sidebar. Lower numbers make the group appear first. Groups without this field sort alphabetically.                                                                          |
| `docsSectionGroupIcon`  | No       | Phosphor icon name for docs sidebar group (e.g., "Rocket", "Book", "PuzzlePiece"). Icon appears left of the group title. See [Phosphor Icons](https://phosphoricons.com) for available icons.         |
| `docsLanding`           | No       | Set `true` to use this post as the docs landing page (shown when navigating to `/docs`).                                                                                                               |
| `slides`                | No       | Enable slide presentation mode. Set `true` to add a Present button that launches fullscreen slides. Content splits on `---` horizontal rules.                                                          |

## Page fields

| Field                   | Required | Description                                                                                                                                                                                            |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`                 | Yes      | Nav link text                                                                                                                                                                                          |
| `slug`                  | Yes      | URL path                                                                                                                                                                                               |
| `published`             | Yes      | `true` to show                                                                                                                                                                                         |
| `order`                 | No       | Nav order (lower = first)                                                                                                                                                                              |
| `showInNav`             | No       | Show in navigation menu (default: `true`)                                                                                                                                                              |
| `excerpt`               | No       | Short text for card view                                                                                                                                                                               |
| `image`                 | No       | Thumbnail for featured card view                                                                                                                                                                       |
| `ogImage`               | No       | Social share image override. Only changes the Open Graph and Twitter preview image; cards keep using `image`. Set `ogImage: false` to disable the share image entirely.                                |
| `noOgImage`             | No       | Set `true` for a text-only share preview (no image). Social previews show just the title and description. Same effect as `ogImage: false`.                                                             |
| `showImageAtTop`        | No       | Set `true` to display the image at the top of the page above the header (default: `false`)                                                                                                             |
| `featured`              | No       | `true` to show in the homepage featured section (its heading comes from `siteConfig.featuredTitle`). Requires `published: true` and no `unlisted: true`.                                                |
| `featuredOrder`         | No       | Order in the homepage featured section (lower = first)                                                                                                                                                 |
| `authorName`            | No       | Author display name shown next to date                                                                                                                                                                 |
| `authorImage`           | No       | Round author avatar image URL                                                                                                                                                                          |
| `layout`                | No       | Set to `"sidebar"` for docs-style layout with TOC                                                                                                                                                      |
| `rightSidebar`          | No       | Enable right sidebar with CopyPageDropdown (opt-in, requires explicit `true`)                                                                                                                          |
| `showFooter`            | No       | Show footer on this page (overrides siteConfig default)                                                                                                                                                |
| `footer`                | No       | Per-page closing note markdown (wins over Site Config copy and `footer.md`)                                                                                                                         |
| `showSocialFooter`      | No       | Show social footer on this page (overrides siteConfig default)                                                                                                                                         |
| `aiChat`                | No       | Enable AI chat in right sidebar. Set `true` to enable (requires `rightSidebar: true` and `siteConfig.aiChat.enabledOnContent: true`). Set `false` to explicitly hide even if global config is enabled. |
| `newsletter`            | No       | Override newsletter signup display (`true` to show, `false` to hide)                                                                                                                                   |
| `contactForm`           | No       | Enable contact form on this page                                                                                                                                                                       |
| `unlisted`              | No       | Hide from listings but allow direct access via slug. Set `true` to hide from navigation, featured sections, search results, sitemap, and API listings. The page remains accessible via direct link and serves a `noindex, nofollow` robots meta tag so search engines skip it. |
| `textAlign`             | No       | Text alignment: "left" (default), "center", or "right". Used by `home.md` for home intro alignment                                                                                                     |
| `docsSection`           | No       | Include in docs sidebar. Set `true` to show in the docs section navigation.                                                                                                                            |
| `docsSectionGroup`      | No       | Group name for docs sidebar. Pages with the same group name appear together.                                                                                                                           |
| `docsSectionOrder`      | No       | Order within docs group. Lower numbers appear first within the group.                                                                                                                                  |
| `docsSectionGroupOrder` | No       | Order of the group in docs sidebar. Lower numbers make the group appear first. Groups without this field sort alphabetically.                                                                          |
| `docsSectionGroupIcon`  | No       | Phosphor icon name for docs sidebar group (e.g., "Rocket", "Book", "PuzzlePiece"). Icon appears left of the group title. See [Phosphor Icons](https://phosphoricons.com) for available icons.         |
| `docsLanding`           | No       | Set `true` to use this page as the docs landing page (shown when navigating to `/docs`).                                                                                                               |
| `slides`                | No       | Enable slide presentation mode. Set `true` to add a Present button that launches fullscreen slides. Content splits on `---` horizontal rules.                                                          |

## Common patterns

### Hide pages from navigation

Set `showInNav: false` to keep a page published and accessible via direct URL, but hidden from the navigation menu. Pages with `showInNav: false` remain searchable and available via API endpoints. Useful for pages you want to link directly but not show in the main nav.

### Unlisted posts and pages

Set `unlisted: true` to hide a post or page from all listings while keeping it live at its direct URL. Unlisted content is excluded from: blog listings (`/blog` page), navigation, featured sections, tag pages (`/tags/[tag]`), search results (Command+K), related posts, the sitemap, RSS feeds, and API listings. It also serves a `noindex, nofollow` robots meta tag and an `X-Robots-Tag: noindex` header on API and raw markdown responses so Google will not index it. Anyone with the link can still view and share it. Your unlisted URLs are listed in the dashboard under Posts and Pages using the Unlisted filter tab, with a copy link button on each row. Unpublished (`published: false`) remains the only truly private state.

### Control the social share image

Three ways to control what social previews show, without touching cards or headers:

```yaml
# Use a different image for social previews only
image: "/images/card-thumbnail.png"
ogImage: "/images/share-wide.png"

# Text-only preview (title and description, no image)
noOgImage: true

# Shorthand for the same text-only behavior
ogImage: false
```

When the share image is disabled, the Twitter card switches from `summary_large_image` to `summary` so the preview renders cleanly as text. If neither `ogImage` nor `image` is set, the site default OG image is used. You can also set these from the dashboard editor under More options, which includes upload buttons for both the featured image and the share image.

### Show image at top

Add `showImageAtTop: true` to display the `image` field at the top of the post/page above the header. Default behavior: if `showImageAtTop` is not set or `false`, image only used for Open Graph previews and featured card thumbnails.

### Image lightbox

Images in blog posts and pages automatically open in a full-screen lightbox when clicked (if enabled in `siteConfig.imageLightbox.enabled`). This allows readers to view images at full size. The lightbox can be closed by clicking outside the image, pressing Escape, or clicking the close button.

### Text alignment

Use `textAlign` field to control text alignment for page content. Options: `"left"` (default), `"center"`, or `"right"`. Used by `home.md` to control home intro alignment.

### Docs section

To add content to the docs sidebar:

1. Add `docsSection: true` to frontmatter
2. Optionally set `docsSectionGroup` to group related content
3. Use `docsSectionOrder` to control order within groups
4. Use `docsSectionGroupOrder` to control group order
5. Add `docsSectionGroupIcon` for visual icons (Phosphor icons)

### Docs landing page

Set `docsLanding: true` on one post or page to make it the docs landing page. This content displays when navigating to `/docs`.

### Slide presentations

Set `slides: true` on any post or page to enable presentation mode. A Present button appears in the post header. Clicking it opens a fullscreen overlay where each `---` horizontal rule in your markdown becomes a slide boundary. Navigate with arrow keys, space bar, or the on-screen buttons. Press Escape to exit. The post still renders normally as a readable article by default. See the [slide template example](/slide-template-example) for a working demo.
