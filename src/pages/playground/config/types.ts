export interface ModelSelectionItem extends Global.BaseOption<string> {
  uid: number;
  instanceId: symbol;
  type?: string;
}

export interface MessageItem {
  role: string;
  content: string;
  imgs?: { uid: string | number; dataUrl: string }[];
  uid: number;
}
