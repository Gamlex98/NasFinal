import { Component} from '@angular/core';

@Component({
  selector: 'app-ventana-emergente',
  template: `
 <table class="table">
  <thead>
    <tr>
      <th scope="col">#</th>
      <th scope="col">Columna 1</th>
      <th scope="col">Columna 2</th>
      <th scope="col">Columna 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">1</th>
      <td>dato1</td>
      <td>dato2</td>
      <td>dato3</td>
    </tr>
    <tr>
      <th scope="row">2</th>
      <td>dato4</td>
      <td>dato5</td>
      <td>dato6</td>
    </tr>
    <tr>
      <th scope="row">3</th>
      <td>dato7</td>
      <td>dato8</td>
      <td>dato9</td>
    </tr>
  </tbody>
</table>
`,
  styleUrls: ['./ventana-emergente.component.css']
})
export class VentanaEmergenteComponent {
}
