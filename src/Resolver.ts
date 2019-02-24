import { Token, TokenSet, TokenGroup } from './types';

export class TokenResolver {
  private tokenMap: Map<string, Token> = new Map();
  private resolutionStack: Set<string> = new Set();

  buildIndex(tokenSet: TokenSet): void {
    this.tokenMap.clear();

    for (const token of tokenSet.tokens) {
      this.tokenMap.set(token.name, token);
    }

    const indexGroup = (group: TokenGroup): void => {
      for (const token of group.tokens) {
        this.tokenMap.set(token.name, token);
      }
      group.groups.forEach(indexGroup);
    };

    tokenSet.groups.forEach(indexGroup);
  }

  resolve(tokenName: string): string | number {
    const token = this.tokenMap.get(tokenName);
    if (!token) {
      throw new Error(`Token not found: ${tokenName}`);
    }

    if (!token.reference) {
      return token.value;
    }

    return this.resolveReference(token.reference, tokenName);
  }

  resolveAll(tokenSet: TokenSet): TokenSet {
    this.buildIndex(tokenSet);

    const resolveToken = (token: Token): Token => {
      if (!token.reference) return token;
      return {
        ...token,
        value: this.resolveReference(token.reference, token.name),
        reference: undefined,
      };
    };

    const resolveGroup = (group: TokenGroup): TokenGroup => ({
      ...group,
      tokens: group.tokens.map(resolveToken),
      groups: group.groups.map(resolveGroup),
    });

    return {
      ...tokenSet,
      tokens: tokenSet.tokens.map(resolveToken),
      groups: tokenSet.groups.map(resolveGroup),
    };
  }

  private resolveReference(ref: string, fromToken: string): string | number {
    // Detect circular references
    if (this.resolutionStack.has(fromToken)) {
      const chain = Array.from(this.resolutionStack).join(' -> ');
      throw new Error(`Circular reference detected: ${chain} -> ${fromToken}`);
    }

    this.resolutionStack.add(fromToken);

    try {
      // Parse reference: "$ref.color.primary" -> "color-primary"
      const refPath = ref.replace(/^\$ref\./, '').replace(/\./g, '-');
      const referencedToken = this.tokenMap.get(refPath);

      if (!referencedToken) {
        throw new Error(`Reference not found: ${ref} (resolved to "${refPath}")`);
      }

      // Recursively resolve if the referenced token also has a reference
      if (referencedToken.reference) {
        return this.resolveReference(referencedToken.reference, referencedToken.name);
      }

      return referencedToken.value;
    } finally {
      this.resolutionStack.delete(fromToken);
    }
  }

  findToken(path: string): Token | undefined {
    const normalizedPath = path.replace(/\./g, '-');
    return this.tokenMap.get(normalizedPath);
  }

  computeDarken(colorHex: string, amount: number): string {
    const hex = colorHex.replace('#', '');
    const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - Math.round(255 * amount));
    const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - Math.round(255 * amount));
    const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - Math.round(255 * amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  computeLighten(colorHex: string, amount: number): string {
    const hex = colorHex.replace('#', '');
    const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + Math.round(255 * amount));
    const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + Math.round(255 * amount));
    const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + Math.round(255 * amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  computeOpacity(colorHex: string, opacity: number): string {
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return `${colorHex}${alpha}`;
  }
}
