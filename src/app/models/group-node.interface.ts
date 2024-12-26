
export interface GroupNode {
  id?: number;
  name: string;
  parent_id?: number | null;
  children?: GroupNode[];
}