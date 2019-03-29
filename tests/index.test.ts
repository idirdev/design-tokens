import { describe, it, expect } from 'vitest';
import { TokenValidator } from '../src/Validator';
import { TokenTransformer } from '../src/Transformer';
import type { TokenSet, Token, TokenGroup } from '../src/types';

function createTokenSet(tokens: Token[], groups: TokenGroup[] = []): TokenSet {
  return {
    name: 'test-tokens',
    tokens,
    groups,
  };
}

function createToken(overrides: Partial<Token> = {}): Token {
  return {
    name: 'color-primary',
    value: '#ff0000',
    type: 'color',
    ...overrides,
  };
}

describe('TokenValidator', () => {
  const validator = new TokenValidator();

  it('validates a token set with valid tokens', () => {
    const tokenSet = createTokenSet([
      createToken({ name: 'color-primary', value: '#ff0000', type: 'color', description: 'Primary color' }),
      createToken({ name: 'spacing-sm', value: '8px', type: 'spacing', description: 'Small spacing' }),
    ]);

    const result = validator.validate(tokenSet);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports error for non-kebab-case naming', () => {
    const tokenSet = createTokenSet([
      createToken({ name: 'colorPrimary', value: '#ff0000', type: 'color' }),
    ]);

    const result = validator.validate(tokenSet);
    expect(result.valid).toBe(false);
    const namingErrors = result.errors.filter((e) => e.rule === 'naming-convention');
    expect(namingErrors.length).toBeGreaterThan(0);
    expect(namingErrors[0].message).toContain('kebab-case');
  });

  it('reports warning for missing description', () => {
    const tokenSet = createTokenSet([
      createToken({ name: 'color-primary', value: '#ff0000', type: 'color' }),
    ]);

    const result = validator.validate(tokenSet);
    const descWarnings = result.warnings.filter((w) => w.rule === 'require-description');
    expect(descWarnings.length).toBeGreaterThan(0);
  });

  it('validates color tokens with hex values', () => {
    const tokenSet = createTokenSet([
      createToken({ name: 'color-valid', value: '#abcdef', type: 'color', description: 'Valid' }),
    ]);

    const result = validator.validate(tokenSet);
    const typeErrors = result.errors.filter((e) => e.rule === 'type-value-match');
    expect(typeErrors).toHaveLength(0);
  });

  it('reports error for color token with invalid value', () => {
    const tokenSet = createTokenSet([
      createToken({ name: 'color-bad', value: 'not-a-color', type: 'color', description: 'Bad' }),
    ]);

    const result = validator.validate(tokenSet);
    expect(result.valid).toBe(false);
    const typeErrors = result.errors.filter((e) => e.rule === 'type-value-match');
    expect(typeErrors.length).toBeGreaterThan(0);
  });

  it('validates spacing tokens with px values', () => {
    const tokenSet = createTokenSet([
      createToken({ name: 'spacing-md', value: '16px', type: 'spacing', description: 'Medium' }),
    ]);

    const result = validator.validate(tokenSet);
    const typeErrors = result.errors.filter((e) => e.rule === 'type-value-match');
    expect(typeErrors).toHaveLength(0);
  });

  it('reports error for invalid spacing value', () => {
    const tokenSet = createTokenSet([
      createToken({ name: 'spacing-bad', value: 'not-spacing', type: 'spacing', description: 'Bad' }),
    ]);

    const result = validator.validate(tokenSet);
    expect(result.valid).toBe(false);
  });

  it('validates opacity tokens in range 0-1', () => {
    const validSet = createTokenSet([
      createToken({ name: 'opacity-half', value: 0.5, type: 'opacity', description: 'Half' }),
    ]);
    expect(validator.validate(validSet).valid).toBe(true);

    const invalidSet = createTokenSet([
      createToken({ name: 'opacity-bad', value: 1.5, type: 'opacity', description: 'Bad' }),
    ]);
    expect(validator.validate(invalidSet).valid).toBe(false);
  });

  it('reports error for orphan references', () => {
    const tokenSet = createTokenSet([
      createToken({
        name: 'color-secondary',
        value: '#00ff00',
        type: 'color',
        description: 'Secondary',
        reference: '$ref.color.nonexistent',
      }),
    ]);

    const result = validator.validate(tokenSet);
    const refErrors = result.errors.filter((e) => e.rule === 'no-orphan-references');
    expect(refErrors.length).toBeGreaterThan(0);
  });

  it('validates tokens within groups', () => {
    const tokenSet = createTokenSet([], [
      {
        name: 'colors',
        tokens: [
          createToken({ name: 'BadName', value: '#000', type: 'color' }),
        ],
        groups: [],
      },
    ]);

    const result = validator.validate(tokenSet);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.rule === 'naming-convention')).toBe(true);
  });
});

describe('TokenTransformer', () => {
  const transformer = new TokenTransformer();

  const tokenSet: TokenSet = createTokenSet([
    createToken({ name: 'color-primary', value: '#ff0000', type: 'color' }),
    createToken({ name: 'color-secondary', value: '#00ff00', type: 'color' }),
    createToken({ name: 'spacing-sm', value: '8px', type: 'spacing' }),
  ]);

  it('transforms to CSS custom properties', () => {
    const css = transformer.transform(tokenSet, 'css');
    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary: #ff0000;');
    expect(css).toContain('--color-secondary: #00ff00;');
    expect(css).toContain('--spacing-sm: 8px;');
    expect(css).toContain('}');
  });

  it('transforms to CSS with prefix', () => {
    const css = transformer.transform(tokenSet, 'css', 'ds-');
    expect(css).toContain('--ds-color-primary: #ff0000;');
  });

  it('transforms to SCSS variables', () => {
    const scss = transformer.transform(tokenSet, 'scss');
    expect(scss).toContain('$color-primary: #ff0000;');
    expect(scss).toContain('$color-secondary: #00ff00;');
    expect(scss).toContain('$spacing-sm: 8px;');
  });

  it('transforms to JavaScript module', () => {
    const js = transformer.transform(tokenSet, 'js');
    expect(js).toContain('export const tokens = {');
    expect(js).toContain("colorPrimary: '#ff0000'");
    expect(js).toContain("colorSecondary: '#00ff00'");
    expect(js).toContain("spacingSm: '8px'");
  });

  it('transforms to TypeScript with type definition', () => {
    const ts = transformer.transform(tokenSet, 'ts');
    expect(ts).toContain('export interface DesignTokens {');
    expect(ts).toContain('colorPrimary: string;');
    expect(ts).toContain('export const tokens: DesignTokens = {');
    expect(ts).toContain("colorPrimary: '#ff0000'");
  });

  it('transforms to flat JSON', () => {
    const jsonStr = transformer.transform(tokenSet, 'json-flat');
    const parsed = JSON.parse(jsonStr);
    expect(parsed['color-primary'].value).toBe('#ff0000');
    expect(parsed['color-primary'].type).toBe('color');
    expect(parsed['spacing-sm'].value).toBe('8px');
  });

  it('transforms to Android XML', () => {
    const xml = transformer.transform(tokenSet, 'android-xml');
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('<resources>');
    expect(xml).toContain('<color name="color_primary">#ff0000</color>');
    expect(xml).toContain('</resources>');
  });

  it('transforms to Swift', () => {
    const swift = transformer.transform(tokenSet, 'ios-swift');
    expect(swift).toContain('import SwiftUI');
    expect(swift).toContain('struct DesignTokens {');
    expect(swift).toContain('colorPrimary');
    expect(swift).toContain('0xff0000');
  });

  it('transforms to Tailwind config', () => {
    const tailwind = transformer.transform(tokenSet, 'tailwind');
    expect(tailwind).toContain('module.exports');
    expect(tailwind).toContain('theme');
    expect(tailwind).toContain('extend');
  });

  it('throws for unsupported platform', () => {
    expect(() => transformer.transform(tokenSet, 'unsupported')).toThrow('Unsupported platform');
  });

  it('transforms tokens from groups', () => {
    const groupedSet: TokenSet = {
      name: 'grouped',
      tokens: [],
      groups: [
        {
          name: 'brand',
          tokens: [
            createToken({ name: 'brand-primary', value: '#0000ff', type: 'color' }),
          ],
          groups: [],
        },
      ],
    };

    const css = transformer.transform(groupedSet, 'css');
    expect(css).toContain('--brand-primary: #0000ff;');
  });

  it('handles numeric token values in JS output', () => {
    const numSet = createTokenSet([
      createToken({ name: 'spacing-base', value: 16, type: 'spacing' }),
    ]);

    const js = transformer.transform(numSet, 'js');
    expect(js).toContain('spacingBase: 16');
  });

  it('handles numeric token values in TypeScript output', () => {
    const numSet = createTokenSet([
      createToken({ name: 'opacity-half', value: 0.5, type: 'opacity' }),
    ]);

    const ts = transformer.transform(numSet, 'ts');
    expect(ts).toContain('opacityHalf: number;');
    expect(ts).toContain('opacityHalf: 0.5');
  });
});
