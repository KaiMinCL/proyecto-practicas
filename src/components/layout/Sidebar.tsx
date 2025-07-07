'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Users, 
  FileText, 
  Settings, 
  BookOpen, 
  Calendar, 
  Building, 
  UserCheck,
  BarChart3,
  GraduationCap,
  Briefcase,
  Star,
  ClipboardList,
  Upload
} from 'lucide-react';
import type { UserJwtPayload } from '@/lib/auth-utils';

interface SidebarProps {
  user: UserJwtPayload;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  roles?: string[];
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  // Admin routes (Super Admin only)
  {
    title: 'Gestión de Usuarios',
    href: '/admin/usuarios',
    icon: Users,
    roles: ['SUPER_ADMIN'],
  },
  {
    title: 'Gestión de Sedes',
    href: '/admin/sedes',
    icon: Building,
    roles: ['SUPER_ADMIN'],
  },
  {
    title: 'Gestión de Carreras',
    href: '/admin/carreras',
    icon: GraduationCap,
    roles: ['SUPER_ADMIN'],
  },
  {
    title: 'Configuraciones',
    href: '/admin/configuraciones/evaluaciones',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'DIRECTOR_CARRERA'],
  },
  {
    title: 'Reportes',
    href: '/admin/reportes',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'DIRECTOR_CARRERA'],
  },
  // Coordinador routes
  {
    title: 'Gestión de Alumnos',
    href: '/coordinador/alumnos',
    icon: Users,
    roles: ['COORDINADOR'],
  },
  {
    title: 'Gestión de Empleadores',
    href: '/coordinador/empleadores',
    icon: Building,
    roles: ['COORDINADOR'],
  },
  {
    title: 'Iniciar Práctica',
    href: '/coordinador/practicas/iniciar',
    icon: FileText,
    roles: ['COORDINADOR'],
  },
  {
    title: 'Documentos',
    href: '/coordinador/documentos',
    icon: ClipboardList,
    roles: ['COORDINADOR'],
  },
  // Docente routes
  {
    title: 'Mis Estudiantes',
    href: '/docente/estudiantes',
    icon: Users,
    roles: ['DOCENTE'],
  },
  {
    title: 'Evaluaciones',
    href: '/docente/evaluaciones',
    icon: Star,
    roles: ['DOCENTE'],
  },
  {
    title: 'Visitas',
    href: '/docente/visitas',
    icon: Calendar,
    roles: ['DOCENTE'],
  },
  // Alumno routes
  {
    title: 'Mis Prácticas',
    href: '/alumno/mis-practicas',
    icon: BookOpen,
    roles: ['ALUMNO'],
  },
  {
    title: 'Subir Informe',
    href: '/alumno/subir-informe',
    icon: Upload,
    roles: ['ALUMNO'],
  },
  {
    title: 'Evaluaciones Empleador',
    href: '/alumno/evaluaciones-empleador',
    icon: Star,
    roles: ['ALUMNO'],
  },
  // Docente/Alumno shared routes
  {
    title: 'Documentos',
    href: '/coordinador/documentos',
    icon: ClipboardList,
    roles: ['DOCENTE', 'ALUMNO'],
  },
  // Empleador routes
  {
    title: 'Mis Estudiantes',
    href: '/empleador/estudiantes',
    icon: Users,
    roles: ['EMPLEADOR'],
  },
  {
    title: 'Evaluaciones',
    href: '/empleador/evaluaciones',
    icon: UserCheck,
    roles: ['EMPLEADOR'],
  },
  // Shared routes
  {
    title: 'Mi Perfil',
    href: '/perfil',
    icon: Settings,
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(user.rol)
  );

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Portal Prácticas</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.rol}</p>
          </div>
        </div>
      </div>
      
      <nav className="px-4 pb-4">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
