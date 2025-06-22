# Contributing to Chabod

Thank you for your interest in contributing to Chabod! This document provides guidelines and instructions to help you get started.

For a comprehensive overview of the project, tech stack, and features, please see our [main README](../README.md).

**Join Discussion**: https://discord.gg/hnQrfUvFk3

## Prerequisites

- [Node.js](https://nodejs.org/) (we recommend using Volta for version management)
  - [Volta](https://volta.sh/) - for consistent Node.js and npm versions
- [Supabaswe Cli](https://supabase.com/docs/guides/local-development/cli/getting-started) - to start supabase and setup all databases locally.
- (Optional) [Cursor](https://cursor.sh/) - recommended IDE as our project has specific Cursor configurations, we have specific Cursor configurations in the `.cursor/rules` file that help maintain consistent development practices.

## Setting Up Volta

We use Volta to ensure consistent Node.js and npm versions across the development team:

```bash
# Install Volta
curl https://get.volta.sh | bash

# Install Node.js through Volta
volta install node
```

## Running Chabod Locally

1. Fork the repository
2. Clone your fork:

   ```bash
   git clone https://github.com/YOUR-USERNAME/chabod.git
   cd chabod
   ```

### Setup Local Supabase (First Time)

1. `supabase start`

### Start Frontend

1. Create a `.env.local` file with your local Supabase credentials:

   ```bash
   # Extract Supabase URL
   echo "VITE_SUPABASE_URL=http://localhost:54321" > .env.local

   # Extract and add Supabase anon key
   echo "VITE_SUPABASE_ANON_KEY=$(supabase status | grep "anon key:" | awk '{print $3}')" >> .env.local
   ```

2. Install dependencies: `npm install --legacy-peer-deps`
3. Setup husky: `npm prepare`
4. Start the development server: `npm run dev`

## Contribution Involving DB Migration

After testing is done properly in local db, we need to generate migration,
see [Official Docs](https://supabase.com/docs/reference/cli/supabase-db) for more comprehensive guide.

1. `supabase link --project-ref cbqslwwonnlkvblpvyrc`
2. `supabase db diff -f supabase/migrations/{timesyamp}_{meaningfulname}.sql`
3. remember to commit the migration file together with your pr.

## Development Workflow

1. Create a new branch:

   ```bash
   git checkout -b {type}/{pr-name}
   ```

   type should be one of `feat`/`fix`/`build`/`chore`/`refactor`/`docs`/`test`, depending on your task type.

2. Make your changes

3. Run tests and linting before committing:

   ```bash
   npm run format
   npm run lint:fix
   npm run test
   ```

   **Testing Guidelines:**

   - All RLS (Row Level Security) policies must be tested
   - Run `npm run test:rls` to run only RLS-specific tests
   - For detailed testing documentation, patterns, and best practices, see our [Test Documentation](../tests/README.md)

4. Commit your changes using [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) messages.

   ```
   <type>: <short summary>
   ```

   Examples:

   - `feat: add new prayer entry feature`
   - `fix: resolve bug in edit prayer form`
   - Refer to [release please config](https://github.com/schwannden/chabod/blob/main/release-please-config.json#L12) for more types.

## Pull Request Process

1. Update the README.md or documentation with details of changes if applicable
2. Update the package.json version if applicable
3. The PR must pass all CI/CD checks before it will be merged
4. A maintainer will review your PR and may request changes

## Code Style

This project uses:

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting

The configuration for these tools is defined in:

- `.eslintrc.js`
- `.prettierrc`

Following these guidelines helps keep the codebase clean and maintainable.

## License

By contributing to Chabod, you agree that your contributions will be licensed under the project's license.
