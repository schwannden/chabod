# Contributing to Chabod

Thank you for your interest in contributing to Chabod! This document provides guidelines and instructions to help you get started.

## Prerequisites

- [Node.js](https://nodejs.org/) (we recommend using Volta for version management)
  - [Volta](https://volta.sh/) - for consistent Node.js and npm versions
- [Supabaswe Cli](https://supabase.com/docs/guides/local-development/cli/getting-started) - to start supabase and setup all databases locally.
- (Optional)[Cursor](https://cursor.sh/) - recommended IDE as our project has specific Cursor configurations

## Setting Up Volta

We use Volta to ensure consistent Node.js and npm versions across the development team:

```bash
# Install Volta
curl https://get.volta.sh | bash

# Install Node.js through Volta
volta install node
```

## Setup Local Supabase (First Time)

1. `supabase start`
2. Create a `.env.local` file with your local Supabase credentials:
   ```bash
   # Extract Supabase URL
   echo "VITE_SUPABASE_URL=http://localhost:54321" > .env.local
   
   # Extract and add Supabase anon key
   echo "VITE_SUPABASE_ANON_KEY=$(supabase status | grep "anon key:" | awk '{print $3}')" >> .env.local
   ```

## Development Environment Setup

1. Fork the repository
2. Clone your fork:

   ```bash
   git clone https://github.com/YOUR-USERNAME/chabod.git
   cd chabod
   ```

3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`

## Sync from Database

See [Official Docs](https://supabase.com/docs/reference/cli/supabase-db)

1. `supabase link --project-ref cbqslwwonnlkvblpvyrc`
2. `supabase db pull`
3. `supabase migration up`

## IDE Setup

We recommend using [Cursor](https://cursor.sh/) as your IDE for this project as we have specific Cursor configurations in the `.cursor` file that help maintain consistent development practices.

## Development Workflow

1. Create a new branch:
   ```bash
   git checkout -b {type}/{pr-name}
   ```
   type should be docs/feat/fix/refactor/build/chore, depending on your task type.

2. Make your changes

3. Run tests and linting before committing:
   ```bash
   npm run format
   npm run lint:fix
   ```

4. Commit your changes using conventional commit messages

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with automatic fixes
- `npm run format` - Run Prettier to format code
- `npm run preview` - Preview the production build locally

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
