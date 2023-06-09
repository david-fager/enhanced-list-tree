import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from "@angular/forms";
import {InputComponent} from "./input/input.component";
import {DragDropModule} from "@angular/cdk/drag-drop";
import {NodeComponent} from "./node/node.component";

@NgModule({
    declarations: [
        AppComponent,
        NodeComponent,
        InputComponent
    ],
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        DragDropModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
