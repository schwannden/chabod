# Supabase Integration Rules

This rule provides standards for working with Supabase in the application.

## Client Usage

- Always import the Supabase client from `@/integrations/supabase/client`
- Never create new instances of the Supabase client
- Use the strongly typed client with the Database types from `@/integrations/supabase/types`

## Database Operations

- Perform all database operations in service files located in `src/lib/`
- Handle errors consistently by using try/catch blocks and logging errors
- Return meaningful error messages to the UI layer
- Add appropriate comments to document complex queries
- Use proper error handling for "not found" cases (code === "PGRST116")

## Data Structure

- Follow the established patterns for database entity relationships
- Use the types defined in `src/lib/types.ts` which map to Supabase tables
- Create compound types for entities with their relations when needed (e.g., `TenantWithUsage`)

## Authentication

- Use the Supabase auth methods consistently
- Handle auth state through the authentication context provider
- Always check for user authentication before performing protected operations

## Best Practices

- Use RLS (Row Level Security) policies in Supabase for data access control
- Keep service functions focused on specific database operations
- Implement proper error handling and logging for all database operations
- Use parameterized queries to prevent SQL injection
- Avoid overfetching data by selecting only needed columns