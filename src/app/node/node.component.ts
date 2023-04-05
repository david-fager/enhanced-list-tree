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
  rootNode: NodeData = new NodeData("");
  nodeLookup: Map<string, NodeData> = new Map();
  dropData: DropData = new DropData("");

  moveItemSubject = new Subject<CdkDragMove<string>>();
  subscription?: Subscription;

  hoveredNode?: NodeData;

  orderedNodes: NodeData[] = [];
  selectedNode?: NodeData;
  disableDragging = false;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    console.log(event.key);
    if (!this.selectedNode) return;
    if (event.key === "ArrowUp") this.onNodeSelection(this.selectedNode, -1);
    if (event.key === "ArrowDown") this.onNodeSelection(this.selectedNode, +1);
    if (event.key === "ArrowLeft") this.onChangeExpanded(this.selectedNode, false);
    if (event.key === "ArrowRight") this.onChangeExpanded(this.selectedNode, true);
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
    this.rootNode = local ? JSON.parse(local!) : defaultData;
    if (!local) this.saveChanges();

    // ready the data
    this.orderedNodes = [];
    this.nodeLookup = new Map(this.populateNodeLookup([this.rootNode]));

    this.dropData = new DropData("");

    this.forceSelectNode(this.selectedNode);
  }

  saveChanges() {
    localStorage.setItem("key", JSON.stringify(this.rootNode));
    this.load();
  }

  populateNodeLookup(nodes: NodeData[], isExpanded = true): [string, NodeData][] {
    return nodes.flatMap(n => {
      if (isExpanded) this.orderedNodes.push(n);
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
    if (event.source.data === dropID) return;
    const derp = this.document.getElementById(dropID + '-' + Placement[this.dropData.placement]);
    derp?.style.setProperty("display", "flex");
  }

  drop(event: CdkDragDrop<NodeData[]>, drop: DropData) {
    this.clearDropLines();

    // what do we move
    const movedItem = this.nodeLookup.get(event.item.data)!;
    if (movedItem.id === drop.id) return;
    if (drop?.placement === Placement.None) return;

    // from where do we remove it
    const prevListID = event.previousContainer.id;
    const prevList = this.nodeLookup.get(prevListID)!.children;
    const prevListIndex = prevList.findIndex(n => n.id === movedItem.id);
    prevList.splice(prevListIndex, 1);

    // to where did we move it
    const dropListID = this.searchTreeForParent([this.rootNode], drop.id);
    if (!dropListID) return;
    const dropList = this.nodeLookup.get(dropListID)!.children;
    const dropListIndex = dropList.findIndex(n => n.id === drop.id);

    // perform move
    if (drop.placement === Placement.Over) dropList.splice(dropListIndex, 0, movedItem);
    else if (drop.placement === Placement.Under) dropList.splice(dropListIndex + 1, 0, movedItem);
    else if (drop.placement === Placement.Merge) {
      const mergedWith = this.nodeLookup.get(drop.id)!;
      mergedWith.isExpanded = true;
      mergedWith.children.push(movedItem);
    }

    this.forceSelectNode(this.nodeLookup.get(movedItem.id));

    this.dropData = new DropData("", Placement.None);
    this.saveChanges();
  }

  searchTreeForParent(nodes: NodeData[], searchID: string, parentId?: string): string | undefined {
    for (const node of nodes) {
      if (node.id === searchID) return parentId ?? undefined;
      const childResult = this.searchTreeForParent(node.children, searchID, node.id);
      if (childResult) return childResult;
    }
    return undefined;
  }

  clearDropLines() {
    const elements = this.document.querySelectorAll(".placement");
    elements.forEach(e => (e as any).style.setProperty("display", "none"));
  }

  onChangeExpanded(node: NodeData, forceValue?: boolean) {
    node.isExpanded = forceValue ?? !node.isExpanded;
    this.saveChanges();
  }

  onAddContent(node: NodeData) {
    node.content.push(new DataContent(''));
  }

  onEditContent(node: NodeData, content: DataContent) {
    this.disableDragging = content.isEditing = true;
    this.forceSelectNode(node);
  }

  onSaveContent(node: NodeData, content: DataContent, isNodeEmpty: boolean) {
    this.disableDragging = content.isEditing = false

    if (isNodeEmpty) {
      const parentID = this.searchTreeForParent([this.rootNode], node.id)!;
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

    const parentID = this.searchTreeForParent([this.rootNode], node.id)!;
    const parentsChildren = this.nodeLookup.get(parentID)!.children;
    parentsChildren.splice(parentsChildren.findIndex(c => c === node), 1);
    this.saveChanges();
  }

  onNodeSelection(nodeToSelect?: NodeData, mod: number = 0, event?: MouseEvent) {
    if (event) {
      const clickedDiv = (event?.target as Element).tagName === "DIV";
      const rowIsSelectable = (event?.currentTarget as Element).classList.contains("selectable");
      if (event && (!clickedDiv || !rowIsSelectable)) return;
    }

    let nodeIndex = -1;
    if (nodeToSelect) {
      nodeIndex = this.orderedNodes.findIndex(n => n.id === nodeToSelect.id) + mod;
      if (nodeIndex < 0 || nodeIndex > this.orderedNodes.length - 1) return;
    }

    const oldElement = this.document.getElementById('content-' + this.selectedNode?.id);
    if (oldElement) oldElement.classList.remove("selected");

    if (!this.selectedNode || this.selectedNode.id !== nodeToSelect?.id || mod) {
      const actualNode = this.orderedNodes[nodeIndex];
      const selectedElement = this.document.getElementById('content-' + actualNode.id);

      if (selectedElement) {
        selectedElement.classList.add("selected");
        this.selectedNode = actualNode;
      }
    } else this.selectedNode = undefined;
  }

  forceSelectNode(node?: NodeData) {
    if (node) {
      const reselect = node;
      this.selectedNode = undefined;
      this.onNodeSelection(reselect);
    }
  }
}
