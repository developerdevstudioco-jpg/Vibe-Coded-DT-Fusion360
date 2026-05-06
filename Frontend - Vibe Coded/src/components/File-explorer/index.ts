export type FileSystemNodeType = 'folder' | 'image' | 'file';

export interface FileSystemNode {
  id: string;
  name: string;
  type: FileSystemNodeType;
  created?: string;
  modified?: string;
  size?: string;
  src?: string;
  children?: FileSystemNode[];
  expanded?: boolean;
}

export interface Filters {
  type?: string[];
  date?: string[];
  size?: string[];
}

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: string;
  danger?: boolean;
  action: (nodeId: string) => void;
}
