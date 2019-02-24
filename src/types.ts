export type TokenType =
  | 'color'
  | 'spacing'
  | 'typography'
  | 'shadow'
  | 'border'
  | 'opacity'
  | 'motion'
  | 'sizing'
  | 'borderRadius';

export interface Token {
  name: string;
  value: string | number;
  type: TokenType;
  description?: string;
  reference?: string; // e.g., "$ref.color.primary"
  extensions?: Record<string, unknown>;
}

export interface TokenGroup {
  name: string;
  description?: string;
  tokens: Token[];
  groups: TokenGroup[];
}

export interface TokenSet {
  name: string;
  version?: string;
  description?: string;
  groups: TokenGroup[];
  tokens: Token[];
}

export interface Theme {
  name: string;
  tokenSet: TokenSet;
  extends?: string;
}

export type Platform =
  | 'css'
  | 'scss'
  | 'js'
  | 'ts'
  | 'tailwind'
  | 'ios-swift'
  | 'android-xml'
  | 'json-flat';

export interface TransformConfig {
  platform: Platform;
  prefix?: string;
  outputDir: string;
  fileExtension?: string;
  selector?: string; // CSS: ":root"
  moduleName?: string; // JS/TS module name
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationIssue {
  token: string;
  message: string;
  severity: 'error' | 'warning';
  rule: string;
}

export interface DiffResult {
  added: Token[];
  removed: Token[];
  changed: Array<{
    token: string;
    oldValue: string | number;
    newValue: string | number;
  }>;
  breaking: boolean;
}
