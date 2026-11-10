export interface ImageComparisonLayout {
  span: number;
  count: number;
}

export interface ImageModelSelection extends Global.BaseOption<string> {
  uid: number;
  instanceId: symbol;
  type?: string;
}

export interface PreparedImageRun {
  parameters: Record<string, any>;
  revision: number;
}

export interface ImageComparisonHandle {
  instanceId: symbol;
  submit: (run: PreparedImageRun) => void;
  abortFetch: () => void;
  clear: () => void;
  prepare: (prompt: string) => Promise<PreparedImageRun | null | false>;
  getParameters: () => Record<string, any>;
  validateParameters: (parameters: Record<string, any>) => string[];
  applyParameters: (parameters: Record<string, any>) => void;
}
