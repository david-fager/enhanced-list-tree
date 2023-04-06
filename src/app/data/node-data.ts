export class NodeData {
  id: string;
  isExpanded = true;
  content: string[] = [];
  children: NodeData[];

  constructor(id: string, children: NodeData[] = []) {
    this.id = id;
    this.children = children;
  }
}
