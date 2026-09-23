# BrainWaves Design System

This is the canonical guide for BrainWaves UI decisions. The component catalog in
Storybook shows the current implementation; reusable primitives live in
`src/renderer/components/ui/`, tokens in `src/renderer/tokens.css`, and Tailwind
maps its theme names to those tokens in `tailwind.config.js`.

## Principles

- Keep the interface lighthearted, clear, and approachable for students.
- Prefer airy layouts, readable type, and generous touch targets over dense UI.
- Use shared UI primitives for controls and Tailwind utilities for layout.
- Use named design tokens instead of repeating hex values or gradients.
- Reserve filled teal for the primary action on a surface.

## Color

### Brand

| Token          | Value     | Role                                                  |
| -------------- | --------- | ----------------------------------------------------- |
| `brand`        | `#007c70` | Primary actions, links, controls, and logo wordmark   |
| `brand-dark`   | `#00635a` | Primary-action hover                                  |
| `brand-light`  | `#e6f2f1` | Teal-tinted hover and emphasis backgrounds            |
| `accent`       | `#ffc107` | Active navigation, steppers, and illustration accents |
| `accent-light` | `#ffe69c` | Navigation hover                                      |

### Signal quality

| Token          | Value     | Role            |
| -------------- | --------- | --------------- |
| `signal-great` | `#66b0a9` | Strong signal   |
| `signal-ok`    | `#ffcd39` | Mediocre signal |
| `signal-bad`   | `#e06766` | Weak signal     |
| `signal-none`  | `#bfbfbf` | No signal       |

Signal colors communicate device state and must not be substituted with brand or
generic feedback colors.

### Text and surfaces

| Token or value       | Role                                            |
| -------------------- | ----------------------------------------------- |
| `ink` (`#1a1a1a`)    | Primary text and active navigation              |
| `ink-muted` (`#666`) | Secondary text and inactive navigation          |
| `ink-faint` (`#ccc`) | Disabled controls and inactive steppers         |
| `bg-app`             | Main-screen white-to-lavender background        |
| `white`              | Cards, rows, dialogs, and other raised surfaces |

Use Tailwind red only for destructive actions. Do not use signal colors for form
validation or application feedback.

## Typography

The application font stack is `Lato, "Helvetica Neue", sans-serif`.

- Page headings are large and light or normal weight.
- Section and card headings use `text-lg` or `text-2xl` according to hierarchy.
- Body copy uses the global 18px style.
- Buttons and navigation use `text-sm`; navigation labels are bold with
  `tracking-[0.5px]`.
- Badges and compact labels use `text-xs`.

Use semantic heading elements in document order. Do not choose a heading element
only for its default appearance.

## Spacing and shape

- Use Tailwind's 4px spacing scale.
- Keep main-screen gutters wide and content regions visually separated.
- Use `rounded-md` or `rounded-lg`; avoid pill shapes except for status indicators.
- Buttons use the shared 32px, 36px, and 40px sizes.
- Interactive controls need a clear focus state and a practical touch target.
- Row lists use separated white row-cards rather than dense, border-collapsed tables.

## Components

Use the primitives in `src/renderer/components/ui/` before creating a new control:
Button, Card, Dialog, DropdownMenu, Select, Badge, Table, and Spinner.

### Buttons

| Variant         | Use                                             |
| --------------- | ----------------------------------------------- |
| `default`       | The single primary action on a surface          |
| `outline-brand` | Branded secondary actions                       |
| `secondary`     | Neutral secondary actions                       |
| `outline`       | Low-emphasis neutral actions                    |
| `ghost`         | Compact or toolbar actions                      |
| `destructive`   | Actions that delete or irreversibly change data |
| `link`          | Navigation presented inline with text           |

Use the component variant API instead of reproducing button classes at call sites.
Use direct Tailwind classes for layout and one-off composition around primitives.

### Navigation

- Primary workflow navigation is always ordered: Review Design → Collect → Clean →
  Analyze.
- Active and visited primary steps use a 4px gold underline.
- Secondary navigation uses the same underline for the active tab.
- Inactive items use muted ink; hover uses `accent-light`.

### Domain components

- Experiment cards pair a flat illustration with a title and concise description.
- Signal-quality displays always include the Strong / Mediocre / Weak / No signal
  legend.
- EEG viewers keep channel labels visible and use the signal palette consistently.
- Form labels sit above their controls; error text is associated with the relevant
  field.

## Layout

- Main screens use `bg-app` and one clear content region.
- Home screens use the logo and horizontal navigation.
- Experiment screens keep workflow navigation visible.
- Prefer a single centered column for forms, two columns for experiment cards, and a
  clear diagram/data split for collection views.
- Preserve whitespace around headings and primary actions; do not fill space with
  decorative chrome.

## Illustration

- Use flat, two-tone gold shapes with thin black line accents.
- Avoid gradients and shadows inside illustrations.
- Keep illustrations decorative; do not rely on them to convey required information.
- Provide appropriate alternative text, or empty alternative text when an image is
  purely decorative.

## Empty, loading, and error states

- Empty states explain the next action rather than leaving a blank panel.
- Use the shared `Spinner` for indeterminate loading.
- Use toasts for transient application errors and inline text for field errors.
- Use the `destructive` button variant for destructive actions.
- Never communicate state through color alone.

## Maintaining the system

- Add or change tokens in `src/renderer/tokens.css`; avoid new arbitrary color values.
- Update the relevant Storybook story when a shared primitive or variant changes.
- Keep app-specific components composed from shared primitives where practical.
- Check keyboard navigation, focus visibility, contrast, and readable labels for every
  interactive component.
