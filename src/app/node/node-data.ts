export class NodeData {
  title: DataContent;
  isLeaf: boolean;
  leafColumns: DataContent[] = [];

  constructor(title: string, isLeaf: boolean) {
    this.title = new DataContent(title, false);
    this.isLeaf = isLeaf;
    this.leafColumns = [new DataContent(title, false)]
  }
}

export class DataContent {
  text: string;
  showEdit = false;
  isEditing: boolean;

  constructor(content: string, isEditing: boolean) {
    this.text = content;
    this.isEditing = isEditing;
  }
}
