export class NodeData {
  isLeaf: boolean;
  content: DataContent[];
  subNodes: NodeData[];

  constructor(isLeaf: boolean) {
    this.isLeaf = isLeaf;
    this.content = [new DataContent("Untitled", true)];
    this.subNodes = [];
  }
}

export class DataContent {
  showOptions = false;
  text: string;
  isEditing: boolean;

  constructor(text: string, isEditing: boolean) {
    this.text = text;
    this.isEditing = isEditing;
  }
}
