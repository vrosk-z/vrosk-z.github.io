export type TokenKind =
  | 'WORD'
  | 'FLAG_SHORT'
  | 'FLAG_LONG'
  | 'PIPE'
  | 'REDIRECT_OUT'
  | 'REDIRECT_APP'
  | 'REDIRECT_IN'
  | 'STRING'
  | 'EOF';

export interface Token {
  kind: TokenKind;
  value: string;
  raw: string;
  pos: number;
}

export interface ParsedFlag {
  short: boolean;
  key: string;
  value?: string;
}

export interface CommandNode {
  type: 'command';
  name: string;
  args: string[];
  flags: ParsedFlag[];
  rawArgv: string[];
  stdin?: string;
  stdout?: string;
  appendStdout?: boolean;
}

export interface PipelineNode {
  type: 'pipeline';
  commands: CommandNode[];
}
