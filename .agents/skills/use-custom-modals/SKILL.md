---
name: use-custom-modals
description: Enforce the use of a custom generic modal component instead of native alert(), confirm(), or prompt() for showing modals.
user-invocable: false
---

# Use Custom Modals

When showing notifications, warnings, confirmations, or taking input from the user via a modal dialog, you **MUST NOT** use the native browser `alert()`, `confirm()`, or `prompt()` functions.

Instead, you must use a custom and generic modal component from the codebase.

## Rules
1. **Never use `alert()`, `confirm()`, or `prompt()`**: These native browser methods break the application's visual consistency and provide a poor user experience.
2. **Use a generic Modal component**: Search the codebase (e.g. `src/components/ui/` or `src/components/`) for an existing generic Modal or Dialog component. If it exists, use it.
3. **Create one if it doesn't exist**: If a generic modal component does not exist in the codebase, you must create one first. This component should be reusable, styled consistently with the rest of the application, and capable of handling various content types (text, forms, actions).

## Implementation Guidelines
When replacing an `alert()`, look for ways to integrate a React state-driven modal component. 

```tsx
// ❌ BAD: Native alert breaks UX and UI consistency
alert('Your order has been saved successfully!');

// ✅ GOOD: Use the custom modal component
import { GenericModal } from '@/components/ui/GenericModal';

// ... inside your component
const [isModalOpen, setIsModalOpen] = useState(false);

<GenericModal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)}
  title="Success"
>
  <p>Your order has been saved successfully!</p>
</GenericModal>
```
