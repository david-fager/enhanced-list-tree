import {Component, HostListener, Inject} from "@angular/core";
import {DOCUMENT} from "@angular/common";
import {CdkDragDrop, CdkDragMove} from "@angular/cdk/drag-drop";
import * as uuid from 'uuid';
import {DataContent, NodeData} from "../data/node-data";
import {DropData, Placement} from "../data/drop-data";
import {defaultData} from "../data/default-data";
import {debounceTime, Subject, Subscription} from "rxjs";

@Component({
  selector: 'app-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.css']
})
export class NodeComponent {
  rootID = "root";
  nodes: NodeData[] = [];
  nodeLookup: Map<string, NodeData> = new Map();
  dropData: DropData = new DropData("");

  moveItemSubject = new Subject<CdkDragMove<string>>();
  subscription?: Subscription;

  orderedNodeIDs: string[] = [];
  selectedID?: string;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    console.log(event.key);
    if (event.key === "ArrowUp") this.onNodeSelection(this.selectedID, -1);
    if (event.key === "ArrowDown") this.onNodeSelection(this.selectedID, +1);
  }

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.load();
  }

  ngOnInit() {
    this.moveItemSubject.pipe(debounceTime(10))
      .subscribe((value: CdkDragMove<string>) => this.dragMoved(value));
  }

  ngOnDestory() {
    this.subscription?.unsubscribe();
  }

  load() {
    // find & load data or use default template
    const local = localStorage.getItem("key");
    this.nodes = local ? JSON.parse(local!) : defaultData;
    if (!local) this.saveChanges();

    // ready the data
    // const lookup = this.populateNodeLookup(this.nodes!);
    this.orderedNodeIDs = [];
    const root = new NodeData("", this.nodes);
    this.nodeLookup = new Map([[this.rootID, root], ...this.populateNodeLookup(this.nodes!)]);
    // console.log(this.orderedNodeIDs);
    // this.orderedNodeIDs = [ ...lookup.values() ].map(value => value[0]);

    this.dropData = new DropData("");

    const reselect = this.selectedID;
    this.selectedID = undefined;
    this.onNodeSelection(reselect);
  }

  saveChanges() {
    localStorage.setItem("key", JSON.stringify(this.nodes));
    this.load();
  }

  populateNodeLookup(nodes: NodeData[], isExpanded = true): [string, NodeData][] {
    return nodes.flatMap(n => {
      if (isExpanded) this.orderedNodeIDs.push(n.id);
      return [[n.id, n], ...this.populateNodeLookup(n.children, n.isExpanded)];
    });
  }

  dragMoved(event: CdkDragMove<string>) {
    this.dropData = new DropData("", Placement.None);
    const xPos = event.pointerPosition.x, yPos = event.pointerPosition.y;

    let element = this.document.elementFromPoint(xPos, yPos);
    if (!element?.classList.contains("node-item")) element = element?.closest(".node-item") ?? null;
    if (!element) return;

    const dropID = element.getAttribute("data-id")!
    const dropRect = element.getBoundingClientRect();

    this.dropData = new DropData(dropID, Placement.Merge);
    if (yPos < dropRect.top + dropRect.height / 3) this.dropData.placement = Placement.Over;
    if (yPos > dropRect.bottom - dropRect.height / 3) this.dropData.placement = Placement.Under;

    this.clearDropLines();
    const derp = this.document.getElementById(dropID + '-' + Placement[this.dropData.placement]);
    derp?.style.setProperty("display", "flex");
  }

  drop(event: CdkDragDrop<NodeData[]>, drop: DropData) {
    this.onNodeSelection(this.selectedID);
    this.clearDropLines();

    this.dropData = new DropData("", Placement.None);
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

    this.saveChanges();
  }

  searchTreeForParent(nodeTree: NodeData[], searchID: string, parentId: string | null = null): string | null {
    for (const node of nodeTree) {
      if (node.id === searchID) return parentId ?? this.rootID;
      const childResult = this.searchTreeForParent(node.children, searchID, node.id);
      if (childResult) return childResult;
    }
    return parentId === null ? this.rootID : null;
  }

  clearDropLines() {
    const elements = this.document.querySelectorAll(".placement");
    elements.forEach(e => (e as any).style.setProperty("display", "none"));
  }

  onChangeExpanded(node: NodeData) {
    node.isExpanded = !node.isExpanded;
    this.saveChanges();
  }

  onAddContent(node: NodeData) {
    node.content.push(new DataContent(''));
  }

  onSaveContent(node: NodeData, isNodeEmpty: boolean) {
    if (isNodeEmpty) {
      const parentID = this.searchTreeForParent(this.nodes, node.id)!;
      const parentsChildren = this.nodeLookup.get(parentID)!.children;
      parentsChildren.splice(parentsChildren.findIndex(c => c === node), 1);
    }
    this.saveChanges();
  }

  onAddNode(node: NodeData) {
    node.children.push(new NodeData(uuid.v4()))
  }

  onDeleteNode(node: NodeData) {
    if (!confirm('Are you sure you want to delete this branch?')) {
      return;
    }

    const parentID = this.searchTreeForParent(this.nodes, node.id)!;
    const parentsChildren = this.nodeLookup.get(parentID)!.children;
    parentsChildren.splice(parentsChildren.findIndex(c => c === node), 1);
    this.saveChanges();
  }

  onNodeSelection(nodeID?: string, mod: number = 0, event?: MouseEvent) {
    if (event && (event?.target as Element).tagName === "IMG") return;

    let nodeIndex = -1;
    if (nodeID) {
      nodeIndex = this.orderedNodeIDs.findIndex(nid => nid === nodeID) + mod;
      if (nodeIndex < 0 || nodeIndex > this.orderedNodeIDs.length - 1) return;
    }

    const oldElement = this.document.getElementById('content-' + this.selectedID);
    if (oldElement) oldElement.classList.remove("selected");

    if (!this.selectedID || this.selectedID !== nodeID || mod) {
      const selectedID = this.orderedNodeIDs[nodeIndex];
      const selectedElement = this.document.getElementById('content-' + selectedID);

      if (selectedElement) {
        selectedElement.classList.add("selected");
        this.selectedID = selectedID;
      }
    } else this.selectedID = undefined;
  }
}
