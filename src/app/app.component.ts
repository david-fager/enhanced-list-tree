import { Component } from '@angular/core';
import {NodeData} from "./node/node-data";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  rootData = new NodeData("Root", false);
}
