import { Component } from '@angular/core';
import {NodeData} from "./node/node-data";
import * as json from './json.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  rootData: NodeData | undefined;

  ngOnInit() {
    const local = localStorage.getItem("key");

    this.rootData = local ? JSON.parse(local!) : json;

    if (!local) {
      localStorage.setItem("key", JSON.stringify(this.rootData));
    }
  }

  saveChanges() {
    localStorage.setItem("key", JSON.stringify(this.rootData));
  }
}
