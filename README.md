# design-tokens

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

A design system token manager that parses, transforms, validates, and documents design tokens across multiple platforms.

## Features

- **Multi-format Parsing** - JSON and YAML token files with nested groups and references
- **7 Platform Outputs** - CSS custom properties, SCSS, JS/TS modules, Tailwind config, iOS Swift, Android XML, flat JSON
- **Reference Resolution** - `$ref.color.primary` references with circular dependency detection
- **Validation** - Type checking, naming conventions (kebab-case), WCAG contrast ratio checks
- **Diffing** - Compare token sets with breaking change detection
- **Documentation** - Auto-generated markdown with color swatches, spacing scales, typography specimens

## Installation

```bash
npm install -g design-tokens
```

## Token Format

Tokens are defined in JSON files with `value`, `type`, and optional `description`:

```json
{
  "primary": {
    "500": {
      "value": "#6366F1",
      "type": "color",
      "description": "Primary brand color"
    }
  },
  "spacing": {
    "sm": {
      "value": 8,
      "type": "spacing",
      "description": "Small spacing"
    }
  }
}
```

### References

Tokens can reference other tokens:

```json
{
  "button-bg": {
    "value": "#6366F1",
    "type": "color",
    "$ref": "$ref.primary.500"
  }
}
```

### Supported Token Types

| Type | Example Values |
|------|---------------|
| `color` | `#6366F1`, `rgb(99, 102, 241)`, `hsl(239, 84%, 67%)` |
| `spacing` | `8`, `16px`, `1.5rem` |
| `typography` | Font families, sizes, weights, line heights |
| `shadow` | Box shadow values |
| `border` | Border shorthand values |
| `opacity` | `0` to `1` |
| `motion` | Duration and easing values |

## Platform Outputs

### CSS Custom Properties

```css
:root {
  --color-primary-500: #6366F1;
  --spacing-sm: 8px;
}
```

### SCSS Variables

```scss
$color-primary-500: #6366F1; // Primary brand color
$spacing-sm: 8px; // Small spacing
```

### TypeScript Module

```typescript
export interface DesignTokens {
  colorPrimary500: string;
  spacingSm: number;
}

export const tokens: DesignTokens = {
  colorPrimary500: '#6366F1',
  spacingSm: 8,
};
```

### Tailwind Config

```javascript
module.exports = {
  theme: {
    extend: {
      colors: { 'primary-500': '#6366F1' },
      spacing: { sm: '8px' },
    },
  },
};
```

### iOS Swift

```swift
struct DesignTokens {
  static let colorPrimary500 = Color(hex: 0x6366F1)
  static let spacingSm: CGFloat = 8
}
```

### Android XML

```xml
<resources>
  <color name="color_primary_500">#6366F1</color>
  <dimen name="spacing_sm">8dp</dimen>
</resources>
```

## CLI Reference

| Command | Description |
|---------|-------------|
| `design-tokens build` | Build tokens for target platforms |
| `design-tokens validate` | Validate token files |
| `design-tokens diff` | Compare two token sets |
| `design-tokens docs` | Generate documentation |

### Build Options

```bash
# Build CSS and SCSS
design-tokens build -i ./tokens -o ./output -p css scss

# Build all platforms
design-tokens build -i ./tokens -o ./output -p css scss js ts tailwind ios-swift android-xml

# Validate with strict mode
design-tokens validate -i ./tokens --strict

# Diff two versions
design-tokens diff -a ./tokens-v1 -b ./tokens-v2

# Generate docs
design-tokens docs -i ./tokens -o tokens.md
```

## Validation Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `naming-convention` | Error | Token names must be kebab-case |
| `type-value-match` | Error | Value must match declared type |
| `no-orphan-references` | Error | Referenced tokens must exist |
| `require-description` | Warning | Tokens should have descriptions |
| `contrast-ratio` | Warning | Color pairs should meet WCAG AA (4.5:1) |

## License

MIT

---

## Français

**design-tokens** est un gestionnaire de tokens de design qui analyse, transforme, valide et documente les tokens à travers plusieurs plateformes. Il prend en charge les fichiers JSON et YAML, résout les références entre tokens, et génère des sorties pour 7 plateformes cibles : CSS, SCSS, JS/TS, Tailwind, iOS Swift, Android XML et JSON plat.

### Installation

```bash
npm install -g design-tokens
```

### Utilisation

```bash
# Générer les tokens pour CSS et SCSS
design-tokens build -i ./tokens -o ./output -p css scss

# Valider les tokens avec le mode strict
design-tokens validate -i ./tokens --strict

# Générer la documentation
design-tokens docs -i ./tokens -o tokens.md
```
