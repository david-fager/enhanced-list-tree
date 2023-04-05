import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {DataContent, NodeData} from "../data/node-data";

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css']
})
export class InputComponent {

  text!: string;

  @Input()
  node!: NodeData;

  @Input()
  content!: DataContent;

  @Output()
  onSave = new EventEmitter<boolean>();

  @Output()
  onClose = new EventEmitter();

  @ViewChild('field') field!: ElementRef;

  ngOnInit() {
    this.text = this.content.text;
  }

  async ngAfterViewInit() {
    this.field.nativeElement.focus();
    setTimeout(() => this.field.nativeElement.select(), 1);
  }

  onCloseInput(cancelled: boolean) {
    if (!cancelled) {
      this.content.text = this.text;
      if (!this.content.text) cancelled = true;
      else this.onSave.emit();
    }

    if (cancelled && !this.content.text) {
      this.node.content.splice(this.node.content.findIndex(c => c === this.content), 1);
      this.onSave.emit(this.node.content.length === 0);
    }

    this.onClose.emit();
  }
}
