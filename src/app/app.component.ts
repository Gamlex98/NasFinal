import { Component } from '@angular/core';
import { AuthenticationService } from './upload-service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AuthenticationComponent {

  fileToUpload !: File ;
  authenticated = false;
  sid = '';
  porcentaje: number = 0;
  enviando: boolean = false;
  overwrite= false;
  botonEnviar= false;
  // listaArchivos: DocumentModel [] = [];
  rutaBase = `http://172.16.1.24:8095/cgi-bin/filemanager/utilRequest.cgi?func=createdir&type=standard`;
  rutaRelativa = '/OneDrive'
  dirSubcarpetas = ['CUADRES2','S50', '2023','Sept'];
  carpetaMes = this.dirSubcarpetas[3];
  carpetaAno =this.dirSubcarpetas[2];
  dirTotal=`${this.carpetaAno}/${this.carpetaMes}`;

  constructor(private authService: AuthenticationService,private http: HttpClient) {}

  authenticate() {
    const usuario = 'Intranet';
    const pass = 'MW50cjQxMjMrLSo=';

    this.authService.authenticate(usuario, pass).subscribe({
      next: (authSid) => {
        this.authenticated = true;
        this.sid = authSid;
        console.log(`SID generado: ${this.sid}`);
      },
      error: (err) => {
        console.error('Authentication failed', err);
      }
    });
  }

  onFileSelected(event: any) {
    this.fileToUpload = event.target.files[0];
  }

  onUpload() {
    if (!this.fileToUpload){
      alert("DEBES SELECCIONAR UN ARCHIVO !!");
      return
    }
    console.log("Direccion Destino :"+ this.dirTotal);
    const uploadUrl = `http://172.16.1.24:8095/cgi-bin/filemanager/utilRequest.cgi?func=upload&type=standard&sid=${this.sid}&dest_path=/OneDrive/CUADRES2/S50/${this.dirTotal}&overwrite=1&progress=-OneDrive`;

    const formData = new FormData();
    formData.append('file', this.fileToUpload, this.fileToUpload.name);
    console.log("nombre archivo : " + this.fileToUpload.name);

    const headers = new HttpHeaders();
    headers.append('Content-Type', 'multipart/form-data');
    headers.append('Accept', 'application/json');
    
    //Verificacion Carpetas
    this.crearSubcarpetas(this.rutaBase, this.dirSubcarpetas,this.rutaRelativa);
    this.doUpload(uploadUrl,formData,headers);
    this.botonEnviar=true;
    this.progressBar();
   
    //Obtener archivos de la Nas y comparar nombre del archivo a subir
    this.authService.getList(this.sid , this.dirTotal).subscribe({
      next: async (data) => {
      console.log(data);
      console.log('AQUIIII');
      const existingFile = data.find((file: { filename: string; }) => file.filename.toLowerCase() === this.fileToUpload.name.toLowerCase());
      if (existingFile) {
        console.log("Archivo ya existe !!");
        const result = await Swal.fire({
          title: 'El archivo ya existe. ¿Qué deseas hacer?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sobrescribir',
        });
        if (result.isConfirmed) {
          this.doUpload(uploadUrl,formData,headers);
          this.botonEnviar=true;
          this.progressBar();
        // } else if (result.dismiss == Swal.DismissReason.cancel) {
        //   // Permitir al usuario cambiar el nombre del archivo
        //   let newName: string | null = null;
        //   while (!newName) {
        //     newName = window.prompt("Por favor ingrese un nuevo nombre para el archivo:");
        //     if (newName === null) {
        //       // El usuario ha cancelado el prompt
        //       return;
        //     }
        //     newName = newName.trim(); // Eliminar espacios en blanco al inicio y al final
        //     if (newName === "") {
        //       alert("El nombre no puede estar vacío. Por favor, ingrese un nombre válido.");
        //       newName = null;
        //     }
        //   }
        //   //Creacion archivo con el nuevo nombre
        //   const extensionIndex = this.fileToUpload.name.lastIndexOf('.');
        //   const extension = this.fileToUpload.name.substring(extensionIndex);
        //   const newFilename = `${newName}${extension}`;
        //   if (newFilename) {
        //     const newFile =  new File([this.fileToUpload], newFilename, { type: this.fileToUpload.type });
        //     this.fileToUpload = newFile;
        //     this.onUpload();
        //     this.botonEnviar=true;
        //   } 
        // }
      }}else{
        this.doUpload(uploadUrl,formData,headers);
      }
    },
    error: (error) => {
      console.error("Error al obtener la lista de archivos", error);
    }
    });
    
  }

  crearSubcarpetas(rutaBase: string, nombresSubcarpetas: string[], rutaRelativa: string): void {
    if (nombresSubcarpetas.length === 0) {
      // Si el array está vacío, no hacemos nada
      return;
    }
    const subcarpetas = nombresSubcarpetas[0];
    const url = `${rutaBase}&sid=${this.sid}&dest_folder=${subcarpetas}&dest_path=${rutaRelativa}`;
    this.http.get(url).subscribe({
      next: (response) => {
        // Llamamos recursivamente a la función para crear la siguiente subcarpeta
        this.crearSubcarpetas(rutaBase,nombresSubcarpetas.slice(1),`${rutaRelativa}/${subcarpetas}` );
        console.log(`Subcarpeta ${subcarpetas} creada exitosamente en la ruta ${rutaRelativa}.`);
      },
      error: (err) => {
        console.error(`Error al crear la subcarpeta ${subcarpetas} en la ruta ${rutaRelativa}.`, err);
      }
    });
  }
  
  downloadFile(): void {
    this.authService.getList(this.sid , this.dirTotal ).subscribe({
      next: (data) => {
      console.log("Lista archivos :", data);
      const archivo = data.find((file: { filename: string; }) => file.filename.toLowerCase() === this.fileToUpload.name.toLowerCase());
      if (archivo == null) {
        console.log("No hay archivo para descargar");
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'No hay archivo para DESCARGAR',
          showConfirmButton: false,
          timer: 1000
        })
      }else {
        this.authService.download(this.sid, this.dirTotal, this.fileToUpload.name).subscribe((archivo: Blob) => {
          const nombreArchivo = this.fileToUpload.name;
          const url = URL.createObjectURL(archivo);
          const link = document.createElement('a');
          link.href = url;
          link.download = nombreArchivo;
          link.click();
  
          Swal.fire(
            'Archivo descargado Exitosamente !!',
            'Tu archivo ha sido descargado.',
            'success'
          );
          console.log("Descarga Exitosa !!");
        }
        )}
      },
       error: (error) => {
        console.log("Error en la busqueda Archivos", error)
      }
    })
  }
     
    deleteFile():void {
      this.authService.getList(this.sid , this.dirTotal).subscribe({
        next: (data) => {
        console.log("Lista archivos :", data);
        const archivo = data.find((file: { filename: string; }) => file.filename.toLowerCase() === this.fileToUpload.name.toLowerCase());
        if (archivo == null) {
          console.log("No hay archivo para eliminar");
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: 'No hay archivo para ELIMINAR',
            showConfirmButton: false,
            timer: 1000
          })
        }else {
          this.authService.delete(this.sid, this.dirTotal,this.fileToUpload.name).subscribe({
            next: () => {
              console.log('Archivo eliminado exitosamente');
              // Limpiar la variable fileToUpload
              Swal.fire(
                'Archivo Borrado Exitosamente !!',
                'Tu archivo ha sido borrado.',
                'success'
              );
              return
            },
            error: (err) => {
              console.error('Error al eliminar el archivo', err);
            }
          });
        }
        },
        error: (error) => {
          console.log("Error en la busqueda Archivos", error)
        }
      })
    }
  
  doUpload(uploadUrl: string, formData: FormData, headers: HttpHeaders) {
    this.http.post(uploadUrl, formData, { headers }).subscribe({
      next: (response) => {
        console.log('Upload successful');
      },
      error: (err) => {
        console.error('Upload failed', err);
      }
    });
  }

  progressBar() {
    this.enviando = true;
    this.porcentaje = 0; // resetear el porcentaje
    let intervalo = setInterval(() => {
      if (this.porcentaje < 100) {
        this.porcentaje += 10;
      } else {
        clearInterval(intervalo);
        this.enviando = false;
      }
    }, 100);
  }
}