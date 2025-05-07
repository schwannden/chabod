# Contributing to Chabod

Thank you for your interest in contributing to Chabod! This document provides guidelines and instructions to help you get started.

## Prerequisites

- [Node.js](https://nodejs.org/) (we recommend using Volta for version management)
  - [Volta](https://volta.sh/) - for consistent Node.js and npm versions
- [Cursor](https://cursor.sh/) - recommended IDE as our project has specific Cursor configurations

## Setting Up Volta

We use Volta to ensure consistent Node.js and npm versions across the development team:

```bash
# Install Volta
curl https://get.volta.sh | bash

# Install Node.js through Volta
volta install node
```

## Development Environment Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/chabod.git
   cd chabod
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## IDE Setup

We recommend using [Cursor](https://cursor.sh/) as your IDE for this project as we have specific Cursor configurations in the `.cursor` file that help maintain consistent development practices.

## Development Workflow

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run tests and linting before committing:
   ```bash
   npm run lint
   ```

4. Fix any linting issues:
   ```bash
   npm run lint:fix
   ```

5. Format your code:
   ```bash
   npm run format
   ```

6. Commit your changes using conventional commit messages

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
