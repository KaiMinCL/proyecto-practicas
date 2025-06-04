import { CreateDocumentoData, UpdateDocumentoData } from '@/lib/validators/documento';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

interface Documento {
  id: number;
  nombre: string;
  url: string;
  carreraId: number;
  sedeId: number;
  carrera?: {
    id: number;
    nombre: string;
  };
  sede?: {
    id: number;
    nombre: string;
  };
  creadoEn: string;
}

export class DocumentoService {
  private static readonly BASE_URL = '/api/documentos';

  /**
   * Obtener todos los documentos
   */
  static async obtenerDocumentos(): Promise<ApiResponse<Documento[]>> {
    try {
      const response = await fetch(this.BASE_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `Error ${response.status}: ${response.statusText}`,
          data: [],
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.documentos || [],
        message: 'Documentos obtenidos exitosamente',
      };

    } catch (error) {
      console.error('Error fetching documentos:', error);
      return {
        success: false,
        message: 'Error de conexión al obtener documentos',
        data: [],
      };
    }
  }

  /**
   * Obtener un documento por ID
   */
  static async obtenerDocumentoPorId(id: number): Promise<ApiResponse<Documento>> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `Error ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.documento,
        message: 'Documento obtenido exitosamente',
      };

    } catch (error) {
      console.error('Error fetching documento:', error);
      return {
        success: false,
        message: 'Error de conexión al obtener el documento',
      };
    }
  }

  /**
   * Crear un nuevo documento
   */
  static async crearDocumento(documentoData: CreateDocumentoData, archivo: File): Promise<ApiResponse<Documento>> {
    try {      // Crear FormData para enviar archivo y datos
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('nombre', documentoData.nombre);
      formData.append('carreraId', documentoData.carreraId.toString());
      formData.append('sedeId', documentoData.sedeId.toString());

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: responseData.message || `Error ${response.status}: ${response.statusText}`,
          errors: responseData.errors || {},
        };
      }

      return {
        success: true,
        data: responseData.documento,
        message: responseData.message || 'Documento creado exitosamente',
      };

    } catch (error) {
      console.error('Error creating documento:', error);
      return {
        success: false,
        message: 'Error de conexión al crear el documento',
        errors: { general: ['Error de conexión'] },
      };
    }
  }

  /**
   * Actualizar un documento existente
   */
  static async actualizarDocumento(id: number, documentoData: UpdateDocumentoData): Promise<ApiResponse<Documento>> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentoData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: responseData.message || `Error ${response.status}: ${response.statusText}`,
          errors: responseData.errors || {},
        };
      }

      return {
        success: true,
        data: responseData.documento,
        message: responseData.message || 'Documento actualizado exitosamente',
      };

    } catch (error) {
      console.error('Error updating documento:', error);
      return {
        success: false,
        message: 'Error de conexión al actualizar el documento',
        errors: { general: ['Error de conexión'] },
      };
    }
  }

  /**
   * Reemplazar el archivo de un documento
   */
  static async reemplazarArchivo(id: number, archivo: File): Promise<ApiResponse<Documento>> {
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);

      const response = await fetch(`${this.BASE_URL}/${id}/archivo`, {
        method: 'PUT',
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: responseData.message || `Error ${response.status}: ${response.statusText}`,
          errors: responseData.errors || {},
        };
      }

      return {
        success: true,
        data: responseData.documento,
        message: responseData.message || 'Archivo reemplazado exitosamente',
      };

    } catch (error) {
      console.error('Error replacing file:', error);
      return {
        success: false,
        message: 'Error de conexión al reemplazar el archivo',
        errors: { general: ['Error de conexión'] },
      };
    }
  }

  /**
   * Eliminar un documento
   */
  static async eliminarDocumento(id: number): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `Error ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Documento eliminado exitosamente',
      };

    } catch (error) {
      console.error('Error deleting documento:', error);
      return {
        success: false,
        message: 'Error de conexión al eliminar el documento',
      };
    }
  }

  /**
   * Descargar un documento
   */
  static async descargarDocumento(id: number): Promise<ApiResponse<Blob>> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}/download`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `Error ${response.status}: ${response.statusText}`,
        };
      }

      const blob = await response.blob();
      return {
        success: true,
        data: blob,
        message: 'Documento descargado exitosamente',
      };

    } catch (error) {
      console.error('Error downloading documento:', error);
      return {
        success: false,
        message: 'Error de conexión al descargar el documento',
      };
    }
  }

  /**
   * Obtener documentos filtrados
   */
  static async obtenerDocumentosFiltrados(filtros: {
    categoria?: string;
    carrera_id?: number;
    sede_id?: number;
    search?: string;
  }): Promise<ApiResponse<Documento[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.carrera_id) params.append('carrera_id', filtros.carrera_id.toString());
      if (filtros.sede_id) params.append('sede_id', filtros.sede_id.toString());
      if (filtros.search) params.append('search', filtros.search);

      const url = `${this.BASE_URL}?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `Error ${response.status}: ${response.statusText}`,
          data: [],
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.documentos || [],
        message: 'Documentos filtrados obtenidos exitosamente',
      };

    } catch (error) {
      console.error('Error fetching filtered documentos:', error);
      return {
        success: false,
        message: 'Error de conexión al obtener documentos filtrados',
        data: [],
      };
    }
  }
}
