import { Token, TokenSet, Platform, TokenGroup } from './types';

export class TokenTransformer {
  transform(tokenSet: TokenSet, platform: Platform | string, prefix: string = ''): string {
    const allTokens = this.flattenTokenSet(tokenSet);

    switch (platform) {
      case 'css': return this.toCSS(allTokens, prefix);
      case 'scss': return this.toSCSS(allTokens, prefix);
      case 'js': return this.toJS(allTokens);
      case 'ts': return this.toTS(allTokens);
      case 'tailwind': return this.toTailwind(allTokens);
      case 'ios-swift': return this.toSwift(allTokens);
      case 'android-xml': return this.toAndroidXML(allTokens);
      case 'json-flat': return this.toFlatJSON(allTokens);
      default: throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private toCSS(tokens: Token[], prefix: string): string {
    const vars = tokens
      .map((t) => `  --${prefix}${t.name}: ${t.value};`)
      .join('\n');
    return `:root {\n${vars}\n}\n`;
  }

  private toSCSS(tokens: Token[], prefix: string): string {
    const lines = tokens.map((t) => {
      const comment = t.description ? ` // ${t.description}` : '';
      return `$${prefix}${t.name}: ${t.value};${comment}`;
    });
    return lines.join('\n') + '\n';
  }

  private toJS(tokens: Token[]): string {
    const entries = tokens.map((t) => {
      const key = this.toCamelCase(t.name);
      const value = typeof t.value === 'number' ? t.value : `'${t.value}'`;
      return `  ${key}: ${value},`;
    });

    return `export const tokens = {\n${entries.join('\n')}\n};\n`;
  }

  private toTS(tokens: Token[]): string {
    const typeEntries = tokens.map((t) => {
      const key = this.toCamelCase(t.name);
      const type = typeof t.value === 'number' ? 'number' : 'string';
      return `  ${key}: ${type};`;
    });

    const valueEntries = tokens.map((t) => {
      const key = this.toCamelCase(t.name);
      const value = typeof t.value === 'number' ? t.value : `'${t.value}'`;
      return `  ${key}: ${value},`;
    });

    return [
      `export interface DesignTokens {`,
      typeEntries.join('\n'),
      `}\n`,
      `export const tokens: DesignTokens = {`,
      valueEntries.join('\n'),
      `};\n`,
    ].join('\n');
  }

  private toTailwind(tokens: Token[]): string {
    const grouped: Record<string, Record<string, string | number>> = {};

    for (const token of tokens) {
      const type = token.type ?? 'custom';
      if (!grouped[type]) grouped[type] = {};

      const key = token.name.replace(new RegExp(`^${type}-`), '');
      grouped[type][key] = token.value;
    }

    const config: Record<string, unknown> = { theme: { extend: {} } };
    const extend = config.theme as Record<string, unknown>;
    const extendInner = (extend as { extend: Record<string, unknown> }).extend;

    if (grouped.color) extendInner.colors = grouped.color;
    if (grouped.spacing) extendInner.spacing = grouped.spacing;
    if (grouped.typography) extendInner.fontSize = grouped.typography;
    if (grouped.shadow) extendInner.boxShadow = grouped.shadow;
    if (grouped.borderRadius) extendInner.borderRadius = grouped.borderRadius;
    if (grouped.opacity) extendInner.opacity = grouped.opacity;

    return `/** @type {import('tailwindcss').Config} */\nmodule.exports = ${JSON.stringify(config, null, 2)};\n`;
  }

  private toSwift(tokens: Token[]): string {
    const lines = tokens.map((t) => {
      const name = this.toCamelCase(t.name);
      if (t.type === 'color' && typeof t.value === 'string') {
        const hex = t.value.replace('#', '');
        return `  static let ${name} = Color(hex: 0x${hex})`;
      }
      if (typeof t.value === 'number') {
        return `  static let ${name}: CGFloat = ${t.value}`;
      }
      return `  static let ${name} = "${t.value}"`;
    });

    return [
      'import SwiftUI\n',
      'struct DesignTokens {',
      lines.join('\n'),
      '}\n',
    ].join('\n');
  }

  private toAndroidXML(tokens: Token[]): string {
    const resources = tokens.map((t) => {
      const name = t.name.replace(/-/g, '_');
      if (t.type === 'color') {
        return `  <color name="${name}">${t.value}</color>`;
      }
      if (t.type === 'spacing' || typeof t.value === 'number') {
        return `  <dimen name="${name}">${t.value}${typeof t.value === 'number' ? 'dp' : ''}</dimen>`;
      }
      return `  <string name="${name}">${t.value}</string>`;
    });

    return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${resources.join('\n')}\n</resources>\n`;
  }

  private toFlatJSON(tokens: Token[]): string {
    const flat: Record<string, { value: string | number; type: string; description?: string }> = {};
    for (const token of tokens) {
      flat[token.name] = {
        value: token.value,
        type: token.type,
        ...(token.description ? { description: token.description } : {}),
      };
    }
    return JSON.stringify(flat, null, 2) + '\n';
  }

  private flattenTokenSet(tokenSet: TokenSet): Token[] {
    const tokens: Token[] = [...tokenSet.tokens];
    const flattenGroup = (group: TokenGroup): void => {
      tokens.push(...group.tokens);
      group.groups.forEach(flattenGroup);
    };
    tokenSet.groups.forEach(flattenGroup);
    return tokens;
  }

  private toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}
