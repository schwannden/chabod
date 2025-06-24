# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development

- `npm run dev` - Start development server (localhost:8080)
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run preview` - Preview production build

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

### Testing

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:rls` - Run RLS (Row Level Security) tests only
- `npm run test:ui` - Run UI component tests only
- `npm run test:ui:watch` - Run UI tests in watch mode

#### Quick Test Iteration Commands

```bash
# UI component test (fast iteration)
npm run test:ui -- ComponentName.test.tsx
npm run test:ui:watch -- ComponentName.test.tsx

# RLS test (specific file)
./tests/rls/run-rls-tests.sh groups.rls.test.ts
./tests/rls/run-rls-tests.sh --watch groups.rls.test.ts

# Run test by pattern
npm run test:ui -- --testNamePattern="should render"
```

#### When to Use Which Test Command

**Use `npm run test:ui` (Frontend Only) When:**

- **Only** modifying React components, hooks, or UI logic
- **Only** changing frontend functionality (forms, navigation, styling)
- **No** database operations or service layer changes
- **Fast feedback** needed for UI development

**Use `npm run test` (Full Test Suite) When:**

- **Any** backend/database changes (new tables, RLS policies, service functions)
- **Any** Supabase schema or migration changes
- **Cross-cutting** changes affecting both frontend and backend
- **Before** committing or creating PR
- **Any** changes to `src/lib/services/` or `src/integrations/supabase/`

### Special Testing

- `./tests/rls/run-rls-tests.sh` - Run RLS tests with Supabase setup
- `./tests/rls/run-rls-tests.sh --coverage` - Run RLS tests with coverage

## Architecture Overview

### Tech Stack

- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Query for server state
- **Internationalization**: React i18next (Chinese/English)

### Multi-Tenant Architecture

This is a **multi-tenant SaaS application** for church management where:

- Each church (tenant) has isolated data via Supabase RLS policies
- Tenant-specific routing: `/tenant/:tenantId/...`
- Global routes for tenant selection and authentication
- Comprehensive RLS testing ensures data isolation

### Key Directory Structure

```
src/
├── components/           # UI components organized by feature
│   ├── Auth/            # Authentication components
│   ├── Events/          # Event management
│   ├── Groups/          # Group management
│   ├── Members/         # Member management
│   ├── Resources/       # Resource management
│   ├── Services/        # Service management
│   ├── ServiceEvents/   # Service event scheduling
│   ├── Tenants/         # Tenant management
│   ├── shared/          # Shared components
│   └── ui/              # shadcn/ui components
├── contexts/            # React contexts (Auth, Session)
├── hooks/               # Custom React hooks
├── integrations/        # External service integrations
│   └── supabase/        # Supabase client and types
├── lib/                 # Utility functions and services
│   └── services/        # Business logic services
├── pages/               # Page components
│   └── tenant/          # Tenant-specific pages
└── main.tsx            # App entry point
```

### Core Patterns

#### Type Safety

- All database types generated from Supabase in `src/integrations/supabase/types.ts`
- Extended types in `src/lib/types.ts` for complex relationships
- Check `src/lib/types.ts` first to avoid duplicate type definitions
- Use compound types for entities with relations (e.g., `TenantWithUsage`)

#### Authentication & Session Management

- `SessionContext` provides user session, profile, and auth state
- All tenant operations require authentication
- Profile data fetched automatically on auth state changes

#### Data Access & Supabase Integration

- **Always** import Supabase client from `@/integrations/supabase/client`
- **Never** create new Supabase client instances
- Perform all database operations in service files in `src/lib/services/`
- Handle "not found" errors properly (code === "PGRST116")
- Use try/catch blocks with meaningful error messages
- React Query for caching and data synchronization

#### Form Handling

- **Always** use React Hook Form + Zod + zodResolver for forms
- Use `zodResolver` from `@hookform/resolvers/zod`
- Define Zod schemas with meaningful error messages
- Use shadcn Form components for consistent UI
- Handle loading states and form submission errors

**Standard Structure:**

```tsx
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { name: "" },
});

const onSubmit = async (values: z.infer<typeof formSchema>) => {
  try {
    // API call
    // Success message
  } catch (error) {
    // Error handling
  }
};
```

#### Internationalization

- **Replace ALL hardcoded text** with translation keys
- Use `useTranslation` hook with specific namespaces
- Available namespaces: `common`, `auth`, `dashboard`, `members`, `groups`, `resources`, `services`, `serviceEvents`, `events`, `announcements`, `tenant`, `profile`, `nav`, `shared`
- Use `common` namespace for generic UI actions (save, cancel, loading)
- Syntax: `t('key')` for single namespace, `t('namespace:key')` for multiple
- Translation files in `public/locales/[lang]/[namespace].json`

#### UI & Styling

- **Always** use Tailwind CSS for styling
- **Always** use shadcn/ui components as base templates
- **Never** modify `components/ui/` directly (shadcn components)
- Use composition patterns with shadcn components
- Follow PascalCase for component files and functions
- **Never** perform Supabase queries in components
- **Always** use service functions from `src/lib/services/`
- Use React Query for data fetching and caching

#### UX Conventions

- **Always** prompt confirmation for delete operations
- **Clearly warn** about cascading deletes in confirmation dialogs
- **Auto-refresh** lists/tables after CRUD operations
- Show loading states during form submissions
- Display success/error messages after operations

### Testing Strategy

#### RLS (Row Level Security) Tests

- Located in `tests/rls/`
- Test database security policies and tenant isolation
- Use real Supabase instance with containerized services
- Critical for multi-tenant data security
- Use `createRLSTest()` and `createStandardRLSTestSuite()`
- Always test: owner access, member restrictions, tenant isolation
- Always cleanup with `try/finally` blocks

#### UI Component Tests

- Located in `tests/ui/`
- Test component behavior and user interactions
- Mock external dependencies for isolation
- Use React Testing Library patterns
- Use `mockUseSessionHelpers.authenticated()` for auth state
- Test user behavior, not implementation details
- Use semantic queries: `getByRole`, `getByLabelText`
- Test error states and loading states

#### Required Coverage

- **New database table** → RLS test required
- **New component** → UI test required
- **Mirror structure**: `src/components/Feature/` → `tests/ui/components/Feature/`

### Development Notes

#### Environment Setup

- Uses Vite for development with HMR
- Tailwind CSS for styling
- ESLint + Prettier for code quality
- Husky for Git hooks

#### Database Integration

- Supabase migrations in `supabase/migrations/`
- Row Level Security policies enforce tenant isolation
- Generated types ensure type safety between frontend and backend

#### Deployment

- Configured for Vercel deployment
- Static files in `public/` directory
- Build output in `dist/`

### Key Files to Reference

- `src/integrations/supabase/types.ts` - Database types
- `src/lib/types.ts` - Extended application types
- `src/contexts/AuthContext.tsx` - Authentication context
- `package.json` - Available scripts and dependencies
- `vite.config.ts` - Build configuration
- `tests/README.md` - Comprehensive testing documentation
