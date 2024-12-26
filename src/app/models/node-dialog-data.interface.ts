export interface NodeDialogData {
  id?: number;
  name: string;
  parentName?: string;
  parent_id?: number | null;
  mode: 'add' | 'update';
}
