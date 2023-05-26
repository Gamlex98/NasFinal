import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class AuthenticationService {

  urlNas = 'http://172.16.1.24:8095/cgi-bin/authLogin.cgi?';

  constructor(private http: HttpClient) { }

  authenticate(username: string, password: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const body = `user=${username}&pwd=${password}`;

    return this.http.post(this.urlNas, body, { headers, responseType: 'text' }).pipe(
      map(response => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response, 'text/xml');
        const authSid = xmlDoc.getElementsByTagName('authSid')[0].childNodes[0].nodeValue;
        return authSid;
      })
    );
  }

  getList(sid : string, carpeta: string): Observable<any> {
    const url = `http://172.16.1.24:8095/cgi-bin/filemanager/utilRequest.cgi?func=get_list&sid=${sid}&is_iso=0&list_mode=all&path=/OneDrive/CUADRES2/S50/${carpeta}&dir=ASC&limit=1000&sort=filename&start=0`;
    return this.http.get(url).pipe(
      map((response: any) => {
        return response.datas;
      }),                 
      catchError(error => {
        console.error('Error al obtener la lista de archivos', error);
        return throwError(error);
      })
    );
  }

  download(sid: string, carpeta: string, nombre: any): Observable<any> {
    const urDownload = `http://172.16.1.24:8095/cgi-bin/filemanager/utilRequest.cgi??sid=${sid}&isfolder=0&compress=0&source_path=/OneDrive/CUADRES2/S50/${carpeta}&source_file=${nombre}&source_total=1`;
  
    return this.http.get(urDownload, { responseType: 'blob' }).pipe(
      catchError(error => {
        console.log('Error en descarga', error);
        return throwError(error);
      })
    );
  }
  
  delete (sid: string , carpeta:string , nombre: string): Observable<any> {
    const urlDelete = `http://172.16.1.24:8095/cgi-bin/filemanager/utilRequest.cgi?func=delete&sid=${sid}&path=/OneDrive/CUADRES2/S50/${carpeta}&file_total=1&file_name=${nombre}`;

    return this.http.delete(urlDelete).pipe(
      catchError(error => {
        console.log('Error en el DELETE : ', error);
        return throwError(error);
      })
    );
  }
}

