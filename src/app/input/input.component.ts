import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css']
})
export class InputComponent {

  @Input()
  value: string | undefined;

  @Output()
  onSubmit = new EventEmitter<string>();

  @ViewChild('field') field: ElementRef | undefined;

  ngAfterViewInit() {
    this.field?.nativeElement.focus();
  }
}
