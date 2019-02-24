import { Token, TokenSet, TokenGroup, DiffResult } from './types';

export class TokenDiffer {
  diff(base: TokenSet, compare: TokenSet): DiffResult {
    const baseTokens = this.collectAllTokens(base);
    const compareTokens = this.collectAllTokens(compare);

    const baseMap = new Map(baseTokens.map((t) => [t.name, t]));
    const compareMap = new Map(compareTokens.map((t) => [t.name, t]));

    const added: Token[] = [];
    const removed: Token[] = [];
    const changed: DiffResult['changed'] = [];

    // Find added and changed tokens
    for (const [name, token] of compareMap) {
      const baseToken = baseMap.get(name);
      if (!baseToken) {
        added.push(token);
      } else if (String(baseToken.value) !== String(token.value)) {
        changed.push({
          token: name,
          oldValue: baseToken.value,
          newValue: token.value,
        });
      }
    }

    // Find removed tokens
    for (const [name, token] of baseMap) {
      if (!compareMap.has(name)) {
        removed.push(token);
      }
    }

    // Determine if changes are breaking
    const breaking = removed.length > 0 || changed.some((c) => {
      // Type changes are breaking
      const baseToken = baseMap.get(c.token);
      const compareToken = compareMap.get(c.token);
      return baseToken?.type !== compareToken?.type;
    });

    return { added, removed, changed, breaking };
  }

  formatDiff(result: DiffResult): string {
    const lines: string[] = [];

    if (result.added.length > 0) {
      lines.push('Added:');
      result.added.forEach((t) => lines.push(`  + ${t.name}: ${t.value}`));
    }

    if (result.removed.length > 0) {
      lines.push('Removed:');
      result.removed.forEach((t) => lines.push(`  - ${t.name}: ${t.value}`));
    }

    if (result.changed.length > 0) {
      lines.push('Changed:');
      result.changed.forEach((c) => lines.push(`  ~ ${c.token}: ${c.oldValue} -> ${c.newValue}`));
    }

    if (result.breaking) {
      lines.push('\n[BREAKING] This diff contains breaking changes.');
    }

    if (lines.length === 0) {
      lines.push('No differences found.');
    }

    return lines.join('\n');
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
