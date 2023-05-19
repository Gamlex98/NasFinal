import { Component } from '@angular/core';
import { AuthenticationService } from './upload-service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';

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

  rutaBase = `http://172.16.1.24:8095/cgi-bin/filemanager/utilRequest.cgi?func=createdir&type=standard`;
  rutaRelativa = '/OneDrive';
  dirSubcarpetas = ['CUADRES2','S50', '2025','Diciembre'];
  carpetaMes = this.dirSubcarpetas[3];
  carpetaAno =this.dirSubcarpetas[2];
  dirTotal=`${this.carpetaAno}/${this.carpetaMes}`;

  carpetaCuadres2 =`2023/Mayo/03`;

  formdate = new  FormData();
  header=new HttpHeaders;
  upload = "";

  pdfCapturado !: File ;
  file2 !: File ;
  archivoDescargado !: File;
  archivoCombinado !: File;

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

  FileSelected(event:any) {
    const file = event.target.files[0];
    const allowedExtensions = /(\.pdf)$/i;
  
    if (!allowedExtensions.exec(file.name)) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Solo se PERMITE archivos PDF !!',
        showConfirmButton: false,
        timer: 1000
      })
      // Aquí puedes realizar cualquier acción adicional, como limpiar el campo de archivo o mostrar un mensaje de error.
      return;
    }
  
    // El archivo seleccionado es un PDF y puedes continuar con el procesamiento.
    this.fileToUpload = file;
  }

  onUpload() {
    if (!this.fileToUpload){
      alert("DEBES SELECCIONAR UN ARCHIVO !!");
      return
    }
    const uploadUrl = `http://172.16.1.24:8095/cgi-bin/filemanager/utilRequest.cgi?func=upload&type=standard&sid=${this.sid}&dest_path=/OneDrive/CUADRES2/S50/${this.dirTotal}&overwrite=1&progress=-OneDrive`;
    this.upload = uploadUrl;
    console.log("Url nueva : " + this.upload);
    const formData = new FormData();
    formData.append('file', this.fileToUpload, this.fileToUpload.name);
    console.log("nombre archivo : " + this.fileToUpload.name);
    this.formdate = formData;
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'multipart/form-data');
    headers.append('Accept', 'application/json');
    this.header=headers;

    //Verificacion Carpetas
    this.crearSubcarpetas(this.rutaBase, this.dirSubcarpetas,this.rutaRelativa);
   
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
        this.doUpload(this.upload,this.formdate,this.header);
        this.botonEnviar=true;
        this.progressBar();
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

  capturarPantalla() {
    const elemento = document.body;
    if (elemento) {
      html2canvas(elemento).then((canvas) => {
        const pdf = new jsPDF("p", "mm", "a4");
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 210; 
        const pageHeight = 297; 
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        const pdfNew = pdf.output('blob');
        this.pdfCapturado = new File([pdfNew], "captura-de-pantalla.pdf", { type: 'application/pdf' });
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'PDF generado Exitosamente !!',
          showConfirmButton: false,
          timer: 1000
        });
      });
    }
  }

  /* onFileSelected2(event: any, field: string) {
    const file = event.target.files[0];
   if (field === 'file2') {
      this.file2 = file;
    }
  } */
  
  async mergePDFs() {
    // Obtenemos el archivo a unir de la Nas
    this.authService.getList(this.sid, this.carpetaCuadres2).subscribe({
      next: (data) => {
        this.file2 = data[0].filename;
        console.log('Nombre archivo 2: ',this.file2);
        // Descargar y asignar el archivo
        this.authService.download(this.sid, this.carpetaCuadres2, this.file2).subscribe((archivo: Blob) => {
          archivo.arrayBuffer().then((arrayBuffer) => {
            const uint8Array = new Uint8Array(arrayBuffer);
            const file = new File([uint8Array], this.file2.name, { type: archivo.type });
            // Asignar el archivo a una variable
            this.archivoDescargado = file;
            // Continuar con el proceso de unión de PDFs aquí
            this.processPDFs();
          });
        });
      },
      error: (error) => {
        console.log('Error al obtener la lista de archivos:', error);
      }
    });
  }
  
  async processPDFs() {
    const uploadNas = `http://172.16.1.24:8095/cgi-bin/filemanager/utilRequest.cgi?func=upload&type=standard&sid=${this.sid}&dest_path=/OneDrive/CUADRES/S50/&overwrite=1&progress=-OneDrive`;
    const pdfBytes1 = await this.readFile(this.pdfCapturado);
    const pdfBytes2 = await this.readFile(this.archivoDescargado);
  
    const pdfUnion = await PDFDocument.create();
  
    const sourcePdf1 = await PDFDocument.load(pdfBytes1);
    const sourcePdf2 = await PDFDocument.load(pdfBytes2);
  
    const pages1 = await pdfUnion.copyPages(sourcePdf1, sourcePdf1.getPageIndices());
    const pages2 = await pdfUnion.copyPages(sourcePdf2, sourcePdf2.getPageIndices());
  
    pages1.forEach((page) => {
      pdfUnion.addPage(page);
    });
  
    pages2.forEach((page) => {
      pdfUnion.addPage(page);
    });
  
    // Se construye el nuevo archivo y se asigna a la variable archivoCombinado
    const mergedPdf = await pdfUnion.save();
    const archivoCombinadoBlob = new Blob([mergedPdf], { type: 'application/pdf' });
    const archivoCombinadoFile = new File([archivoCombinadoBlob], 'archivoCombinado.pdf');
    this.archivoCombinado = archivoCombinadoFile;
  
    // Enviamos el nuevo archivo combinado a la Nas
    const formData = new FormData();
    formData.append('file', this.archivoCombinado, this.archivoCombinado.name);
    console.log("Nombre archivo a Enviar :", this.archivoCombinado.name);
  
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'multipart/form-data');
    headers.append('Accept', 'application/json');
  
    this.doUpload(uploadNas, formData, headers);
    Swal.fire(
      'Archivo Combinado Enviado a la NAS',
      '',
      'success'
    );
  }

  async readFile(file: File): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const arrayBuffer = event.target.result;
        const uint8Array = new Uint8Array(arrayBuffer);
        resolve(uint8Array);
      };
      reader.onerror = (event:any) => {
        reject(event.target.error);
      };
      reader.readAsArrayBuffer(file);
    });
  }
}
