import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DataContent, NodeData} from "./node-data";
import {CdkDragDrop, moveItemInArray} from "@angular/cdk/drag-drop";

@Component({
  selector: 'app-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.css']
})
export class NodeComponent {
  showBorder = false;
  hideContent = false;

  @Input()
  nodeData!: NodeData;

  @Input()
  parentNode: NodeData | undefined;

  @Output()
  onDataChange = new EventEmitter<string>();

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.nodeData.subNodes, event.previousIndex, event.currentIndex);
    this.onDataChange.emit();
  }

  onColumnDataSubmit(column: DataContent, event: string) {
    column.isEditing = false;
    column.text = event;
    this.onDataChange.emit();
  }

  onAddContentClick() {
    this.nodeData.content.push(new DataContent('', true));
    this.onDataChange.emit();
  }

  onDeleteContentClick(column: DataContent) {
    if (!confirm('Are you sure you want to delete this column?')) {
      return;
    }

    if (this.nodeData.content.length == 1) {
      this.onDeleteNodeClick();
    } else {
      this.nodeData.content.splice(this.nodeData.content.indexOf(column), 1);
      this.onDataChange.emit();
    }
  }

  onAddNodeClick(isLeaf: boolean) {
    this.nodeData.subNodes.push(new NodeData(isLeaf));
    this.onDataChange.emit();
  }

  onDeleteNodeClick() {
    if (!confirm('Are you sure you want to delete this branch?')) {
      return;
    }

    this.parentNode?.subNodes.splice(this.parentNode?.subNodes.indexOf(this.nodeData), 1);
    this.onDataChange.emit();
  }
}
