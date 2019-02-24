import * as fs from 'fs';
import * as path from 'path';
import { Token, TokenGroup, TokenSet, TokenType } from './types';

interface RawTokenFile {
  [key: string]: RawTokenValue | RawTokenGroup;
}

interface RawTokenValue {
  value: string | number;
  type?: string;
  description?: string;
  $ref?: string;
}

interface RawTokenGroup {
  [key: string]: RawTokenValue | RawTokenGroup;
}

export class TokenParser {
  parseFile(filePath: string): TokenSet {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();

    let raw: RawTokenFile;
    if (ext === '.json') {
      raw = JSON.parse(content);
    } else if (ext === '.yaml' || ext === '.yml') {
      // Simple YAML parsing for flat structures
      raw = this.parseSimpleYaml(content);
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }

    const name = path.basename(filePath, ext);
    return this.parseRawTokens(name, raw);
  }

  parseDirectory(dirPath: string): TokenSet {
    const resolvedPath = path.resolve(dirPath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Directory not found: ${resolvedPath}`);
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      return this.parseFile(resolvedPath);
    }

    const files = fs.readdirSync(resolvedPath).filter(
      (f) => /\.(json|yaml|yml)$/i.test(f)
    );

    const allGroups: TokenGroup[] = [];
    const allTokens: Token[] = [];

    for (const file of files) {
      const tokenSet = this.parseFile(path.join(resolvedPath, file));
      allGroups.push(...tokenSet.groups);
      allTokens.push(...tokenSet.tokens);
    }

    return {
      name: path.basename(resolvedPath),
      groups: allGroups,
      tokens: allTokens,
    };
  }

  private parseRawTokens(name: string, raw: RawTokenFile): TokenSet {
    const groups: TokenGroup[] = [];
    const tokens: Token[] = [];

    for (const [key, value] of Object.entries(raw)) {
      if (this.isTokenValue(value)) {
        tokens.push(this.createToken(key, value as RawTokenValue));
      } else {
        const group = this.parseGroup(key, value as RawTokenGroup);
        groups.push(group);
      }
    }

    return { name, groups, tokens };
  }

  private parseGroup(name: string, raw: RawTokenGroup): TokenGroup {
    const tokens: Token[] = [];
    const subGroups: TokenGroup[] = [];

    for (const [key, value] of Object.entries(raw)) {
      if (this.isTokenValue(value)) {
        tokens.push(this.createToken(`${name}-${key}`, value as RawTokenValue));
      } else {
        subGroups.push(this.parseGroup(`${name}-${key}`, value as RawTokenGroup));
      }
    }

    return { name, tokens, groups: subGroups };
  }

  private createToken(name: string, raw: RawTokenValue): Token {
    const token: Token = {
      name: this.toKebabCase(name),
      value: raw.value,
      type: this.inferType(raw.type, raw.value),
      description: raw.description,
    };

    if (raw.$ref) {
      token.reference = raw.$ref;
    }

    return token;
  }

  private isTokenValue(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) return false;
    return 'value' in (value as Record<string, unknown>);
  }

  private inferType(explicitType?: string, value?: string | number): TokenType {
    if (explicitType) return explicitType as TokenType;

    if (typeof value === 'string') {
      if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) return 'color';
      if (value.endsWith('px') || value.endsWith('rem') || value.endsWith('em')) return 'spacing';
      if (value.includes('shadow') || value.includes('0px')) return 'shadow';
    }

    if (typeof value === 'number') return 'spacing';

    return 'color';
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[_\s]+/g, '-')
      .toLowerCase();
  }

  private parseSimpleYaml(content: string): RawTokenFile {
    const result: RawTokenFile = {};
    const lines = content.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));

    for (const line of lines) {
      const match = line.match(/^(\s*)(\S+):\s*(.*)$/);
      if (match) {
        const [, , key, value] = match;
        if (value) {
          result[key] = { value: value.trim() };
        }
      }
    }

    return result;
  }
}
