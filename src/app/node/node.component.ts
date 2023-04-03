import {Component, Inject} from "@angular/core";
import {DOCUMENT} from "@angular/common";
import {CdkDragDrop, CdkDragMove} from "@angular/cdk/drag-drop";
import * as uuid from 'uuid';
import {DataContent, DataNode} from "../data/data-node";
import {DataDrop, Placement} from "../data/data-drop";
import {dataDefault} from "../data/data-default";

@Component({
  selector: 'app-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.css']
})
export class NodeComponent {
  rootID = "root";
  nodes: DataNode[] = [];
  nodeLookup: Map<string, DataNode> = new Map();
  dropData: DataDrop = new DataDrop("");

  constructor(@Inject(DOCUMENT) private document: Document) {
    // find & load data or use default template
    const local = localStorage.getItem("key");
    this.nodes = local ? JSON.parse(local!) : dataDefault;
    if (!local) this.saveChanges();

    // ready the data
    const root = new DataNode("", this.nodes);
    this.nodeLookup = new Map([[this.rootID, root], ...this.populateNodeLookup(this.nodes!)]);
    this.dropData = new DataDrop("");
  }

  saveChanges() {
    localStorage.setItem("key", JSON.stringify(this.nodes));
  }

  populateNodeLookup(nodes: DataNode[]): [string, DataNode][] {
    return nodes.flatMap(n => [[n.id, n], ...this.populateNodeLookup(n.children)]);
  }

  dragMoved(event: CdkDragMove<string>) {
    this.dropData = new DataDrop("", Placement.None);
    const xPos = event.pointerPosition.x, yPos = event.pointerPosition.y;

    let element = this.document.elementFromPoint(xPos, yPos);
    if (!element?.classList.contains("node-item")) element = element?.closest(".node-item") ?? null;
    if (!element) return;

    const dropID = element.getAttribute("data-id")!
    const dropRect = element.getBoundingClientRect();

    this.dropData = new DataDrop(dropID, Placement.Merge);
    if (yPos < dropRect.top + dropRect.height / 3) this.dropData.placement = Placement.Over;
    if (yPos > dropRect.bottom - dropRect.height / 3) this.dropData.placement = Placement.Under;

    this.purgeHighlightClasses();
    const derp = this.document.getElementById(dropID + '-' + Placement[this.dropData.placement]);
    derp?.style.setProperty("border-bottom", "2px solid");
  }

  drop(event: CdkDragDrop<DataNode[]>, drop: DataDrop) {
    this.dropData = new DataDrop("", Placement.None);
    if (drop?.placement === Placement.None) return;

    // what do we move
    const movedItem = this.nodeLookup.get(event.item.data)!;

    // from where do we remove it
    const prevListID = event.previousContainer.id;
    const prevList = this.nodeLookup.get(prevListID)!.children;
    const prevListIndex = prevList.findIndex(n => n.id === movedItem.id);
    prevList.splice(prevListIndex, 1);

    // to where did we move it
    const dropListID = this.searchTreeForParent(this.nodes, drop.id)!;
    const dropList = this.nodeLookup.get(dropListID)!.children;
    const dropListIndex = dropList.findIndex(n => n.id === drop.id);

    // perform move
    if (drop.placement === Placement.Over) dropList.splice(dropListIndex, 0, movedItem);
    else if (drop.placement === Placement.Under) dropList.splice(dropListIndex + 1, 0, movedItem);
    else if (drop.placement === Placement.Merge) this.nodeLookup.get(drop.id)!.children.push(movedItem);

    this.purgeHighlightClasses();
    this.saveChanges();
  }

  searchTreeForParent(nodeTree: DataNode[], searchID: string, parentId: string | null = null): string | null {
    for (const node of nodeTree) {
      if (node.id === searchID) return parentId ?? this.rootID;
      const childResult = this.searchTreeForParent(node.children, searchID, node.id);
      if (childResult) return childResult;
    }
    return parentId === null ? this.rootID : null;
  }

  purgeHighlightClasses() {
    const elements = this.document.querySelectorAll(".drop-line");
    elements.forEach(e => (e as any).style.removeProperty("border-bottom"));
  }

  onAddContent(node: DataNode) {
    node.content.push(new DataContent(''));
  }

  onSaveContent(node: DataNode, isNodeEmpty: boolean) {
    if (isNodeEmpty) {
      const parentID = this.searchTreeForParent(this.nodes, node.id)!;
      const parentsChildren = this.nodeLookup.get(parentID)!.children;
      parentsChildren.splice(parentsChildren.findIndex(c => c === node), 1);
    }
    this.saveChanges();
  }

  onAddNode(node: DataNode) {
    node.children.push(new DataNode(uuid.v4()))
  }

  onDeleteNode(node: DataNode) {
    if (!confirm('Are you sure you want to delete this branch?')) {
      return;
    }

    const parentID = this.searchTreeForParent(this.nodes, node.id)!;
    const parentsChildren = this.nodeLookup.get(parentID)!.children;
    parentsChildren.splice(parentsChildren.findIndex(c => c === node), 1);
    this.saveChanges();
  }
}
