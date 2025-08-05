name: "Seed Data Read-Only Beta Transition PRP - Complete Context for One-Pass Implementation"
description: |

## Purpose

Transition Chabod from alpha to beta release by making seed data read-only (template-based), updating documentation to reflect beta status, and reorganizing demo account information for local development only.

## Core Principles

1. **Context is King**: Complete file references, Discord icon requirements, and i18n patterns included
2. **Validation Loops**: Executable tests and documentation validation provided
3. **Information Dense**: Specific file paths, content changes, and integration points
4. **Progressive Success**: Start with file renaming, validate config, then update docs and announcements
5. **Global rules**: Follow all conventions in CLAUDE.md and existing i18n patterns

---

## Goal

Transform Chabod's seed data from active seeding to template-based for local development only, update all references from alpha to beta status with appropriate messaging, and reorganize demo account information to development-focused documentation.

## Why

- **Release Management**: Transition from alpha (database resets) to beta (stable but feature-incomplete)
- **Developer Experience**: Maintain seed data availability for local development via template
- **User Communication**: Update alpha warnings to appropriate beta messaging with community engagement
- **Documentation Quality**: Centralize demo information in appropriate developer-focused location

## What

Convert seed.sql to seed.sql.template, update all documentation references, change alpha warnings to beta notices with Discord community links, and move demo account information to CONTRIBUTING.md while updating Discord text links to icons.

### Success Criteria

- [ ] seed.sql renamed to seed.sql.template and excluded from active seeding
- [ ] supabase/config.toml updated to reference template with instructions
- [ ] All alpha warnings replaced with beta notices in both English and Chinese
- [ ] Demo account information moved from README files to CONTRIBUTING.md
- [ ] Discord text link replaced with icon in both README files
- [ ] All references to seed.sql updated with template instructions
- [ ] Build and linting passes with no errors

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: /Users/schwanndenkuo/Documents/personal/chabod/CLAUDE.md
  why: Development patterns, commands, and i18n requirements
  section: Common Commands, Internationalization patterns

- file: /Users/schwanndenkuo/Documents/personal/chabod/supabase/seed.sql
  why: Comprehensive seed data structure to preserve as template
  critical: Contains price tiers, demo users, tenants, groups, services, events

- file: /Users/schwanndenkuo/Documents/personal/chabod/supabase/config.toml
  why: Current seed file configuration that needs updating
  line: 58 - sql_paths = ["./seed.sql"]

- file: /Users/schwanndenkuo/Documents/personal/chabod/public/locales/en/announcements.json
  why: Current alpha warning structure to transform to beta notice

- file: /Users/schwanndenkuo/Documents/personal/chabod/public/locales/zh-TW/announcements.json
  why: Chinese alpha warning structure to transform to beta notice

- file: /Users/schwanndenkuo/Documents/personal/chabod/README.md
  why: Current Discord link and demo account info location (Chinese)

- file: /Users/schwanndenkuo/Documents/personal/chabod/README.en.md
  why: Current Discord link and demo account info location (English)

- file: /Users/schwanndenkuo/Documents/personal/chabod/.github/CONTRIBUTING.md
  why: Target location for demo account information
```

### Current Codebase Structure (Key Files)

```bash
chabod/
├── supabase/
│   ├── seed.sql                    # TO RENAME: seed.sql.template
│   └── config.toml                 # TO UPDATE: seed file reference
├── public/locales/
│   ├── en/announcements.json       # TO UPDATE: alpha → beta notice
│   └── zh-TW/announcements.json    # TO UPDATE: alpha → beta notice
├── README.md                       # TO UPDATE: Discord icon, remove demo info
├── README.en.md                    # TO UPDATE: Discord icon, remove demo info
└── .github/
    └── CONTRIBUTING.md             # TO UPDATE: add demo account info
```

### Desired Codebase Changes

```bash
chabod/
├── supabase/
│   ├── seed.sql.template          # RENAMED: Contains all seed data as template
│   └── config.toml                # UPDATED: Comments out sql_paths, adds instructions
├── public/locales/
│   ├── en/announcements.json      # UPDATED: betaVersion notice with Discord link
│   └── zh-TW/announcements.json   # UPDATED: betaVersion notice with Discord link
├── README.md                      # UPDATED: Discord icon, demo info removed
├── README.en.md                   # UPDATED: Discord icon, demo info removed
└── .github/
    └── CONTRIBUTING.md            # UPDATED: Demo account section added
```

### Known Gotchas & Library Quirks

```yaml
# CRITICAL: Internationalization requires both English and Chinese updates
# Pattern: announcements.json requires consistent key naming (alphaVersion → betaVersion)
# Pattern: Discord icon requires specific markdown syntax: [![Discord](icon-url)](discord-url)
# Pattern: Supabase config.toml uses TOML syntax with array brackets for sql_paths
# Pattern: CONTRIBUTING.md already has Discord link, avoid duplication
```

## Implementation Blueprint

### Current Alpha Warning Structure

```json
// English announcements.json
{
  "alphaVersion": {
    "title": "Alpha Version Notice",
    "message": "Chabod is currently in alpha version, database could be reset at any moment. We recommend contributors to use local development environment.",
    "icon": "warning",
    "dontShowAgain": "Don't show this again",
    "understood": "Understood"
  }
}
```

### Target Beta Notice Structure

```json
// English announcements.json
{
  "betaVersion": {
    "title": "Beta Version Notice",
    "message": "Chabod is now in beta version, some features may be susceptible to breaking changes. We need your input to improve this service. Join us at Discord.",
    "icon": "info",
    "dontShowAgain": "Don't show this again",
    "understood": "Understood"
  }
}
```

### List of Tasks to be Completed (In Order)

```yaml
Task 1: RENAME seed data file
RENAME supabase/seed.sql → supabase/seed.sql.template:
  - PRESERVE all existing content exactly
  - MAINTAIN file in same directory

Task 2: UPDATE Supabase configuration
MODIFY supabase/config.toml:
  - FIND line 58: sql_paths = ["./seed.sql"]
  - REPLACE with: # sql_paths = ["./seed.sql.template"]  # Uncomment and rename for local dev
  - ADD comment: # For local development: mv seed.sql.template seed.sql

Task 3: UPDATE English beta announcement
MODIFY public/locales/en/announcements.json:
  - FIND key: "alphaVersion"
  - REPLACE key: "betaVersion"
  - UPDATE title: "Beta Version Notice"
  - UPDATE message: "Chabod is now in beta version, some features may be susceptible to breaking changes. We need your input to improve this service. Join us at Discord."
  - UPDATE icon: "info"
  - PRESERVE dontShowAgain and understood keys

Task 4: UPDATE Chinese beta announcement
MODIFY public/locales/zh-TW/announcements.json:
  - FIND key: "alphaVersion"
  - REPLACE key: "betaVersion"
  - UPDATE title: "Beta 版本通知"
  - UPDATE message: "Chabod 目前為 Beta 版本，部分功能可能會有破壞性變更。我們需要您的意見來改進此服務。歡迎加入我們的 Discord。"
  - UPDATE icon: "info"
  - PRESERVE dontShowAgain and understood keys

Task 5: ADD demo account info to CONTRIBUTING.md
MODIFY .github/CONTRIBUTING.md:
  - FIND appropriate section (after Discord link around line 7)
  - ADD new section:
    ## Demo Account (Local Development)

    For local development and testing, you can use the following demo account after running seed data:

    - **Email:** admin@fruitful-tools.com
    - **Password:** strongAndFruitfulPassword

    Note: This account is only available when using the seed.sql.template file in your local development environment.

Task 6: UPDATE Chinese README Discord link to icon
MODIFY README.md:
  - FIND line 11: **加入討論**: https://discord.gg/hnQrfUvFk3
  - REPLACE with: **加入討論**: [![Discord](https://img.shields.io/discord/1234567890?logo=discord&logoColor=white&label=Discord&color=5865F2)](https://discord.gg/hnQrfUvFk3)
  - FIND demo account section (lines 13-16)
  - REMOVE lines containing demo account email and password

Task 7: UPDATE English README Discord link to icon
MODIFY README.en.md:
  - FIND line 11: **Join Discussion**: https://discord.gg/hnQrfUvFk3
  - REPLACE with: **Join Discussion**: [![Discord](https://img.shields.io/discord/1234567890?logo=discord&logoColor=white&label=Discord&color=5865F2)](https://discord.gg/hnQrfUvFk3)
  - FIND demo account section (lines 13-16)
  - REMOVE lines containing demo account email and password
```

### Integration Points

```yaml
SUPABASE_CONFIG:
  - file: supabase/config.toml
  - action: Comment out sql_paths to disable automatic seeding
  - instruction: Add clear comment for local development setup

I18N_ANNOUNCEMENTS:
  - files: public/locales/{en,zh-TW}/announcements.json
  - action: Transform alphaVersion to betaVersion with new messaging
  - pattern: Maintain identical structure, update content only

DOCUMENTATION:
  - files: README.md, README.en.md
  - action: Replace Discord text links with icons, remove demo info
  - target: .github/CONTRIBUTING.md for demo account centralization
```

## Validation Loop

### Level 1: Syntax & Style

```bash
# Run these FIRST - fix any errors before proceeding
npm run lint              # ESLint validation for any JSON syntax
npm run format           # Prettier formatting for consistent style

# Expected: No errors. If JSON syntax errors, fix immediately.
```

### Level 2: Configuration Validation

```bash
# Validate Supabase configuration after changes
cd supabase
supabase status          # Should show config is valid
cd ..

# Test that seed.sql.template exists and seed.sql is gone
ls -la supabase/seed.sql.template  # Should exist
ls -la supabase/seed.sql           # Should not exist

# Expected: Config loads, template file exists, original removed
```

### Level 3: Documentation Validation

```bash
# Validate JSON files are valid
node -p "JSON.parse(require('fs').readFileSync('public/locales/en/announcements.json', 'utf8'))"
node -p "JSON.parse(require('fs').readFileSync('public/locales/zh-TW/announcements.json', 'utf8'))"

# Check that Discord icons render properly in markdown
echo "Testing Discord icon rendering..."

# Validate that CONTRIBUTING.md has demo account section
grep -A 5 "Demo Account" .github/CONTRIBUTING.md

# Expected: JSON is valid, Discord icons visible, demo info in CONTRIBUTING.md
```

### Level 4: Build Validation

```bash
# Full build test to ensure no breaking changes
npm run build            # Production build should succeed
npm run preview          # Preview should start without errors

# Expected: Build succeeds, preview starts, no console errors
```

## Final Validation Checklist

- [ ] All files renamed/updated: `ls -la supabase/seed.sql.template && ! ls supabase/seed.sql`
- [ ] Config updated: `grep -A 2 "sql_paths" supabase/config.toml | grep "#"`
- [ ] JSON valid: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Discord icons display: Check README files in GitHub preview
- [ ] Demo info centralized: `grep -A 5 "Demo Account" .github/CONTRIBUTING.md`
- [ ] Beta notices implemented: `grep "betaVersion" public/locales/*/announcements.json`
- [ ] No references to seed.sql remain: `grep -r "seed\.sql" . --exclude-dir=node_modules`

---

## Anti-Patterns to Avoid

- ❌ Don't modify the content of seed data - only rename the file
- ❌ Don't break JSON syntax in announcement files - validate after changes
- ❌ Don't remove Discord links - convert text to icons
- ❌ Don't leave demo account info in both README and CONTRIBUTING.md
- ❌ Don't forget to update both English and Chinese versions
- ❌ Don't change the announcement key structure - components may depend on it
- ❌ Don't hardcode Discord server IDs in icons - use placeholder or real ID

## Confidence Score: 9/10

**High confidence for one-pass implementation because:**

- ✅ All file paths explicitly provided with current content
- ✅ Exact text replacements specified with before/after examples
- ✅ Comprehensive validation steps for each change type
- ✅ Clear task ordering prevents dependency issues
- ✅ Existing patterns and structures well-documented
- ✅ Both i18n languages covered with specific translations
- ✅ Build and configuration validation included

**Minor risk areas:**

- Discord icon URL placeholder may need real server ID for proper display
- Component dependencies on announcement key names (alphaVersion → betaVersion) need verification
