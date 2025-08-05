name: "Tenant Meta UI Implementation PRP"
description: |

## Purpose

Frontend implementation of tenant metadata UI components with comprehensive form handling, tooltip displays, verification badges, and testing for the multi-tenant chabod church management system.

## Core Principles

1. **UX First**: Clean, intuitive interface for church administrative information
2. **Form-Driven**: React Hook Form + Zod validation following established patterns
3. **Accessible**: Tooltips, badges, and proper ARIA labels
4. **Test-Driven**: Comprehensive UI test coverage following existing patterns
5. **I18n Ready**: Full internationalization support for English/Chinese

---

## Goal

Add tenant metadata UI components to display and edit church administrative information with proper tooltips, verification badges, form validation, and comprehensive testing.

## Why

- **User Experience**: Churches need to view and edit administrative information (tax ID, contact details, verification status)
- **Information Architecture**: Metadata contains many fields - need tooltip to avoid cluttering the card
- **Trust Indicators**: Verification badge provides credibility signal
- **Data Integrity**: Form validation ensures quality administrative data
- **Maintainability**: Following established patterns ensures consistency

## What

Frontend implementation of tenant metadata UI with:

- Enhanced TenantCard with church info tooltip and verification badge
- Extended TenantForm with all metadata fields (tax_id, contact_email, address, website, phone_number)
- Proper form validation with meaningful error messages
- Verification badge display with appropriate styling
- Comprehensive UI testing coverage
- Complete internationalization support

### Success Criteria

- [ ] TenantCard displays church info in tooltip accessible via info icon
- [ ] TenantCard shows verification status as badge when verified
- [ ] TenantForm includes all metadata fields with validation
- [ ] TenantUpdateDialog properly handles metadata fields
- [ ] TenantCreateDialog properly handles metadata fields
- [ ] All forms follow React Hook Form + Zod patterns
- [ ] UI tests pass (`npm run test:ui`)
- [ ] Translation keys added for all new UI text

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: /Users/schwanndenkuo/Documents/personal/chabod/CLAUDE.md
  why: Development guidelines, testing commands, UI/form patterns

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/components/Tenants/TenantCard.tsx
  why: Current tenant card implementation, needs metadata display with tooltip

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/components/Tenants/TenantForm.tsx
  why: Current form structure, needs metadata fields added

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/components/Tenants/TenantUpdateDialog.tsx
  why: Update dialog implementation, needs metadata field handling

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/lib/types.ts
  why: TenantMeta and TenantWithMeta types already defined

- file: /Users/schwanndenkuo/Documents/personal/chabod/tests/ui/components/Tenants/TenantCard.test.tsx
  why: Testing patterns for TenantCard, need to extend for metadata

- file: /Users/schwanndenkuo/Documents/personal/chabod/public/locales/en/tenant.json
  why: Translation patterns, need to add metadata-related keys

- file: /Users/schwanndenkuo/Documents/personal/chabod/supabase/migrations/20250805115427_tenant_meta.sql
  why: Backend schema reference for field types and constraints
```

### Current Codebase Structure

```bash
chabod/
├── src/
│   ├── components/Tenants/
│   │   ├── TenantCard.tsx          # Needs metadata tooltip + badge
│   │   ├── TenantForm.tsx          # Needs metadata fields + validation
│   │   └── TenantUpdateDialog.tsx  # Needs metadata handling
│   ├── lib/
│   │   └── types.ts               # TenantMeta types already defined
│   └── pages/
│       └── DashboardPage.tsx      # Uses TenantCard components
├── tests/ui/components/Tenants/
│   └── TenantCard.test.tsx        # Needs metadata testing
├── public/locales/
│   ├── en/tenant.json            # Needs metadata translation keys
│   └── zh-TW/tenant.json         # Needs metadata translation keys
└── supabase/migrations/
    └── 20250805115427_tenant_meta.sql  # Backend schema reference
```

### Desired Codebase Changes

```bash
# Modified Files
src/components/Tenants/TenantCard.tsx         # Add metadata tooltip + verification badge
src/components/Tenants/TenantForm.tsx         # Add metadata fields + validation
src/components/Tenants/TenantUpdateDialog.tsx # Handle metadata in form submission
src/components/Tenants/TenantCreateDialog.tsx # Handle metadata in form submission (if needed)

# Extended Files
tests/ui/components/Tenants/TenantCard.test.tsx # Add metadata display tests
public/locales/en/tenant.json                   # Add metadata translation keys
public/locales/zh-TW/tenant.json                # Add metadata translation keys

# Potentially New Files (if needed)
tests/ui/components/Tenants/TenantForm.test.tsx # New test file if complex validation testing needed
```

### Known Gotchas & Critical Patterns

```typescript
// CRITICAL: Use existing TenantWithMeta type for proper typing
// Pattern: Already defined in src/lib/types.ts
type TenantWithMeta = Tenant & {
  tenant_meta?: TenantMeta;
};

// CRITICAL: Follow React Hook Form + Zod validation pattern
// Pattern: From existing TenantForm.tsx structure
const formSchema = z.object({
  // existing fields...
  tax_id: z.string().optional(),
  contact_email: z.string().email("Invalid email format").min(1, "Contact email is required"),
  address: z.string().min(1, "Address is required"),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone_number: z.string().optional(),
});

// CRITICAL: Tooltip pattern using shadcn/ui components
// Pattern: From existing TenantCard.tsx Info icon usage
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Info className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      {/* Metadata display content */}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

// CRITICAL: Badge pattern for verification status
// Pattern: Using shadcn/ui Badge component
{tenant.tenant_meta?.verified && (
  <Badge variant="success">
    {t("tenant:verified")}
  </Badge>
)}

// CRITICAL: I18n pattern following existing tenant.json structure
// Pattern: Keys should be descriptive and namespace-specific
{
  "churchInfo": "Church Information",
  "verified": "Verified",
  "taxId": "Tax ID",
  "contactEmail": "Contact Email",
  "address": "Address",
  "website": "Website",
  "phoneNumber": "Phone Number"
}
```

## Implementation Blueprint

### UI Enhancement Overview

```typescript
// Current TenantCard structure needs:
1. Church info tooltip (tax_id, contact_email, address, website, phone_number)
2. Verification badge display when verified === true
3. Enhanced typing to support TenantWithMeta

// Current TenantForm structure needs:
1. Additional form fields for all metadata
2. Zod schema extension with proper validation
3. Form submission handling for metadata fields

// Current TenantUpdateDialog structure needs:
1. Extended form data interface to include metadata
2. Form submission to update metadata fields
3. Proper error handling for metadata updates
```

### Task List (Implementation Order)

```yaml
Task 1 - Extend TenantForm with Metadata Fields:
  MODIFY src/components/Tenants/TenantForm.tsx:
    - EXTEND TenantFormData interface with metadata fields
    - ADD Zod schema validation for metadata fields
    - ADD form fields UI for tax_id, contact_email, address, website, phone_number
    - PRESERVE existing name/slug functionality and patterns
    - FOLLOW existing form field styling and error handling

Task 2 - Update TenantUpdateDialog for Metadata:
  MODIFY src/components/Tenants/TenantUpdateDialog.tsx:
    - EXTEND form submission to handle metadata fields
    - UPDATE service call to include metadata in tenant updates
    - PRESERVE existing error handling and success patterns
    - ENSURE proper typing with TenantWithMeta

Task 3 - Enhance TenantCard with Metadata Display:
  MODIFY src/components/Tenants/TenantCard.tsx:
    - ADD church info tooltip with Info icon
    - ADD verification badge when tenant.tenant_meta?.verified === true
    - IMPORT and use Tooltip, TooltipProvider, Badge components
    - PRESERVE existing card layout and functionality
    - FOLLOW existing Info icon pattern from subscription section

Task 4 - Add Translation Keys:
  MODIFY public/locales/en/tenant.json and public/locales/zh-TW/tenant.json:
    - ADD metadata field labels (churchInfo, verified, taxId, contactEmail, address, website, phoneNumber)
    - ADD form validation error messages
    - ADD tooltip content descriptions
    - PRESERVE existing translation structure and patterns

Task 5 - Create Comprehensive UI Tests:
  MODIFY tests/ui/components/Tenants/TenantCard.test.tsx:
    - ADD tests for metadata tooltip display and interaction
    - ADD tests for verification badge rendering
    - ADD tests for accessibility of new components
    - PRESERVE existing test structure and patterns
    - USE existing testing utilities and mocking patterns

Task 6 - Validate Integration:
  RUN npm run test:ui:
    - VERIFY all new tests pass
    - VERIFY existing tests still pass
    - VERIFY no regressions in tenant management functionality
```

### Detailed Implementation Patterns

#### Task 1: TenantForm Metadata Extension

```typescript
// Extended interface pattern
export interface TenantFormData {
  name: string;
  slug: string;
  // New metadata fields
  tax_id?: string;
  contact_email: string;
  address: string;
  website?: string;
  phone_number?: string;
}

// Zod schema extension pattern
const formSchema = z.object({
  name: z.string().min(1, t("tenant:nameRequired")),
  slug: z.string().min(1, t("tenant:slugRequired")).regex(/^[a-z0-9-]+$/, t("tenant:slugPattern")),
  tax_id: z.string().optional(),
  contact_email: z.string().email(t("tenant:invalidEmail")).min(1, t("tenant:contactEmailRequired")),
  address: z.string().min(1, t("tenant:addressRequired")),
  website: z.string().url(t("tenant:invalidWebsite")).optional().or(z.literal("")),
  phone_number: z.string().optional(),
});

// Form fields pattern - follow existing Input + Label structure
<div className="space-y-2">
  <Label htmlFor="contact_email">{t("tenant:contactEmail")}</Label>
  <Input
    id="contact_email"
    type="email"
    value={contactEmail}
    onChange={setContactEmail}
    placeholder={t("tenant:contactEmailPlaceholder")}
    required
  />
  {errors.contact_email && <p className="text-sm text-destructive">{errors.contact_email}</p>}
</div>
```

#### Task 2: TenantUpdateDialog Metadata Handling

```typescript
// Service call extension - need to check existing updateTenant service
const handleSubmit = async (formData: TenantFormData) => {
  setIsUpdating(true);
  try {
    // Separate tenant basic info from metadata
    const tenantData = { name: formData.name, slug: formData.slug };
    const metadataData = {
      tax_id: formData.tax_id,
      contact_email: formData.contact_email,
      address: formData.address,
      website: formData.website,
      phone_number: formData.phone_number,
    };

    // Update both tenant and metadata - need to check existing service pattern
    await updateTenantWithMetadata(tenant.id, tenantData, metadataData);

    toast({
      title: t("tenant:updated"),
      description: t("tenant:updatedSuccess", { name: formData.name }),
    });
    onTenantUpdated();
    onClose();
  } catch (error) {
    // Error handling follows existing pattern
  } finally {
    setIsUpdating(false);
  }
};
```

#### Task 3: TenantCard Metadata Display

```typescript
// Tooltip display pattern
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

// Church info tooltip component
const ChurchInfoTooltip = ({ tenantMeta }: { tenantMeta?: TenantMeta }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
          <Info className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1">
          {tenantMeta?.tax_id && <p><strong>{t("tenant:taxId")}:</strong> {tenantMeta.tax_id}</p>}
          <p><strong>{t("tenant:contactEmail")}:</strong> {tenantMeta?.contact_email || t("tenant:notSet")}</p>
          <p><strong>{t("tenant:address")}:</strong> {tenantMeta?.address || t("tenant:notSet")}</p>
          {tenantMeta?.website && <p><strong>{t("tenant:website")}:</strong> {tenantMeta.website}</p>}
          {tenantMeta?.phone_number && <p><strong>{t("tenant:phoneNumber")}:</strong> {tenantMeta.phone_number}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Verification badge pattern - add to CardHeader alongside tenant name
<CardTitle className="flex justify-between items-center">
  <div className="flex items-center gap-2">
    {tenant.name}
    {tenant.tenant_meta?.verified && (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        {t("tenant:verified")}
      </Badge>
    )}
  </div>
  {/* Existing action buttons */}
</CardTitle>

// Church info section - add after login URL section
<div className="mt-4 pt-2 border-t">
  <div className="flex items-center justify-between">
    <p className="text-sm font-medium">{t("tenant:churchInfo")}:</p>
    <ChurchInfoTooltip tenantMeta={tenant.tenant_meta} />
  </div>
</div>
```

### Service Layer Updates

```typescript
// Need to check if tenant service supports metadata updates
// Pattern: Likely need to extend updateTenant function or create new updateTenantWithMetadata

// In src/lib/tenant-service.ts or similar:
export const updateTenantWithMetadata = async (
  tenantId: string,
  tenantData: { name: string; slug: string },
  metadataData: Partial<TenantMeta>,
) => {
  // Update tenant basic info
  await updateTenant(tenantId, tenantData.name, tenantData.slug);

  // Update tenant metadata
  const { error } = await supabase
    .from("tenant_meta")
    .update(metadataData)
    .eq("tenant_id", tenantId);

  if (error) throw error;
};
```

### Translation Keys Requirements

```json
// English (public/locales/en/tenant.json)
{
  // Existing keys...
  "churchInfo": "Church Information",
  "verified": "Verified",
  "taxId": "Tax ID",
  "contactEmail": "Contact Email",
  "address": "Address",
  "website": "Website",
  "phoneNumber": "Phone Number",
  "notSet": "Not set",
  "nameRequired": "Church name is required",
  "slugRequired": "Slug is required",
  "slugPattern": "Slug can only contain lowercase letters, numbers and hyphens",
  "contactEmailRequired": "Contact email is required",
  "addressRequired": "Address is required",
  "invalidEmail": "Invalid email format",
  "invalidWebsite": "Invalid website URL",
  "contactEmailPlaceholder": "church@example.com",
  "addressPlaceholder": "123 Church Street, City, State",
  "websitePlaceholder": "https://church.com",
  "phoneNumberPlaceholder": "+1-555-0123",
  "updated": "Tenant updated",
  "updatedSuccess": "{{name}} has been updated successfully."
}

// Chinese (public/locales/zh-TW/tenant.json)
{
  // Existing keys...
  "churchInfo": "教會資訊",
  "verified": "已驗證",
  "taxId": "統一編號",
  "contactEmail": "聯絡電子郵件",
  "address": "地址",
  "website": "網站",
  "phoneNumber": "電話號碼",
  "notSet": "未設定",
  "nameRequired": "教會名稱不能為空",
  "slugRequired": "Slug 不能為空",
  "slugPattern": "Slug 只能包含小寫字母、數字和連字號",
  "contactEmailRequired": "聯絡電子郵件不能為空",
  "addressRequired": "地址不能為空",
  "invalidEmail": "無效的電子郵件格式",
  "invalidWebsite": "無效的網站 URL",
  "contactEmailPlaceholder": "church@example.com",
  "addressPlaceholder": "教會街123號，城市，州",
  "websitePlaceholder": "https://church.com",
  "phoneNumberPlaceholder": "+1-555-0123",
  "updated": "教會已更新",
  "updatedSuccess": "{{name}} 已成功更新。"
}
```

### Testing Implementation Pattern

```typescript
// Extended TenantCard test pattern
describe("Tenant Metadata Display", () => {
  it("should display church info tooltip with metadata", async () => {
    const user = userEvent.setup();
    const tenantWithMeta = {
      ...mockTenantWithUsage,
      tenant_meta: {
        tax_id: "12345678",
        contact_email: "admin@church.com",
        address: "123 Church St",
        website: "https://church.com",
        phone_number: "+1-555-0123",
        verified: false,
      },
    };

    render(<TenantCard tenant={tenantWithMeta} {...mockCallbacks} />);

    // Find and click info icon
    const infoIcon = screen.getByRole("button", { name: /info/i });
    await user.hover(infoIcon);

    // Verify tooltip content appears
    await waitFor(() => {
      expect(screen.getByText("admin@church.com")).toBeInTheDocument();
      expect(screen.getByText("123 Church St")).toBeInTheDocument();
      expect(screen.getByText("https://church.com")).toBeInTheDocument();
    });
  });

  it("should display verification badge when tenant is verified", () => {
    const verifiedTenant = {
      ...mockTenantWithUsage,
      tenant_meta: {
        verified: true,
        contact_email: "admin@church.com",
        address: "123 Church St",
      },
    };

    render(<TenantCard tenant={verifiedTenant} {...mockCallbacks} />);

    expect(screen.getByText("tenant:verified")).toBeInTheDocument();
  });

  it("should not display verification badge when tenant is not verified", () => {
    const unverifiedTenant = {
      ...mockTenantWithUsage,
      tenant_meta: {
        verified: false,
        contact_email: "admin@church.com",
        address: "123 Church St",
      },
    };

    render(<TenantCard tenant={unverifiedTenant} {...mockCallbacks} />);

    expect(screen.queryByText("tenant:verified")).not.toBeInTheDocument();
  });
});
```

### Integration Points

```yaml
COMPONENTS:
  - tenant_card: "Enhanced with metadata tooltip and verification badge"
  - tenant_form: "Extended with metadata fields and validation"
  - tenant_dialogs: "Updated to handle metadata in create/update operations"

SERVICES:
  - tenant_service: "May need updateTenantWithMetadata function"
  - form_validation: "Zod schemas extended for metadata fields"

TESTING:
  - ui_tests: "Comprehensive coverage for metadata display and form handling"
  - command: "npm run test:ui should pass all tests"

TRANSLATIONS:
  - i18n_keys: "Metadata labels, validation messages, tooltip content"
  - namespaces: "Extended tenant.json for both English and Chinese"

TYPES:
  - existing_types: "TenantWithMeta already defined, use in component props"
  - form_interfaces: "Extended TenantFormData with metadata fields"
```

## Validation Loop

### Level 1: Component Rendering

```bash
# Start development server and check components
npm run dev

# Expected: TenantCard displays tooltip and badge correctly
# Expected: TenantForm shows metadata fields with validation
# If issues: Check component imports, translation keys, type definitions
```

### Level 2: Form Functionality

```bash
# Test form submission and validation
# Create/update tenant with metadata fields

# Expected: Forms validate properly and submit metadata
# Expected: Success messages show, data persists
# If issues: Check form validation schema, service layer integration
```

### Level 3: UI Testing

```bash
# Run UI tests specifically for tenant components
npm run test:ui -- TenantCard.test.tsx

# Expected: All metadata display and interaction tests pass
# If failing: Check test setup, mocking, and component behavior
```

### Level 4: Full Integration

```bash
# Run all UI tests to ensure no regressions
npm run test:ui

# Expected: All existing and new tests pass
# If failing: Check for component conflicts, missing dependencies
```

## Final Validation Checklist

- [ ] TenantCard displays church info tooltip correctly
- [ ] TenantCard shows verification badge when appropriate
- [ ] TenantForm includes all metadata fields with proper validation
- [ ] Create/Update dialogs handle metadata correctly
- [ ] Translation keys added for all new UI text (English + Chinese)
- [ ] Form validation provides meaningful error messages
- [ ] UI tests cover metadata display and form functionality: `npm run test:ui`
- [ ] No regressions in existing tenant management functionality
- [ ] Accessibility: tooltip and badge have proper ARIA labels
- [ ] Components follow existing shadcn/ui and styling patterns

---

## Anti-Patterns to Avoid

- ❌ Don't add metadata fields directly to tenant table - use tenant_meta relation
- ❌ Don't skip form validation - all fields need proper Zod validation
- ❌ Don't hardcode text - use translation keys for all user-facing text
- ❌ Don't break existing TenantCard layout - integrate tooltip/badge seamlessly
- ❌ Don't skip accessibility - tooltips and badges need proper ARIA support
- ❌ Don't ignore existing patterns - follow TenantForm structure for consistency
- ❌ Don't skip test coverage - comprehensive UI tests are required
- ❌ Don't forget Chinese translations - all keys need both languages

## Confidence Score: 9/10

This PRP provides comprehensive context with detailed implementation patterns, follows all established codebase conventions, includes complete testing strategy, and addresses all requirements from the spec. The only minor uncertainty is the exact service layer integration for metadata updates, but patterns are clearly established for investigation and implementation.
