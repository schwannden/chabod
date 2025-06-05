// General test setup file
// This file is used by the main jest.config.js for all test types

// Import and re-export RLS setup for compatibility
// This ensures RLS tests work when run through the main Jest config
import "./rls/setup";
export * from "./rls/setup";

// Additional general setup can be added here if needed
