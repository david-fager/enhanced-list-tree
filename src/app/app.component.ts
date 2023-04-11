import { Component } from '@angular/core';
import {defaultData} from "./data/default-data";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  localKeys: string[] = ["tree-default"]
  selectedKey: string = this.localKeys[0];

  constructor() {
    const keys = localStorage.getItem("keys");
    if (keys) this.localKeys = JSON.parse(keys);
    else {
      localStorage.setItem(this.localKeys[0], JSON.stringify(defaultData));
      localStorage.setItem("keys", JSON.stringify(this.localKeys));
    }
  }
}
