import { obtenerActaFinalAlumno } from '../../../practicas/actions';
import { ActaFinalAlumnoClient } from './acta-final-alumno-client';

export default async function ActaFinalAlumnoPage({
  params,
}: {
  params: Promise<{ practicaId: string }>;
}) {
  const { practicaId } = await params;
  const id = parseInt(practicaId, 10);

  if (isNaN(id)) {
    throw new Error('ID de práctica inválido');
  }

  const actionResponse = await obtenerActaFinalAlumno(id);

  return <ActaFinalAlumnoClient initialActionResponse={actionResponse} />;
}
