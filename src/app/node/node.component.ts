import {Component, Input} from '@angular/core';
import {DataContent, NodeData} from "./node-data";

@Component({
  selector: 'app-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.css']
})
export class NodeComponent {
  showBorder = false;
  hideContent = false;
  subNodes: NodeData[] = [];

  @Input()
  data: NodeData | undefined;

  @Input()
  isRoot: boolean = false

  onColumnDataSubmit(column: DataContent, event: string) {
    column.isEditing = false;
    column.text = event;
  }

  onAddContentClick() {
    this.data?.leafColumns.push(new DataContent('Content ' + (this.data?.leafColumns.length + 1), false));
  }

  onAddNodeClick(isLeaf: boolean) {
    const name = (isLeaf ? 'Leaf ' : 'Node ') + (this.subNodes.length + 1);
    this.subNodes.push(new NodeData(name, isLeaf));
  }
}
