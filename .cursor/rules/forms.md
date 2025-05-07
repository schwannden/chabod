# Form Handling Rules

This rule provides standards for form implementation and validation.

## Form Libraries

- Use React Hook Form for form state management
- Use Zod for schema validation
- Use the `zodResolver` from `@hookform/resolvers/zod` to connect Hook Form with Zod

## Form Structure

- Define form schemas using Zod in the component or a custom hook
- Use shadcn's Form components for consistent UI
- Follow the established pattern for form field components
- Add proper error handling and field validation

## Validation

- Define all validation rules using Zod schemas
- Include meaningful error messages for validation failures
- Validate forms both client-side and server-side when appropriate
- Use consistent validation patterns across forms

## Form Submission

- Handle form submission in a separate function
- Show loading state during submission
- Display success/error messages after submission
- Implement proper error handling for form submission

## Example Structure

```tsx
// Define schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  // ... other fields
});

// Use with React Hook Form
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    name: "",
    email: "",
    // ... other fields
  },
});

// Handle submission
const onSubmit = async (values: z.infer<typeof formSchema>) => {
  try {
    // API call or state update
    // Show success message
  } catch (error) {
    // Handle error
  }
};
```