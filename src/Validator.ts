import { Token, TokenSet, TokenGroup, ValidationResult, ValidationIssue } from './types';

export class TokenValidator {
  validate(tokenSet: TokenSet): ValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const allTokens = this.collectAllTokens(tokenSet);

    for (const token of allTokens) {
      // Check naming convention (kebab-case)
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(token.name)) {
        errors.push({
          token: token.name,
          message: `Token name must be kebab-case, got: "${token.name}"`,
          severity: 'error',
          rule: 'naming-convention',
        });
      }

      // Check type matches value
      const typeError = this.validateTypeValue(token);
      if (typeError) errors.push(typeError);

      // Check required description
      if (!token.description) {
        warnings.push({
          token: token.name,
          message: 'Token is missing a description',
          severity: 'warning',
          rule: 'require-description',
        });
      }

      // Check orphan references
      if (token.reference) {
        const refPath = token.reference.replace(/^\$ref\./, '').replace(/\./g, '-');
        const exists = allTokens.some((t) => t.name === refPath);
        if (!exists) {
          errors.push({
            token: token.name,
            message: `Reference "${token.reference}" resolves to "${refPath}" which does not exist`,
            severity: 'error',
            rule: 'no-orphan-references',
          });
        }
      }
    }

    // Check color contrast pairs
    const colorTokens = allTokens.filter((t) => t.type === 'color');
    const contrastWarnings = this.checkContrastPairs(colorTokens);
    warnings.push(...contrastWarnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateTypeValue(token: Token): ValidationIssue | null {
    const { name, value, type } = token;

    switch (type) {
      case 'color': {
        if (typeof value === 'string' && !/^(#[0-9a-fA-F]{3,8}|rgb|hsl|transparent)/.test(value)) {
          return {
            token: name,
            message: `Color token has invalid value: "${value}"`,
            severity: 'error',
            rule: 'type-value-match',
          };
        }
        break;
      }
      case 'spacing':
      case 'sizing': {
        if (typeof value === 'string' && !/^(\d+(\.\d+)?(px|rem|em|%|vw|vh)?|0)$/.test(value)) {
          if (typeof value !== 'number') {
            return {
              token: name,
              message: `Spacing token has invalid value: "${value}"`,
              severity: 'error',
              rule: 'type-value-match',
            };
          }
        }
        break;
      }
      case 'opacity': {
        const numValue = typeof value === 'number' ? value : parseFloat(String(value));
        if (isNaN(numValue) || numValue < 0 || numValue > 1) {
          return {
            token: name,
            message: `Opacity must be between 0 and 1, got: ${value}`,
            severity: 'error',
            rule: 'type-value-match',
          };
        }
        break;
      }
    }

    return null;
  }

  private checkContrastPairs(colorTokens: Token[]): ValidationIssue[] {
    const warnings: ValidationIssue[] = [];

    // Check bg/fg pairs
    const bgTokens = colorTokens.filter((t) => t.name.includes('background') || t.name.includes('bg'));
    const fgTokens = colorTokens.filter((t) => t.name.includes('foreground') || t.name.includes('text') || t.name.includes('fg'));

    for (const bg of bgTokens) {
      for (const fg of fgTokens) {
        if (typeof bg.value === 'string' && typeof fg.value === 'string') {
          const ratio = this.calculateContrastRatio(bg.value, fg.value);
          if (ratio < 4.5) {
            warnings.push({
              token: `${bg.name} / ${fg.name}`,
              message: `Contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA (4.5:1)`,
              severity: 'warning',
              rule: 'contrast-ratio',
            });
          }
        }
      }
    }

    return warnings;
  }

  private calculateContrastRatio(hex1: string, hex2: string): number {
    const lum1 = this.relativeLuminance(hex1);
    const lum2 = this.relativeLuminance(hex2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  private relativeLuminance(hex: string): number {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;

    const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  private collectAllTokens(tokenSet: TokenSet): Token[] {
    const tokens: Token[] = [...tokenSet.tokens];
    const collectGroup = (group: TokenGroup): void => {
      tokens.push(...group.tokens);
      group.groups.forEach(collectGroup);
    };
    tokenSet.groups.forEach(collectGroup);
    return tokens;
  }
}
