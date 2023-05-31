import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import {FormsModule , ReactiveFormsModule } from '@angular/forms'
import { AuthenticationService } from './upload-service';
import { AuthenticationComponent } from './app.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { VentanaEmergenteComponent } from './ventana-emergente/ventana-emergente.component';


@NgModule({
  declarations: [	
    AuthenticationComponent,
    VentanaEmergenteComponent
   ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    
  ],
  providers: [AuthenticationService],
  bootstrap: [AuthenticationComponent]
})
export class AppModule { }

