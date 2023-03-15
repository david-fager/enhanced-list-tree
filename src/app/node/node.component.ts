import {Component, Input} from '@angular/core';
import {NodeData} from "./node-data";

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

  onAddContentClick() {
    this.data?.leafColumns.push(('Content ' + (this.data?.leafColumns.length + 1)));
  }

  onAddNodeClick(isLeaf: boolean) {
    const name = (isLeaf ? 'Leaf ' : 'Node ') + (this.subNodes.length + 1);
    this.subNodes.push(new NodeData(name, isLeaf));
  }
}
