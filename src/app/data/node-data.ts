export class NodeData {
  id: string;
  isExpanded = true;
  content: DataContent[];
  children: NodeData[];

  constructor(id: string, children: NodeData[] = []) {
    this.id = id;
    this.content = [new DataContent("", true)];
    this.children = children;
  }
}

export class DataContent {
  showOptions = false;
  text: string;
  isEditing: boolean;

  constructor(text: string, isEditing: boolean = true) {
    this.text = text;
    this.isEditing = isEditing;
  }
}
