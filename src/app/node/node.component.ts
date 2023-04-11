import {Component, HostListener, Inject, Input} from "@angular/core";
import {DOCUMENT} from "@angular/common";
import {CdkDragDrop, CdkDragMove} from "@angular/cdk/drag-drop";
import * as uuid from 'uuid';
import {NodeData} from "../data/node-data";
import {DropData, Placement} from "../data/drop-data";
import {debounceTime, Subject, Subscription} from "rxjs";
import {Key} from "../data/enums";

@Component({
  selector: 'app-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.css']
})
export class NodeComponent {
  @Input()
  localKey?: string;

  nodeTreeRoot: NodeData = new NodeData("");
  shownNodes: NodeData[] = [];

  hoveredNode?: NodeData;
  selectedNode?: NodeData;
  editingIndex?: number;

  dropData: DropData = new DropData("");

  moveItemBounce = new Subject<CdkDragMove<string>>();
  subscription?: Subscription;


  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === Key.Tab) event.preventDefault();

    if (!this.selectedNode || this.editingIndex !== undefined) return;
    if (event.key === Key.ArrowUp) this.onSelectNode(this.selectedNode, -1);
    if (event.key === Key.ArrowDown) this.onSelectNode(this.selectedNode, +1);
    if (event.key === Key.ArrowLeft) this.onChangeExpanded(this.selectedNode, false);
    if (event.key === Key.ArrowRight) this.onChangeExpanded(this.selectedNode, true);

    if (event.key === Key.Enter) {
      event.preventDefault();
      this.onEditContent(this.selectedNode, 0);
    }

    if (event.key === Key.Escape) this.selectedNode = undefined;
  }


  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit() {
    this.subscription = this.moveItemBounce.pipe(debounceTime(10))
      .subscribe((value: CdkDragMove<string>) => this.dragMoved(value));

    try {
      const key = this.localKey!;
      const storedRaw = localStorage.getItem(key)!;
      const storedParsed = JSON.parse(storedRaw);
      if (storedParsed) this.nodeTreeRoot = storedParsed;
    } catch (e) {
      this.nodeTreeRoot = new NodeData("");
    }

    this.updateShownNodesList();
  }

  ngOnDestory() {
    this.subscription?.unsubscribe();
  }


  saveChanges(skipUpdate = false) {
    localStorage.setItem(this.localKey!, JSON.stringify(this.nodeTreeRoot));
    if (!skipUpdate) this.updateShownNodesList();
  }

  updateShownNodesList() {
    this.shownNodes = this.flattenNodeTree([this.nodeTreeRoot]);
  }

  flattenNodeTree(nodes: NodeData[]): NodeData[] {
    return nodes.flatMap(n => n.isExpanded ? [n, ...this.flattenNodeTree(n.children)] : [n]);
  }


  onChangeExpanded(node: NodeData, forceValue?: boolean) {
    node.isExpanded = forceValue ?? !node.isExpanded;
    this.updateShownNodesList();
  }

  onAddNode(parentNode: NodeData) {
    const created = new NodeData(uuid.v4());
    parentNode.children.push(created);
    this.updateShownNodesList();
    this.onEditContent(created);
  }

  onEditContent(node: NodeData, index: number | undefined = undefined) {
    this.selectedNode = node;
    if (index === undefined || index >= node.content.length) node.content.push("");
    this.editingIndex = index ?? node.content.length - 1;
  }

  onSaveContent(node: NodeData, contentIndex: number, event: { value: string, action: Key, shift: boolean }) {
    this.editingIndex = undefined;

    const parentID = this.searchTreeForParent([this.nodeTreeRoot], node.id, node.id)!;
    const parentNode = this.shownNodes.find(n => n.id === parentID)!
    const siblings = parentNode.children;
    const isLastOfSiblings = siblings.findIndex(s => s.id === node.id) >= siblings.length - 1;

    if (event.action === Key.Enter || event.action === Key.Tab) node.content[contentIndex] = event.value;
    if (!node.content[contentIndex]) node.content.splice(contentIndex, 1);
    if (!node.content.length) this.onDeleteNode(node, true);

    this.saveChanges(true);

    setTimeout(() => {
      if (event.action === Key.Tab && !event.shift) {
        // if there was content added then just go to next content 'column'
        if (node.content[contentIndex]) this.onEditContent(node, contentIndex + 1);
        else {
          this.editingIndex = 0;
          if (isLastOfSiblings) this.onAddNode(parentNode);
          else this.onSelectNode(node, +1);
        }
      }
      if (event.action === Key.Tab && event.shift) {
        if (contentIndex <= 0) {
          const prevNodeIndex = this.shownNodes.findIndex(n => n.id === node.id) - 1;
          if (prevNodeIndex > 0) this.onEditContent(this.shownNodes[prevNodeIndex]);
        } else this.onEditContent(node, contentIndex - 1);
      }
      if (event.action === Key.Enter) {
        if (!node.content[contentIndex] && !node.content.length) {
          this.editingIndex = undefined;
          this.onSelectNode(node, -1);
        } else {
          this.editingIndex = 0;
          if (isLastOfSiblings) this.onAddNode(parentNode);
          else this.onSelectNode(node, +1);
        }
      }
      this.updateShownNodesList();
    }, 1);
  }

  onSelectNode(node: NodeData, mod: number = 0, event?: MouseEvent) {
    if (event) {
      const clickedDiv = (event?.target as Element).tagName === "DIV";
      const rowIsSelectable = (event?.currentTarget as Element).classList.contains("selectable");
      if (event && (!clickedDiv || !rowIsSelectable)) return;
    }

    const index = this.shownNodes.findIndex(n => n.id === node.id) + mod;
    if (0 > index || index > this.shownNodes.length - 1) return;

    const selectNode = this.shownNodes[index];
    this.selectedNode = this.selectedNode?.id !== selectNode.id ? selectNode : undefined;
  }

  onDeleteNode(node: NodeData, shadowDelete = false) {
    if (!shadowDelete && !confirm('Are you sure you want to delete this branch?')) {
      return;
    }

    const parentID = this.searchTreeForParent([this.nodeTreeRoot], node.id)!;
    const parentsChildren = this.shownNodes.find(n => n.id === parentID)!.children;
    parentsChildren.splice(parentsChildren.findIndex(c => c === node), 1);

    if (!shadowDelete) this.saveChanges();
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
    // const movedItem = this.nodeLookup.get(event.item.data)!;
    const movedItem = this.shownNodes.find(n => n.id === event.item.data)!;
    if (movedItem.id === drop.id) return;
    if (drop?.placement === Placement.None) return;

    // from where do we remove it
    const prevListID = event.previousContainer.id;
    // const prevList = this.nodeLookup.get(prevListID)!.children;
    const prevList = this.shownNodes.find(n => n.id === prevListID)!.children;
    const prevListIndex = prevList.findIndex(n => n.id === movedItem.id);
    prevList.splice(prevListIndex, 1);

    // to where did we move it
    const dropListID = this.searchTreeForParent([this.nodeTreeRoot], drop.id);
    if (!dropListID) return;
    const dropList = this.shownNodes.find(n => n.id === dropListID)!.children;
    const dropListIndex = dropList.findIndex(n => n.id === drop.id);

    // perform move
    if (drop.placement === Placement.Over) dropList.splice(dropListIndex, 0, movedItem);
    else if (drop.placement === Placement.Under) dropList.splice(dropListIndex + 1, 0, movedItem);
    else if (drop.placement === Placement.Merge) {
      const mergedWith = this.shownNodes.find(n => n.id === drop.id)!;
      mergedWith.isExpanded = true;
      mergedWith.children.push(movedItem);
    }

    this.dropData = new DropData("", Placement.None);
    this.selectedNode = this.shownNodes.find(n => n.id === movedItem.id);

    this.saveChanges();
  }
}
