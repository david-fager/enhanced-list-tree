export class NodeData {
  title: string;
  isLeaf: boolean;
  leafColumns: string[] = [];

  constructor(title: string, isLeaf: boolean) {
    this.title = title;
    this.isLeaf = isLeaf;
    this.leafColumns = [title]
  }
}
