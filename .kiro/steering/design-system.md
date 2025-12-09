---
inclusion: always
---

# NotePadC Design System Rules

This document defines the design system patterns for integrating Figma designs with the NotePadC codebase.

## Design Tokens

All design tokens are defined as CSS custom properties in `src/styles/global.css`.

### Color Tokens

```css
/* Primary Colors */
--bg-main: #0D0D0D;           /* Main background */
--bg-activity-bar: #181818;   /* Activity bar background */
--bg-sidebar: #252542;        /* Sidebar background */
--bg-editor: #1A1A2E;         /* Editor background */
--bg-terminal: #1A1A2E;       /* Terminal background */
--bg-hover: #2D2D4A;          /* Hover state */
--bg-selected: #094771;       /* Selected state */
--accent: #007ACC;            /* Primary accent (blue) */
--text-primary: #E1E1E1;      /* Primary text */
--text-secondary: #6E6E6E;    /* Secondary/muted text */
```

### Spacing & Layout Tokens

```css
/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;

/* Gaps */
--gap-section: 8px;
--gap-item: 4px;

/* Layout Dimensions */
--titlebar-height: 30px;
--activitybar-width: 48px;
--sidebar-min-width: 200px;
--sidebar-max-width: 400px;
--sidebar-default-width: 240px;
--tabbar-height: 36px;
--breadcrumb-height: 22px;
--panel-min-width: 280px;
--panel-default-width: 320px;
--statusbar-height: 24px;
--panel-header-height: 40px;
```

### Typography Tokens

```css
--font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-family-mono: 'SF Mono', Monaco, 'Courier New', monospace;
--font-size-base: 13px;
--font-size-small: 11px;
--font-size-tiny: 10px;
--line-height: 1.4;
```

### Animation Tokens

```css
--transition-fast: 100ms ease;
--transition-normal: 150ms ease;
--transition-slow: 200ms ease;
```

## Component Architecture

Components follow a modular structure with co-located styles:

```
src/components/
├── ComponentName/
│   ├── ComponentName.tsx    # Component logic (React functional component)
│   ├── ComponentName.css    # Component-specific styles
│   └── index.ts             # Re-export: export { ComponentName } from './ComponentName'
```

### Key UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `TitleBar` | Window title bar | `src/components/TitleBar/` |
| `ActivityBar` | Left icon bar for view switching | `src/components/ActivityBar/` |
| `Sidebar` | File explorer / problems panel | `src/components/Sidebar/` |
| `TabBar` | Multi-tab file management | `src/components/TabBar/` |
| `Breadcrumb` | File path breadcrumb | `src/components/Breadcrumb/` |
| `CodeEditor` | Monaco editor wrapper | `src/components/CodeEditor/` |
| `Panel` | Bottom panel container | `src/components/Panel/` |
| `Terminal` | Output/terminal display | `src/components/Terminal/` |
| `StatusBar` | Bottom status bar | `src/components/StatusBar/` |

## Styling Approach

### CSS Methodology

- **Plain CSS** with CSS custom properties (no CSS-in-JS or preprocessors)
- **BEM-like naming**: `.component-name`, `.component-name__element`, `.component-name--modifier`
- **kebab-case** for all CSS class names

### Global Styles

Located in `src/styles/global.css`:
- CSS reset
- Design token definitions
- Scrollbar styling
- Base element styles (button, input)
- Utility classes

### Utility Classes

```css
.ellipsis      /* Text truncation with ellipsis */
.flex-center   /* Flexbox center alignment */
.flex-between  /* Flexbox space-between */
```

## Figma Integration Guidelines

### When Converting Figma Designs

1. **Use existing tokens** - Map Figma colors/spacing to CSS custom properties
2. **Follow component structure** - Create new components in `src/components/ComponentName/`
3. **Use semantic color variables** - Prefer `--bg-editor` over hardcoded hex values
4. **Match existing patterns** - Follow the established component architecture

### Color Mapping

| Figma Token | CSS Variable |
|-------------|--------------|
| Background/Main | `var(--bg-main)` |
| Background/Editor | `var(--bg-editor)` |
| Background/Sidebar | `var(--bg-sidebar)` |
| Background/Hover | `var(--bg-hover)` |
| Background/Selected | `var(--bg-selected)` |
| Text/Primary | `var(--text-primary)` |
| Text/Secondary | `var(--text-secondary)` |
| Accent/Blue | `var(--accent)` |

### Spacing Guidelines

- Use `var(--gap-section)` (8px) between major sections
- Use `var(--gap-item)` (4px) between related items
- Use `var(--radius-sm)` (4px) for small elements
- Use `var(--radius-md)` (8px) for medium containers

## State Management

Uses **Zustand** store at `src/store/editorStore.ts`:

```typescript
import { useEditorStore } from './store/editorStore'

// In component
const { tabs, activeTabId, isDarkMode } = useEditorStore()
```

## Framework & Build

- **React 18** with functional components and hooks
- **TypeScript 5.3** with strict mode
- **Vite 5** for development and building
- **Electron 28** for desktop app wrapper

## Asset Management

- Icons: Use inline SVG or codicon font class `.codicon`
- Images: Place in `build/` directory for app icons
- No external CDN dependencies

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `CodeEditor.tsx` |
| CSS files | PascalCase (matching component) | `CodeEditor.css` |
| CSS classes | kebab-case | `.code-editor-container` |
| Utilities | camelCase | `compilerParser.ts` |
| State actions | camelCase verbs | `addTab`, `setCompiling` |
