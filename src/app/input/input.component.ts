import {Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild} from '@angular/core';
import {Key} from "../data/enums";

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css']
})
export class InputComponent {
  keys = Key;
  value!: string;

  @Input()
  content!: string;

  @Output()
  onClose = new EventEmitter<{ value: string, action: Key, shift: boolean }>();

  @ViewChild('field') field!: ElementRef;

  ngOnInit() {
    this.value = this.content;
  }

  async ngAfterViewInit() {
    this.field.nativeElement.focus();
    setTimeout(() => this.field.nativeElement.select(), 1);
  }

  onInputClose(action: Key, shift = false) {
    this.onClose.emit({ value: this.value, action: action, shift: shift });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === Key.Tab) {
      event.preventDefault();
      this.onInputClose(Key.Tab, event.shiftKey);
    }
    if (event.key === Key.Enter) {
      event.preventDefault();
      this.onInputClose(Key.Enter);
    }
    if (event.key === Key.Escape) {
      event.preventDefault();
      this.onInputClose(Key.Escape);
    }
  }
}
