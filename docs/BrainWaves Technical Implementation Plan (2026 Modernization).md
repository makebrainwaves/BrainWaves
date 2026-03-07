# BrainWaves: Technical Implementation Plan (2026 Modernization)

**Author:** Manus AI
**Date:** March 2026

This document outlines a step-by-step technical implementation plan for AI agents working on the BrainWaves codebase. The goal is to modernize the stack, resolve deployment blockers, and replace the UI library, while establishing a robust testing harness. 

*Note: The migration to Lab Streaming Layer (LSL) is explicitly excluded from this phase and will be addressed once the application is successfully building and deploying.*

---

## Phase 1: Test Harness & Build Environment Setup

Before modifying the application logic, we must establish a reliable testing harness using Vitest and ensure the Electron build pipeline is functional. The current codebase uses a legacy Jest configuration (`"test": "cross-env jest --passWithNoTests"`) which must be replaced.

### Step 1.1: Install and Configure Vitest
*   **Action:** Remove Jest dependencies and install Vitest, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom`.
*   **Action:** Create a `vitest.config.ts` file configured for a React/DOM environment.
*   **Action:** Update `package.json` scripts to use Vitest (`"test": "vitest run"`, `"test:watch": "vitest"`).
*   **Acceptance Criteria:** 
    *   A basic sanity test (`src/renderer/App.test.tsx`) rendering a simple component passes using `npm test`.
    *   The CI workflow (`.github/workflows/test.yml`) is updated to run `npm test` using Vitest.

### Step 1.2: Verify Electron Build Pipeline
*   **Action:** Run the existing `npm run build` and `npm run package-ci` commands to identify any immediate build failures caused by Node 22 or Vite 7.
*   **Action:** Fix any immediate compilation errors in `src/main/index.ts` or `vite.config.ts`.
*   **Acceptance Criteria:**
    *   `npm run build` completes without errors.
    *   An integration test (`tests/build.test.ts`) is added that programmatically verifies the existence of the `out/main/index.js` and `out/renderer/index.html` files after a build.

---

## Phase 2: Routing and State Synchronization Modernization

The codebase currently relies on `react-router-dom v5` and the abandoned `connected-react-router` (which syncs router state to Redux). This causes significant issues with modern React 18 and Redux Toolkit.

### Step 2.1: Remove `connected-react-router`
*   **Action:** Uninstall `connected-react-router`.
*   **Action:** Remove `routerMiddleware` and `connectRouter` from `src/renderer/store.ts` and `src/renderer/reducers/index.ts`.
*   **Action:** Remove `ConnectedRouter` from `src/renderer/containers/Root.tsx` and replace it with a standard `HashRouter` from `react-router-dom`.
*   **Acceptance Criteria:**
    *   The Redux store initializes successfully without the router reducer.
    *   Unit tests verify that the Redux store can be created with initial state (`tests/store.test.ts`).

### Step 2.2: Upgrade to React Router v6/v7
*   **Action:** Upgrade `react-router-dom` to the latest stable version.
*   **Action:** Refactor `src/renderer/routes.tsx` to use the new `<Routes>` and `<Route element={<Component />}>` syntax instead of the legacy `<Switch>` and `component={}` props.
*   **Action:** Refactor class components (e.g., `HomeComponent`, `DesignComponent`) that rely on `this.props.history.push`. Convert them to functional components using the `useNavigate` hook, or create a Higher-Order Component (HOC) `withRouter` wrapper if functional conversion is too extensive.
*   **Action:** Update `src/renderer/epics/experimentEpics.ts` which currently listens to `@@router/LOCATION_CHANGE`. Refactor the logic to trigger based on specific Redux actions rather than URL changes.
*   **Acceptance Criteria:**
    *   Unit tests (`tests/routing.test.tsx`) verify that navigation between the Home, Design, and Collect screens renders the correct components.

---

## Phase 3: Pyodide and Python Dependency Modernization

The application uses Pyodide `v0.21.0` (hardcoded in `internals/scripts/InstallPyodide.js`) and relies on deprecated Python libraries for data visualization.

### Step 3.1: Upgrade Pyodide
*   **Action:** Update `internals/scripts/InstallPyodide.js` to download a modern stable release of Pyodide (e.g., `v0.27.0`).
*   **Action:** Ensure the `vite.config.ts` `publicDir` setting still correctly serves the updated Pyodide WASM and JS files.
*   **Acceptance Criteria:**
    *   An integration test (`tests/pyodide.test.ts`) successfully instantiates the Pyodide web worker (`src/renderer/utils/pyodide/webworker.js`) and executes a simple `1 + 1` Python command.

### Step 3.2: Refactor Python Plotting Logic
*   **Action:** In `src/renderer/utils/pyodide/utils.py`, locate the usage of `sns.tsplot` (which was removed in Seaborn v0.10.0).
*   **Action:** Rewrite the `plot_conditions` function to use `sns.lineplot` or standard `matplotlib.pyplot.plot` with `fill_between` for confidence intervals.
*   **Acceptance Criteria:**
    *   A unit test (`tests/python_utils.test.ts`) loads `utils.py` into the Pyodide worker, passes mock EEG data, and verifies that the plotting function executes without throwing a Python `AttributeError`.

---

## Phase 4: UI Library Replacement (Semantic UI to Shadcn/ui)

`semantic-ui-react` is abandoned and throws deprecation warnings in React 18. We will replace it with Tailwind CSS and Shadcn/ui components.

### Step 4.1: Install Tailwind CSS and Shadcn/ui
*   **Action:** Install Tailwind CSS, PostCSS, and Autoprefixer. Configure `tailwind.config.js` and `postcss.config.js`.
*   **Action:** Initialize Shadcn/ui (`npx shadcn-ui@latest init`) and configure it to output components to `src/renderer/components/ui`.
*   **Acceptance Criteria:**
    *   A unit test verifies that a basic Shadcn/ui `Button` component renders correctly with Tailwind utility classes applied.

### Step 4.2: Component-by-Component Replacement
*   **Action:** Identify the ~26 files importing `semantic-ui-react`. The most heavily used components are `Segment`, `Button`, `Grid`, and `Header`.
*   **Action:** Replace `semantic-ui-react` components with their Shadcn/ui equivalents:
    *   `Button` -> Shadcn `Button`
    *   `Segment` -> Shadcn `Card` or a simple `div` with Tailwind borders/padding.
    *   `Grid` -> Tailwind CSS Grid (`grid grid-cols-12 gap-4`).
    *   `Header` -> Standard HTML `h1`-`h6` tags with Tailwind typography classes.
    *   `Modal` -> Shadcn `Dialog`.
*   **Action:** Remove `semantic-ui-css` from `src/renderer/index.tsx` and uninstall `semantic-ui-react`.
*   **Acceptance Criteria:**
    *   `grep -r "semantic-ui-react" src/` returns zero results.
    *   Visual regression or DOM snapshot tests (`tests/ui_migration.test.tsx`) for key screens (Home, Design, Collect) pass, ensuring the new components render without crashing.

---

## Phase 5: Final Build and Verification

### Step 5.1: End-to-End Build Verification
*   **Action:** Run the full build pipeline (`npm run package-all`).
*   **Acceptance Criteria:**
    *   The Electron application compiles and packages successfully for the target OS.
    *   All Vitest suites (Routing, Store, Pyodide, UI) pass with 100% success rate.
