import { Token, TokenSet, TokenGroup } from './types';

export class DocGenerator {
  generate(tokenSet: TokenSet): string {
    const sections: string[] = [];

    sections.push(`# ${tokenSet.name} Design Tokens`);
    if (tokenSet.description) {
      sections.push(tokenSet.description);
    }
    if (tokenSet.version) {
      sections.push(`Version: ${tokenSet.version}`);
    }
    sections.push('');

    // Table of contents
    sections.push('## Table of Contents\n');
    const allGroups = this.collectGroups(tokenSet);
    allGroups.forEach((group) => {
      sections.push(`- [${group.name}](#${group.name.toLowerCase().replace(/\s+/g, '-')})`);
    });
    sections.push('');

    // Top-level tokens
    if (tokenSet.tokens.length > 0) {
      sections.push('## General Tokens\n');
      sections.push(this.generateTokenTable(tokenSet.tokens));
      sections.push(this.generateColorSwatches(tokenSet.tokens));
    }

    // Groups
    for (const group of tokenSet.groups) {
      sections.push(this.generateGroupSection(group, 2));
    }

    return sections.join('\n');
  }

  private generateGroupSection(group: TokenGroup, depth: number): string {
    const sections: string[] = [];
    const heading = '#'.repeat(Math.min(depth, 6));

    sections.push(`${heading} ${group.name}\n`);
    if (group.description) {
      sections.push(group.description + '\n');
    }

    if (group.tokens.length > 0) {
      sections.push(this.generateTokenTable(group.tokens));

      // Type-specific visualizations
      const colorTokens = group.tokens.filter((t) => t.type === 'color');
      if (colorTokens.length > 0) {
        sections.push(this.generateColorSwatches(colorTokens));
      }

      const spacingTokens = group.tokens.filter((t) => t.type === 'spacing');
      if (spacingTokens.length > 0) {
        sections.push(this.generateSpacingScale(spacingTokens));
      }

      const typographyTokens = group.tokens.filter((t) => t.type === 'typography');
      if (typographyTokens.length > 0) {
        sections.push(this.generateTypographySpecimens(typographyTokens));
      }
    }

    for (const subGroup of group.groups) {
      sections.push(this.generateGroupSection(subGroup, depth + 1));
    }

    return sections.join('\n');
  }

  private generateTokenTable(tokens: Token[]): string {
    const rows = tokens.map((t) => {
      const desc = t.description ?? '-';
      const ref = t.reference ?? '-';
      return `| \`${t.name}\` | \`${t.value}\` | ${t.type} | ${desc} | ${ref} |`;
    });

    return [
      '| Token | Value | Type | Description | Reference |',
      '|-------|-------|------|-------------|-----------|',
      ...rows,
      '',
    ].join('\n');
  }

  private generateColorSwatches(tokens: Token[]): string {
    const colorTokens = tokens.filter((t) => t.type === 'color');
    if (colorTokens.length === 0) return '';

    const swatches = colorTokens.map((t) => {
      const color = String(t.value);
      return `<div style="display:inline-block;margin:4px;text-align:center;">` +
        `<div style="width:60px;height:60px;background:${color};border:1px solid #ccc;border-radius:4px;"></div>` +
        `<div style="font-size:11px;margin-top:4px;">${t.name}</div>` +
        `<div style="font-size:10px;color:#666;">${color}</div></div>`;
    });

    return `\n<div style="display:flex;flex-wrap:wrap;gap:8px;margin:16px 0;">\n${swatches.join('\n')}\n</div>\n`;
  }

  private generateSpacingScale(tokens: Token[]): string {
    const lines = ['', '**Spacing Scale:**', ''];
    const sorted = [...tokens].sort((a, b) => {
      const aVal = typeof a.value === 'number' ? a.value : parseFloat(String(a.value));
      const bVal = typeof b.value === 'number' ? b.value : parseFloat(String(b.value));
      return aVal - bVal;
    });

    for (const token of sorted) {
      const width = typeof token.value === 'number' ? token.value * 4 : 20;
      lines.push(
        `- \`${token.name}\` = \`${token.value}\`` +
        ` <span style="display:inline-block;height:8px;width:${width}px;background:#6366F1;border-radius:2px;"></span>`
      );
    }

    return lines.join('\n') + '\n';
  }

  private generateTypographySpecimens(tokens: Token[]): string {
    const lines = ['', '**Typography:**', ''];
    for (const token of tokens) {
      lines.push(`- **${token.name}**: \`${token.value}\``);
    }
    return lines.join('\n') + '\n';
  }

  private collectGroups(tokenSet: TokenSet): TokenGroup[] {
    const groups: TokenGroup[] = [];
    const collect = (group: TokenGroup): void => {
      groups.push(group);
      group.groups.forEach(collect);
    };
    tokenSet.groups.forEach(collect);
    return groups;
  }
}
