---
name: testing-standards
description: Enforce consistent Vitest testing conventions. Every logic file, utility, or component must have associated tests.
user-invocable: false
---

# Testing Standards and Guidelines

In this codebase, **testing is mandatory**. No feature, component, utility, or logic code is considered complete or ready for production without accompanying tests. When creating or modifying code, you MUST create or update the corresponding test file and verify that the tests pass.

## Core Rules

1. **Mandatory Testing**: Every logic file, utility, helper, hook, or component must have an associated test file.
2. **File Placement & Naming**:
   - Test files must be placed in the same directory as the file under test (adjacent placement).
   - Test files must use the suffix `.test.ts` (for pure logic/utilities) or `.test.tsx` (for components and hooks utilizing JSX).
   - Example:
     - Component: `src/components/Button.tsx` -> Test: `src/components/Button.test.tsx`
     - Logic: `src/utils/calculations.ts` -> Test: `src/utils/calculations.test.ts`
3. **Command to Run Tests**:
   - Run tests using `npm run test` (which executes `vitest run`).
   - Run specific tests by appending the path, e.g., `npm run test src/utils/calculations.test.ts`.

---

## Standard Test File Structure

All test files must follow a consistent, hierarchical layout based on Vitest's `describe` and `it`/`test` blocks.

### The AAA Pattern
Every individual test case (`it` block) should structure its logic following the **Arrange-Act-Assert (AAA)** pattern:
- **Arrange**: Set up the test conditions, input arguments, and mock configurations.
- **Act**: Call the function or render the component under test.
- **Assert**: Verify that the output, side-effects, or rendered DOM matches the expected behavior.

### Hierarchy Layout

1. **Imports**: Import dependencies, the code under test, and Vitest globals explicitly.
2. **Mocking (Optional)**: Declare `vi.mock` declarations immediately below imports.
3. **Fixtures & Mock Data (Optional)**: Define clean, reusable mock state or factory functions.
4. **Root Describe Block**: Define a root `describe('module_or_component_name', () => { ... })` block.
5. **Inner Describe Blocks**: Nest a `describe('functionOrFeatureName', () => { ... })` block for each major exported function, method, or distinct state of the module/component.
6. **Individual Tests**: Write descriptive `it('should [expected outcome] when [given conditions]', () => { ... })` blocks inside.

---

## Code Templates

### 1. Pure Logic & Utilities Template (`.test.ts`)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateDiscount } from './pricing'

// 1. Fixtures / Helpers
const mockUser = { id: 'user-1', tier: 'premium' }

describe('pricing utilities', () => {
  
  describe('calculateDiscount', () => {
    
    it('should apply 20% discount for premium tier users', () => {
      // Arrange
      const price = 100
      const expectedPrice = 80
      
      // Act
      const result = calculateDiscount(price, mockUser)
      
      // Assert
      expect(result).toBe(expectedPrice)
    })
    
    it('should apply 0% discount for standard tier users', () => {
      // Arrange
      const price = 100
      const standardUser = { ...mockUser, tier: 'standard' }
      
      // Act
      const result = calculateDiscount(price, standardUser)
      
      // Assert
      expect(result).toBe(100)
    })
    
    it('should throw an error if the base price is negative', () => {
      // Arrange
      const price = -50
      
      // Act & Assert
      expect(() => calculateDiscount(price, mockUser)).toThrowError(
        'Price cannot be negative'
      )
    })
  })
})
```

### 2. React Components Template (`.test.tsx`)

For rendering and interacting with React components, use `@testing-library/react`.

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActionButton } from './ActionButton'

describe('ActionButton component', () => {
  
  it('should render the button with the correct label', () => {
    // Arrange
    const label = 'Submit Order'
    
    // Act
    render(<ActionButton label={label} onClick={() => {}} />)
    
    // Assert
    const button = screen.getByRole('button', { name: label })
    expect(button).toBeInTheDocument()
  })

  it('should trigger onClick handler when clicked', () => {
    // Arrange
    const onClickMock = vi.fn()
    render(<ActionButton label="Click Me" onClick={onClickMock} />)
    const button = screen.getByRole('button', { name: /click me/i })
    
    // Act
    fireEvent.click(button)
    
    // Assert
    expect(onClickMock).toHaveBeenCalledTimes(1)
  })
})
```

---

## Guidelines for Mocking

To prevent tests from executing real database queries or external API requests, mock dependencies using Vitest's mocking tools:

### 1. Mocking Supabase
Do not call real Supabase functions. Mock the Supabase client or routing modules:

```typescript
import { vi } from 'vitest'

// Mock the whole client
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))
```

### 2. Mocking Global Fetch API
When testing functions that hit external REST APIs, mock the global fetch:

```typescript
import { vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ success: true, data: 'test-data' }),
    ok: true,
  }))
})
```

### 3. Mocking Next.js Navigation
Mock Next.js hooks like `useRouter`, `usePathname`, and `useSearchParams`:

```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams('tab=active'),
}))
```

---

## Pre-Verification Checklist

Before submitting code, you must execute the following checklist:
- [ ] Ensure every new logic/component file has a `.test.ts` or `.test.tsx` file.
- [ ] If existing logic was modified, check if corresponding test coverage needs updates.
- [ ] Run `npm run test` and verify that all tests pass without errors or warnings.
- [ ] Confirm tests don't leave lingering timers, open handles, or side-effects. Use `beforeEach`/`afterEach` to reset mocks (`vi.clearAllMocks()`).
