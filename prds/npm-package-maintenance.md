# NPM Package Maintenance Guide

This document explains how to keep the `create-markdown-sync` npm package updated with the main markdown-sync app.

## Overview

The CLI package lives in `packages/create-markdown-sync/` and clones from `github:waynesutton/markdown-site`. When the main app changes, the CLI may need updates to stay compatible.

## Package Location

```
packages/
  create-markdown-sync/
    package.json          # Version and dependencies
    tsconfig.json         # TypeScript config
    src/
      index.ts           # CLI entry point
      wizard.ts          # Interactive prompts
      clone.ts           # Template cloning
      configure.ts       # Site configuration
      install.ts         # Dependency installation
      convex-setup.ts    # Convex setup
      utils.ts           # Helper utilities
    dist/                # Built JavaScript (gitignored)
```

## When to Update the CLI

Update the CLI package when:

1. **New configuration options** - Added to `fork-config.json.example` or `siteConfig.ts`
2. **New wizard prompts needed** - New features require user input during setup
3. **Template structure changes** - Files moved, renamed, or removed
4. **Convex setup changes** - Auth config, environment variables, or setup flow
5. **Bug fixes** - Issues discovered during user testing

## Commands

### Development

```bash
cd packages/create-markdown-sync

# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Test locally via npm link
npm link
npx create-markdown-sync test-project
```

### Publishing

```bash
cd packages/create-markdown-sync

# Bump version (choose one)
npm version patch   # 0.1.0 -> 0.1.1 (bug fixes)
npm version minor   # 0.1.0 -> 0.2.0 (new features)
npm version major   # 0.1.0 -> 1.0.0 (breaking changes)

# Publish to npm
npm publish --access public

# Verify publication
npm view create-markdown-sync
```

## Checklist: Before Publishing

1. **Push main app changes to GitHub first**
   - The CLI clones from `github:waynesutton/markdown-site`
   - Template fixes must be in the remote repo

2. **Test the full flow**
   ```bash
   rm -rf test-project
   npx create-markdown-sync test-project
   cd test-project
   npx convex dev
   npm run sync
   npm run dev
   ```

3. **Verify wizard prompts match fork-config.json.example**
   - New options should have corresponding prompts
   - Defaults should match the example file

4. **Update version number**
   - Use semantic versioning
   - Update `VERSION` constant in `src/index.ts` if displayed

5. **Build successfully**
   ```bash
   npm run build
   # Should complete with no TypeScript errors
   ```

## Sync Points

These files in the CLI should stay in sync with the main app:

| CLI File | Syncs With | Purpose |
|----------|------------|---------|
| `wizard.ts` | `fork-config.json.example` | All config options have prompts |
| `configure.ts` | `scripts/configure-fork.ts` | Same transformation logic |
| `configure.ts` | `siteConfig.ts` | Template fixes for known issues |
| `convex-setup.ts` | `convex/auth.config.ts` | Auth setup flow |
| `utils.ts` | Success message links | Docs URLs are current |

## Adding New Configuration Options

When a new option is added to `fork-config.json.example`:

1. **Add prompt to wizard.ts**
   ```typescript
   // In the appropriate section
   const newOption = await prompts({
     type: 'confirm',
     name: 'newOption',
     message: 'Enable new feature?',
     initial: false,
   });
   ```

2. **Add to WizardAnswers type**
   ```typescript
   export interface WizardAnswers {
     // ... existing fields
     newOption: boolean;
   }
   ```

3. **Add to buildForkConfig in configure.ts**
   ```typescript
   function buildForkConfig(answers: WizardAnswers) {
     return {
       // ... existing fields
       newOption: answers.newOption,
     };
   }
   ```

4. **Test the flow**
   ```bash
   npm run build
   npm link
   npx create-markdown-sync test-project
   ```

## Handling Breaking Changes

When the main app has breaking changes:

1. **Update CLI to handle both old and new**
   - Check for file existence before modifying
   - Use try/catch for optional operations

2. **Bump major version if CLI behavior changes**
   ```bash
   npm version major
   ```

3. **Update README with migration notes**

4. **Consider backward compatibility period**
   - Keep old logic for 1-2 releases
   - Add deprecation warnings

## Troubleshooting

### "Template cloned but configuration failed"

The template likely has syntax errors or missing files. Check:
- `siteConfig.ts` for embedded quotes or syntax issues
- `fork-config.json.example` for valid JSON

### "Convex setup blocked by WorkOS"

The CLI should disable auth by default. Check:
- `configure.ts` `disableAuthConfig()` function
- `convex/auth.config.ts` in the template

### "TypeScript build errors"

Usually caused by:
- Missing type definitions
- Spread operator ordering (put spread first, then defaults)
- Import path issues (.js extensions required for ESM)

## Version History

| Version | Changes |
|---------|---------|
| 0.1.0 | Initial release with 13-section wizard |

## Resources

- npm package: https://www.npmjs.com/package/create-markdown-sync
- Template repo: https://github.com/waynesutton/markdown-site
- Docs: https://www.markdown.fast/docs
- Deployment: https://www.markdown.fast/docs-deployment
- WorkOS setup: https://www.markdown.fast/how-to-setup-workos
