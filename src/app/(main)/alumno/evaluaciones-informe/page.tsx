import { Metadata } from 'next';
import { EvaluacionesInformeClient } from './evaluaciones-informe-client';

export const metadata: Metadata = {
  title: 'Evaluaciones de Informe | Alumno',
  description: 'Consulta las evaluaciones de informe realizadas por los docentes',
};

export default function EvaluacionesInformePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Evaluaciones de Informe
        </h1>
        <p className="text-gray-600">
          Consulta las evaluaciones de informe realizadas por los docentes tutores
        </p>
      </div>
      
      <EvaluacionesInformeClient />
    </div>
  );
}
