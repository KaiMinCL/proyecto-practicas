import { Metadata } from 'next';
import { verifyUserSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReportesGeneralesClient } from './reportes-generales-client';

export const metadata: Metadata = {
  title: 'Reportes Generales | Portal Prácticas',
  description: 'Reportes gráficos y tabulares para análisis y toma de decisiones sobre prácticas.',
};

export default async function ReportesGeneralesPage() {
  // Verificar autenticación
  const user = await verifyUserSession();
  if (!user) {
    redirect('/login');
  }

  // Verificar permisos - SA, DC y COORDINADOR
  if (!['SUPER_ADMIN', 'DIRECTOR_CARRERA', 'COORDINADOR'].includes(user.rol)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark">
            Reportes Generales
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground-dark mt-2">
            Análisis gráfico y tabular para la toma de decisiones sobre prácticas profesionales.
          </p>
        </div>
      </div>

      <ReportesGeneralesClient />
    </div>
  );
}
