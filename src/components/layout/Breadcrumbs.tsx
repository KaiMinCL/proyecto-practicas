'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  admin: 'Administración',
  coordinador: 'Coordinador',
  docente: 'Docente',
  alumno: 'Alumno',
  empleador: 'Empleador',
  perfil: 'Mi Perfil',
  usuarios: 'Usuarios',
  carreras: 'Carreras',
  reportes: 'Reportes',
  alumnos: 'Alumnos',
  empleadores: 'Empleadores',
  practicas: 'Prácticas',
  documentos: 'Documentos',
  estudiantes: 'Estudiantes',
  evaluaciones: 'Evaluaciones',
  visitas: 'Visitas',
  'mis-practicas': 'Mis Prácticas',
  'evaluaciones-empleador': 'Evaluaciones Empleador',
  'subir-informe': 'Subir Informe',
  iniciar: 'Iniciar Práctica',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  
  const segments = pathname.split('/').filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/dashboard' }
  ];

  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    // No crear enlace para el último segmento (página actual)
    const isLast = index === segments.length - 1;
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath
    });
  });

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground" aria-label="Breadcrumbs">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0" />
          )}
          
          {index === 0 ? (
            <Link
              href={breadcrumb.href || '/dashboard'}
              className="flex items-center hover:text-primary transition-colors"
            >
              <Home className="w-4 h-4 mr-1" />
              {breadcrumb.label}
            </Link>
          ) : breadcrumb.href ? (
            <Link
              href={breadcrumb.href}
              className="hover:text-primary transition-colors"
            >
              {breadcrumb.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">
              {breadcrumb.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
