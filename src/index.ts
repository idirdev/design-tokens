#!/usr/bin/env node

import { Command } from 'commander';
import { TokenParser } from './Parser';
import { TokenTransformer } from './Transformer';
import { TokenValidator } from './Validator';
import { TokenDiffer } from './Differ';
import { DocGenerator } from './DocGenerator';

const program = new Command();

program
  .name('design-tokens')
  .description('Design token manager - build, validate, diff, and document tokens')
  .version('1.0.0');

program
  .command('build')
  .description('Build tokens for target platforms')
  .requiredOption('-i, --input <path>', 'Input tokens directory')
  .requiredOption('-o, --output <path>', 'Output directory')
  .option('-p, --platform <platforms...>', 'Target platforms', ['css'])
  .action((opts) => {
    const parser = new TokenParser();
    const transformer = new TokenTransformer();
    const tokenSet = parser.parseDirectory(opts.input);
    for (const platform of opts.platform) {
      const output = transformer.transform(tokenSet, platform);
      console.log(`Built ${platform}: ${output.length} chars`);
    }
  });

program
  .command('validate')
  .description('Validate token files')
  .requiredOption('-i, --input <path>', 'Input tokens directory')
  .option('--strict', 'Strict mode (warnings become errors)')
  .action((opts) => {
    const parser = new TokenParser();
    const validator = new TokenValidator();
    const tokenSet = parser.parseDirectory(opts.input);
    const results = validator.validate(tokenSet);
    console.log(`Validation: ${results.errors.length} errors, ${results.warnings.length} warnings`);
  });

program
  .command('diff')
  .description('Compare two token sets')
  .requiredOption('-a, --base <path>', 'Base token file')
  .requiredOption('-b, --compare <path>', 'Comparison token file')
  .action((opts) => {
    const parser = new TokenParser();
    const differ = new TokenDiffer();
    const base = parser.parseDirectory(opts.base);
    const compare = parser.parseDirectory(opts.compare);
    const diff = differ.diff(base, compare);
    console.log(`Diff: +${diff.added.length} -${diff.removed.length} ~${diff.changed.length}`);
  });

program
  .command('docs')
  .description('Generate token documentation')
  .requiredOption('-i, --input <path>', 'Input tokens directory')
  .option('-o, --output <path>', 'Output file', 'tokens.md')
  .action((opts) => {
    const parser = new TokenParser();
    const docGen = new DocGenerator();
    const tokenSet = parser.parseDirectory(opts.input);
    const docs = docGen.generate(tokenSet);
    console.log(`Documentation generated: ${docs.length} chars`);
  });

program.parse(process.argv);
