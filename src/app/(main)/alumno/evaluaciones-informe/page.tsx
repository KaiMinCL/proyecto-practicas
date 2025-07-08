import { Metadata } from 'next';
import { FileText, Star } from 'lucide-react';
import { EvaluacionesInformeClient } from './evaluaciones-informe-client';

export const metadata: Metadata = {
  title: 'Evaluaciones de Informe | Alumno',
  description: 'Consulta las evaluaciones de informe realizadas por los docentes',
};

export default function EvaluacionesInformePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl shadow-lg mb-4">
          <div className="relative">
            <FileText className="w-8 h-8 text-blue-600" />
            <Star className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1 fill-current" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Evaluaciones de Informe
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Consulta y revisa las evaluaciones de informe realizadas por los docentes tutores. 
          Aquí podrás ver las calificaciones, comentarios y retroalimentación de tus informes de práctica.
        </p>
      </header>
      
      <EvaluacionesInformeClient />
    </div>
  );
}
