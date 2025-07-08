import { Metadata } from 'next';
import { verifyUserSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReporteVolumenPracticasClient } from './reporte-volumen-practicas-client';

export const metadata: Metadata = {
  title: 'Reporte General - Volumen de Prácticas | Portal Prácticas',
  description: 'Reporte gráfico y tabular del volumen de prácticas iniciadas por periodo, sede, escuela y carrera.',
};

export default async function ReporteVolumenPracticasPage() {
  // Verificar autenticación
  const user = await verifyUserSession();
  if (!user) {
    redirect('/login');
  }

  // Verificar permisos - Solo SA y DC
  if (!['SUPER_ADMIN', 'DIRECTOR_CARRERA'].includes(user.rol)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark">
            Reporte General - Volumen de Prácticas
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground-dark mt-2">
            Análisis gráfico y tabular del volumen de prácticas iniciadas por periodo, sede, escuela y carrera.
          </p>
        </div>
      </div>

      <ReporteVolumenPracticasClient user={user} />
    </div>
  );
}
