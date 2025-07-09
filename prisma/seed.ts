import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Datos de prueba para poblar completamente el sistema
const SEDES_DATA = [
  { nombre: 'Sede Valparaíso', direccion: 'Av. Brasil 2950, Valparaíso' },
  { nombre: 'Sede Viña del Mar', direccion: 'Av. Libertad 1348, Viña del Mar' },
  { nombre: 'Sede Santiago', direccion: 'Av. Providencia 1208, Santiago' },
];

const CARRERAS_DATA = [
  { nombre: 'Ingeniería Informática', horasPracticaLaboral: 180, horasPracticaProfesional: 360 },
  { nombre: 'Ingeniería Comercial', horasPracticaLaboral: 160, horasPracticaProfesional: 320 },
  { nombre: 'Técnico en Computación', horasPracticaLaboral: 120, horasPracticaProfesional: 240 },
  { nombre: 'Administración de Empresas', horasPracticaLaboral: 140, horasPracticaProfesional: 280 },
];

const CENTROS_PRACTICA_DATA = [
  {
    nombreEmpresa: 'TechCorp S.A.',
    giro: 'Desarrollo de Software',
    direccion: 'Av. Las Condes 12345, Santiago',
    telefono: '+56-2-2345-6789',
    emailGerente: 'gerente@techcorp.cl'
  },
  {
    nombreEmpresa: 'Consultora Digital Ltda.',
    giro: 'Consultoría TI',
    direccion: 'Calle Nueva 456, Valparaíso',
    telefono: '+56-32-234-5678',
    emailGerente: 'director@consultora.cl'
  },
  {
    nombreEmpresa: 'Innovación Corp',
    giro: 'Innovación Tecnológica',
    direccion: 'Av. Libertad 789, Viña del Mar',
    telefono: '+56-32-345-6789',
    emailGerente: 'gerencia@innovacion.cl'
  },
  {
    nombreEmpresa: 'StartupTech',
    giro: 'Tecnología Emergente',
    direccion: 'Providencia 321, Santiago',
    telefono: '+56-2-3456-7890',
    emailGerente: 'ceo@startuptech.cl'
  },
];

const USUARIOS_TEST_DATA = [
  // Super Admin
  {
    rut: '10000000-0',
    nombre: 'Admin',
    apellido: 'Sistema',
    email: 'admin@sistema.cl',
    rol: 'SA',
    sede: 0, // Sede Valparaíso
  },
  // Directores de Carrera
  {
    rut: '11000000-1',
    nombre: 'María',
    apellido: 'González',
    email: 'maria.gonzalez@instituto.cl',
    rol: 'DirectorCarrera',
    sede: 0, // Sede Valparaíso
  },
  {
    rut: '11000000-2',
    nombre: 'Pedro',
    apellido: 'Silva',
    email: 'pedro.silva@instituto.cl',
    rol: 'DirectorCarrera',
    sede: 1, // Sede Viña del Mar
  },
  // Coordinadores
  {
    rut: '12000000-1',
    nombre: 'Ana',
    apellido: 'Martínez',
    email: 'ana.martinez@instituto.cl',
    rol: 'Coordinador',
    sede: 0, // Sede Valparaíso
  },
  {
    rut: '12000000-2',
    nombre: 'Carlos',
    apellido: 'López',
    email: 'carlos.lopez@instituto.cl',
    rol: 'Coordinador',
    sede: 1, // Sede Viña del Mar
  },
  {
    rut: '12000000-3',
    nombre: 'Carmen',
    apellido: 'Rojas',
    email: 'carmen.rojas@instituto.cl',
    rol: 'Coordinador',
    sede: 2, // Sede Santiago
  },
  // Docentes
  {
    rut: '13000000-1',
    nombre: 'Roberto',
    apellido: 'Fernández',
    email: 'roberto.fernandez@instituto.cl',
    rol: 'Docente',
    sede: 0,
  },
  {
    rut: '13000000-2',
    nombre: 'Isabel',
    apellido: 'Castro',
    email: 'isabel.castro@instituto.cl',
    rol: 'Docente',
    sede: 0,
  },
  {
    rut: '13000000-3',
    nombre: 'Jorge',
    apellido: 'Muñoz',
    email: 'jorge.munoz@instituto.cl',
    rol: 'Docente',
    sede: 1,
  },
  {
    rut: '13000000-4',
    nombre: 'Lucía',
    apellido: 'Vargas',
    email: 'lucia.vargas@instituto.cl',
    rol: 'Docente',
    sede: 2,
  },
  // Alumnos
  {
    rut: '20000000-1',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@estudiante.cl',
    rol: 'Alumno',
    sede: 0,
    carrera: 0, // Ingeniería Informática
  },
  {
    rut: '20000000-2',
    nombre: 'María',
    apellido: 'Soto',
    email: 'maria.soto@estudiante.cl',
    rol: 'Alumno',
    sede: 0,
    carrera: 0,
  },
  {
    rut: '20000000-3',
    nombre: 'Diego',
    apellido: 'Herrera',
    email: 'diego.herrera@estudiante.cl',
    rol: 'Alumno',
    sede: 1,
    carrera: 1, // Ingeniería Comercial
  },
  {
    rut: '20000000-4',
    nombre: 'Sofía',
    apellido: 'Morales',
    email: 'sofia.morales@estudiante.cl',
    rol: 'Alumno',
    sede: 1,
    carrera: 2, // Técnico en Computación
  },
  {
    rut: '20000000-5',
    nombre: 'Andrés',
    apellido: 'Rivera',
    email: 'andres.rivera@estudiante.cl',
    rol: 'Alumno',
    sede: 2,
    carrera: 3, // Administración de Empresas
  },
  {
    rut: '20000000-6',
    nombre: 'Valentina',
    apellido: 'Torres',
    email: 'valentina.torres@estudiante.cl',
    rol: 'Alumno',
    sede: 0,
    carrera: 0,
  },
  // Empleadores
  {
    rut: '30000000-1',
    nombre: 'Ricardo',
    apellido: 'Mendoza',
    email: 'ricardo.mendoza@techcorp.cl',
    rol: 'Empleador',
    sede: 0,
    empresa: 0, // TechCorp S.A.
  },
  {
    rut: '30000000-2',
    nombre: 'Patricia',
    apellido: 'Reyes',
    email: 'patricia.reyes@consultora.cl',
    rol: 'Empleador',
    sede: 0,
    empresa: 1, // Consultora Digital Ltda.
  },
  {
    rut: '30000000-3',
    nombre: 'Fernando',
    apellido: 'Vega',
    email: 'fernando.vega@innovacion.cl',
    rol: 'Empleador',
    sede: 1,
    empresa: 2, // Innovación Corp
  },
  {
    rut: '30000000-4',
    nombre: 'Gabriela',
    apellido: 'Campos',
    email: 'gabriela.campos@startuptech.cl',
    rol: 'Empleador',
    sede: 2,
    empresa: 3, // StartupTech
  },
];

const DOCUMENTOS_APOYO_DATA = [
  {
    nombre: 'Manual de Prácticas Profesionales',
    url: 'https://ejemplo.com/manual-practicas-profesionales.pdf',
    tipo: 'general', // Para todas las carreras
  },
  {
    nombre: 'Formato Informe Técnico',
    url: 'https://ejemplo.com/formato-informe-tecnico.pdf',
    tipo: 'carrera',
    carrera: 0, // Ingeniería Informática
  },
  {
    nombre: 'Guía de Evaluación Empleador',
    url: 'https://ejemplo.com/guia-evaluacion-empleador.pdf',
    tipo: 'sede',
    sede: 0, // Sede Valparaíso
  },
];

async function main() {
  // 1. Crear roles
  const rolesData = [
    { nombre: 'SUPER_ADMIN' },
    { nombre: 'ALUMNO' },
    { nombre: 'DOCENTE' },
    { nombre: 'EMPLEADOR' },
    { nombre: 'COORDINADOR' },
    { nombre: 'DIRECTOR_CARRERA' },
  ];
  for (const rolData of rolesData) {
    await prisma.rol.upsert({
      where: { nombre: rolData.nombre },
      update: {},
      create: rolData,
    });
  }
  console.log('Roles creados/actualizados.');

  // 2. Crear o actualizar sede
  const sede = await prisma.sede.upsert({
    where: { nombre: 'Sede Valparaíso' },
    update: {
      direccion: 'Av. Ejemplo 123',
      estado: 'ACTIVO',
    },
    create: {
      nombre: 'Sede Valparaíso',
      direccion: 'Av. Ejemplo 123',
      estado: 'ACTIVO', 
    },
  });
  console.log('Sede creada/actualizada:', sede.nombre);

  // 3. Crear o actualizar carrera ligada a la sede
  const carrera = await prisma.carrera.upsert({
    where: { nombre_sedeId: { nombre: 'Ingeniería Informática', sedeId: sede.id } },
    update: {
      horasPracticaLaboral: 180,
      horasPracticaProfesional: 360,
      estado: 'ACTIVO', // Usar string directamente
    },
    create: {
      nombre: 'Ingeniería Informática',
      horasPracticaLaboral: 180,
      horasPracticaProfesional: 360,
      estado: 'ACTIVO', // Usar string directamente
      sede: { connect: { id: sede.id } },
    },
  });
  console.log('Carrera creada/actualizada:', carrera.nombre);

  // 4. Crear usuario + Alumno
  const hashedPasswordAlumno = await hashPassword('clave123');
  const usuarioAlumno = await prisma.usuario.upsert({
    where: { rut: '11111111-1' },
    update: {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@example.com',
      password: hashedPasswordAlumno,
      claveInicialVisible: true,
      estado: 'ACTIVO',
      rol: { connect: { nombre: 'Alumno' } },
      sede: { connect: { id: sede.id } },
    },
    create: {
      rut: '11111111-1',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@example.com',
      password: hashedPasswordAlumno,
      claveInicialVisible: true,
      estado: 'ACTIVO', 
      rol: { connect: { nombre: 'Alumno' } },
      sede: { connect: { id: sede.id } },
    },
  });
  console.log('Usuario Alumno creado/actualizado:', usuarioAlumno.rut);

  const alumno = await prisma.alumno.upsert({
    where: { usuarioId: usuarioAlumno.id },
    update: {
      carrera: { connect: { id: carrera.id } },
    },
    create: {
      usuario: { connect: { id: usuarioAlumno.id } },
      carrera: { connect: { id: carrera.id } },
    },
  });
  console.log('Alumno creado/actualizado para usuario:', usuarioAlumno.rut);

  // 5. Crear usuario + Docente
  const hashedPasswordDocente = await hashPassword('clave123');
  const usuarioDocente = await prisma.usuario.upsert({
    where: { rut: '22222222-2' },
    update: {
      nombre: 'Ana',
      apellido: 'Soto',
      email: 'ana.soto@example.com',
      password: hashedPasswordDocente,
      claveInicialVisible: true,
      estado: 'ACTIVO',
      rol: { connect: { nombre: 'Docente' } },
      sede: { connect: { id: sede.id } },
    },
    create: {
      rut: '22222222-2',
      nombre: 'Ana',
      apellido: 'Soto',
      email: 'ana.soto@example.com',
      password: hashedPasswordDocente,
      claveInicialVisible: true,
      estado: 'ACTIVO',
      rol: { connect: { nombre: 'Docente' } },
      sede: { connect: { id: sede.id } },
    },
  });
  console.log('Usuario Docente creado/actualizado:', usuarioDocente.rut);

  const docente = await prisma.docente.upsert({
    where: { usuarioId: usuarioDocente.id },
    update: {},
    create: {
      usuario: { connect: { id: usuarioDocente.id } },
    },
  });
  console.log('Docente creado/actualizado para usuario:', usuarioDocente.rut);

  // 6. Crear centro de práctica y empleador + relación
  let centro = await prisma.centroPractica.findFirst({
    where: { nombreEmpresa: 'Empresa Ejemplo S.A.' },
  });

  if (!centro) {
    centro = await prisma.centroPractica.create({
      data: {
        nombreEmpresa: 'Empresa Ejemplo S.A.',
        giro: 'Tecnología',
        direccion: 'Calle Falsa 456',
      },
    });
    console.log('Centro de Práctica creado:', centro.nombreEmpresa);
  } else {
    console.log('Centro de Práctica encontrado:', centro.nombreEmpresa);
  }

  const hashedPasswordEmpleador = await hashPassword('clave123');
  const usuarioEmpleador = await prisma.usuario.upsert({
    where: { rut: '33333333-3' },
    update: {
      nombre: 'Carlos',
      apellido: 'Gómez',
      email: 'carlos.gomez@example.com',
      password: hashedPasswordEmpleador,
      claveInicialVisible: true,
      estado: 'ACTIVO',
      rol: { connect: { nombre: 'Empleador' } },
      sede: { connect: { id: sede.id } },
    },
    create: {
      rut: '33333333-3',
      nombre: 'Carlos',
      apellido: 'Gómez',
      email: 'carlos.gomez@example.com',
      password: hashedPasswordEmpleador,
      claveInicialVisible: true,
      estado: 'ACTIVO', // Usar string directamente
      rol: { connect: { nombre: 'Empleador' } },
      sede: { connect: { id: sede.id } },
    },
  });
  console.log('Usuario Empleador creado/actualizado:', usuarioEmpleador.rut);

  const empleador = await prisma.empleador.upsert({
    where: { usuarioId: usuarioEmpleador.id },
    update: {},
    create: {
      usuario: { connect: { id: usuarioEmpleador.id } },
    },
  });
  console.log('Empleador creado/actualizado para usuario:', usuarioEmpleador.rut);

  await prisma.empleadorCentro.upsert({
    where: { empleadorId_centroPracticaId: { empleadorId: empleador.id, centroPracticaId: centro.id } },
    update: {},
    create: {
      empleador: { connect: { id: empleador.id } },
      centroPractica: { connect: { id: centro.id } },
    },
  });
  console.log('Relación EmpleadorCentro creada/actualizada.');

  // 7. Crear múltiples sedes, carreras y usuarios adicionales
  const sedeStgo = await prisma.sede.upsert({
    where: { nombre: 'Sede Santiago' },
    update: {},
    create: {
      nombre: 'Sede Santiago',
      direccion: 'Av. Providencia 789',
      estado: 'ACTIVO',
    },
  });

  const carreraIng = await prisma.carrera.upsert({
    where: { nombre_sedeId: { nombre: 'Ingeniería Civil Industrial', sedeId: sedeStgo.id } },
    update: {},
    create: {
      nombre: 'Ingeniería Civil Industrial',
      horasPracticaLaboral: 200,
      horasPracticaProfesional: 400,
      estado: 'ACTIVO',
      sede: { connect: { id: sedeStgo.id } },
    },
  });

  // 8. Crear más usuarios de diferentes roles
  const hashedPasswordSA = await hashPassword('admin123');
  const usuarioSA = await prisma.usuario.upsert({
    where: { rut: '12345678-9' },
    update: {},
    create: {
      rut: '12345678-9',
      nombre: 'Super',
      apellido: 'Admin',
      email: 'admin@example.com',
      password: hashedPasswordSA,
      claveInicialVisible: false,
      estado: 'ACTIVO',
      rol: { connect: { nombre: 'SA' } },
      sede: { connect: { id: sede.id } },
    },
  });

  const hashedPasswordCoord = await hashPassword('clave123');
  const usuarioCoord = await prisma.usuario.upsert({
    where: { rut: '44444444-4' },
    update: {},
    create: {
      rut: '44444444-4',
      nombre: 'María',
      apellido: 'Coordinadora',
      email: 'coordinadora@example.com',
      password: hashedPasswordCoord,
      claveInicialVisible: true,
      estado: 'ACTIVO',
      rol: { connect: { nombre: 'Coordinador' } },
      sede: { connect: { id: sede.id } },
    },
  });

  const hashedPasswordDir = await hashPassword('clave123');
  const usuarioDir = await prisma.usuario.upsert({
    where: { rut: '55555555-5' },
    update: {},
    create: {
      rut: '55555555-5',
      nombre: 'Pedro',
      apellido: 'Director',
      email: 'director@example.com',
      password: hashedPasswordDir,
      claveInicialVisible: true,
      estado: 'ACTIVO',
      rol: { connect: { nombre: 'DirectorCarrera' } },
      sede: { connect: { id: sede.id } },
    },
  });

  // 9. Crear más alumnos
  const hashedPasswordAlumno2 = await hashPassword('clave123');
  const usuarioAlumno2 = await prisma.usuario.upsert({
    where: { rut: '66666666-6' },
    update: {},
    create: {
      rut: '66666666-6',
      nombre: 'José',
      apellido: 'Estudiante',
      email: 'jose.estudiante@example.com',
      password: hashedPasswordAlumno2,
      claveInicialVisible: true,
      estado: 'ACTIVO',
      rol: { connect: { nombre: 'Alumno' } },
      sede: { connect: { id: sedeStgo.id } },
    },
  });

  const alumno2 = await prisma.alumno.upsert({
    where: { usuarioId: usuarioAlumno2.id },
    update: {},
    create: {
      usuario: { connect: { id: usuarioAlumno2.id } },
      carrera: { connect: { id: carreraIng.id } },
    },
  });

  const hashedPasswordAlumno3 = await hashPassword('clave123');
  const usuarioAlumno3 = await prisma.usuario.upsert({
    where: { rut: '77777777-7' },
    update: {},
    create: {
      rut: '77777777-7',
      nombre: 'Laura',
      apellido: 'Estudiante',
      email: 'laura.estudiante@example.com',
      password: hashedPasswordAlumno3,
      claveInicialVisible: true,
      estado: 'INACTIVO', // Usuario inactivo para pruebas
      rol: { connect: { nombre: 'Alumno' } },
      sede: { connect: { id: sede.id } },
    },
  });

  const alumno3 = await prisma.alumno.upsert({
    where: { usuarioId: usuarioAlumno3.id },
    update: {},
    create: {
      usuario: { connect: { id: usuarioAlumno3.id } },
      carrera: { connect: { id: carrera.id } },
    },
  });

  // 10. Crear más docentes
  const hashedPasswordDocente2 = await hashPassword('clave123');
  const usuarioDocente2 = await prisma.usuario.upsert({
    where: { rut: '88888888-8' },
    update: {},
    create: {
      rut: '88888888-8',
      nombre: 'Roberto',
      apellido: 'Profesor',
      email: 'roberto.profesor@example.com',
      password: hashedPasswordDocente2,
      claveInicialVisible: true,
      estado: 'ACTIVO',
      rol: { connect: { nombre: 'Docente' } },
      sede: { connect: { id: sedeStgo.id } },
    },
  });

  const docente2 = await prisma.docente.upsert({
    where: { usuarioId: usuarioDocente2.id },
    update: {},
    create: {
      usuario: { connect: { id: usuarioDocente2.id } },
    },
  });

  // 11. Asociar docentes a carreras
  await prisma.docenteCarrera.upsert({
    where: { docenteId_carreraId: { docenteId: docente.id, carreraId: carrera.id } },
    update: {},
    create: {
      docente: { connect: { id: docente.id } },
      carrera: { connect: { id: carrera.id } },
    },
  });

  await prisma.docenteCarrera.upsert({
    where: { docenteId_carreraId: { docenteId: docente2.id, carreraId: carreraIng.id } },
    update: {},
    create: {
      docente: { connect: { id: docente2.id } },
      carrera: { connect: { id: carreraIng.id } },
    },
  });

  // 12. Crear más centros de práctica
  const centro2 = await prisma.centroPractica.create({
    data: {
      nombreEmpresa: 'TechCorp Ltda.',
      giro: 'Desarrollo de Software',
      direccion: 'Av. Apoquindo 456',
      telefono: '+56-2-2555-0123',
      emailGerente: 'gerente@techcorp.cl',
    },
  });

  const centro3 = await prisma.centroPractica.create({
    data: {
      nombreEmpresa: 'Banco Nacional',
      giro: 'Servicios Financieros',
      direccion: 'Calle Bandera 789',
      telefono: '+56-2-2666-0456',
      emailGerente: 'rh@banco.cl',
    },
  });

  // 13. Crear más empleadores
  const hashedPasswordEmpleador2 = await hashPassword('clave123');
  const usuarioEmpleador2 = await prisma.usuario.upsert({
    where: { rut: '99999999-9' },
    update: {},
    create: {
      rut: '99999999-9',
      nombre: 'Sofía',
      apellido: 'Supervisora',
      email: 'sofia.supervisora@techcorp.cl',
      password: hashedPasswordEmpleador2,
      claveInicialVisible: true,
      estado: 'ACTIVO',
      rol: { connect: { nombre: 'Empleador' } },
      sede: { connect: { id: sedeStgo.id } },
    },
  });

  const empleador2 = await prisma.empleador.upsert({
    where: { usuarioId: usuarioEmpleador2.id },
    update: {},
    create: {
      usuario: { connect: { id: usuarioEmpleador2.id } },
    },
  });

  const hashedPasswordEmpleador3 = await hashPassword('clave123');
  const usuarioEmpleador3 = await prisma.usuario.upsert({
    where: { rut: '10101010-1' },
    update: {},
    create: {
      rut: '10101010-1',
      nombre: 'Miguel',
      apellido: 'Jefe',
      email: 'miguel.jefe@banco.cl',
      password: hashedPasswordEmpleador3,
      claveInicialVisible: true,
      estado: 'ACTIVO',
      rol: { connect: { nombre: 'Empleador' } },
      sede: { connect: { id: sede.id } },
    },
  });

  const empleador3 = await prisma.empleador.upsert({
    where: { usuarioId: usuarioEmpleador3.id },
    update: {},
    create: {
      usuario: { connect: { id: usuarioEmpleador3.id } },
    },
  });

  // 14. Asociar empleadores a centros
  await prisma.empleadorCentro.upsert({
    where: { empleadorId_centroPracticaId: { empleadorId: empleador2.id, centroPracticaId: centro2.id } },
    update: {},
    create: {
      empleador: { connect: { id: empleador2.id } },
      centroPractica: { connect: { id: centro2.id } },
    },
  });

  await prisma.empleadorCentro.upsert({
    where: { empleadorId_centroPracticaId: { empleadorId: empleador3.id, centroPracticaId: centro3.id } },
    update: {},
    create: {
      empleador: { connect: { id: empleador3.id } },
      centroPractica: { connect: { id: centro3.id } },
    },
  });

  // 15. Crear prácticas en diferentes estados
  const fechaHoy = new Date();
  const fechaInicio = new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 30); // 30 días atrás
  const fechaTermino = new Date(fechaHoy.getTime() + 1000 * 60 * 60 * 24 * 30); // 30 días adelante
  const fechaTerminoAnterior = new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 10); // 10 días atrás

  // Limpiar prácticas existentes para evitar duplicados
  await prisma.practica.deleteMany({});

  // Práctica 1: PENDIENTE (Juan Pérez)
  const practica1 = await prisma.practica.create({
    data: {
      alumno: { connect: { id: alumno.id } },
      docente: { connect: { id: docente.id } },
      carrera: { connect: { id: carrera.id } },
      centroPractica: { connect: { id: centro.id } },
      tipo: 'PROFESIONAL',
      fechaInicio: fechaInicio,
      fechaTermino: fechaTermino,
      estado: 'PENDIENTE',
    },
  });

  // Práctica 2: PENDIENTE_ACEPTACION_DOCENTE (José Estudiante)
  const practica2 = await prisma.practica.create({
    data: {
      alumno: { connect: { id: alumno2.id } },
      docente: { connect: { id: docente2.id } },
      carrera: { connect: { id: carreraIng.id } },
      centroPractica: { connect: { id: centro2.id } },
      tipo: 'LABORAL',
      fechaInicio: fechaInicio,
      fechaTermino: fechaTermino,
      estado: 'PENDIENTE_ACEPTACION_DOCENTE',
      // Datos completados por el alumno
      direccionCentro: 'Av. Apoquindo 456, Las Condes',
      departamento: 'Desarrollo de Software',
      nombreJefeDirecto: 'Sofía Supervisora',
      cargoJefeDirecto: 'Jefe de Desarrollo',
      contactoCorreoJefe: 'sofia.supervisora@techcorp.cl',
      contactoTelefonoJefe: '+56-9-8765-4321',
      practicaDistancia: false,
      tareasPrincipales: 'Desarrollo de aplicaciones web, testing, documentación de código',
      fechaCompletadoAlumno: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 5), // 5 días atrás
    },
  });

  // Práctica 3: EN_CURSO (con práctica sin centro asignado)
  const practica3 = await prisma.practica.create({
    data: {
      alumno: { connect: { id: alumno3.id } },
      docente: { connect: { id: docente.id } },
      carrera: { connect: { id: carrera.id } },
      // Sin centroPractica para probar prácticas independientes
      tipo: 'PROFESIONAL',
      fechaInicio: fechaInicio,
      fechaTermino: fechaTermino,
      estado: 'EN_CURSO',
      direccionCentro: 'Freelance - Trabajo remoto',
      departamento: 'Desarrollo independiente',
      nombreJefeDirecto: 'Cliente directo',
      cargoJefeDirecto: 'Propietario',
      contactoCorreoJefe: 'cliente@independiente.cl',
      contactoTelefonoJefe: '+56-9-1234-5678',
      practicaDistancia: true,
      tareasPrincipales: 'Desarrollo de sitio web corporativo, mantenimiento de sistemas',
      fechaCompletadoAlumno: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 15), // 15 días atrás
    },
  });

  // Práctica 4: FINALIZADA_PENDIENTE_EVAL
  const practica4 = await prisma.practica.create({
    data: {
      alumno: { connect: { id: alumno.id } },
      docente: { connect: { id: docente2.id } },
      carrera: { connect: { id: carrera.id } },
      centroPractica: { connect: { id: centro3.id } },
      tipo: 'LABORAL',
      fechaInicio: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 90), // 90 días atrás
      fechaTermino: fechaTerminoAnterior,
      estado: 'FINALIZADA_PENDIENTE_EVAL',
      direccionCentro: 'Calle Bandera 789, Santiago Centro',
      departamento: 'Tecnologías de la Información',
      nombreJefeDirecto: 'Miguel Jefe',
      cargoJefeDirecto: 'Gerente TI',
      contactoCorreoJefe: 'miguel.jefe@banco.cl',
      contactoTelefonoJefe: '+56-2-2666-0456',
      practicaDistancia: false,
      tareasPrincipales: 'Soporte técnico, mantención de sistemas bancarios, análisis de datos',
      fechaCompletadoAlumno: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 100), // 100 días atrás
      informeUrl: 'https://ejemplo.com/informe-practica-4.pdf',
    },
  });

  // Práctica 5: EVALUACION_COMPLETA
  const practica5 = await prisma.practica.create({
    data: {
      alumno: { connect: { id: alumno2.id } },
      docente: { connect: { id: docente.id } },
      carrera: { connect: { id: carreraIng.id } },
      centroPractica: { connect: { id: centro.id } },
      tipo: 'PROFESIONAL',
      fechaInicio: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 120), // 120 días atrás
      fechaTermino: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 20), // 20 días atrás
      estado: 'EVALUACION_COMPLETA',
      direccionCentro: 'Calle Falsa 456, Valparaíso',
      departamento: 'Desarrollo y Mantención',
      nombreJefeDirecto: 'Carlos Gómez',
      cargoJefeDirecto: 'Supervisor de Desarrollo',
      contactoCorreoJefe: 'carlos.gomez@example.com',
      contactoTelefonoJefe: '+56-9-8888-7777',
      practicaDistancia: false,
      tareasPrincipales: 'Desarrollo de aplicaciones móviles, testing automatizado, documentación técnica',
      fechaCompletadoAlumno: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 130), // 130 días atrás
      informeUrl: 'https://ejemplo.com/informe-practica-5.pdf',
    },
  });

  // Práctica 6: CERRADA
  const practica6 = await prisma.practica.create({
    data: {
      alumno: { connect: { id: alumno3.id } },
      docente: { connect: { id: docente2.id } },
      carrera: { connect: { id: carrera.id } },
      centroPractica: { connect: { id: centro2.id } },
      tipo: 'PROFESIONAL',
      fechaInicio: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 180), // 180 días atrás
      fechaTermino: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 60), // 60 días atrás
      estado: 'CERRADA',
      direccionCentro: 'Av. Apoquindo 456, Las Condes',
      departamento: 'Innovación y Desarrollo',
      nombreJefeDirecto: 'Sofía Supervisora',
      cargoJefeDirecto: 'Líder de Innovación',
      contactoCorreoJefe: 'sofia.supervisora@techcorp.cl',
      contactoTelefonoJefe: '+56-9-8765-4321',
      practicaDistancia: false,
      tareasPrincipales: 'Investigación de nuevas tecnologías, prototipado, análisis de mercado',
      fechaCompletadoAlumno: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 190), // 190 días atrás
      informeUrl: 'https://ejemplo.com/informe-practica-6.pdf',
    },
  });

  // Práctica 7: RECHAZADA_DOCENTE
  const practica7 = await prisma.practica.create({
    data: {
      alumno: { connect: { id: alumno.id } },
      docente: { connect: { id: docente.id } },
      carrera: { connect: { id: carrera.id } },
      centroPractica: { connect: { id: centro3.id } },
      tipo: 'LABORAL',
      fechaInicio: fechaInicio,
      fechaTermino: fechaTermino,
      estado: 'RECHAZADA_DOCENTE',
      direccionCentro: 'Información incompleta',
      departamento: 'No especificado',
      nombreJefeDirecto: 'Sin definir',
      cargoJefeDirecto: 'Sin definir',
      contactoCorreoJefe: 'email@incompleto',
      contactoTelefonoJefe: '123456',
      practicaDistancia: false,
      tareasPrincipales: 'Descripción muy vaga de las tareas',
      fechaCompletadoAlumno: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 2), // 2 días atrás
      motivoRechazoDocente: 'La información proporcionada es insuficiente. Faltan datos de contacto válidos del jefe directo y las tareas principales no están claramente definidas.',
    },
  });

  // Práctica 8: ANULADA
  const practica8 = await prisma.practica.create({
    data: {
      alumno: { connect: { id: alumno2.id } },
      docente: { connect: { id: docente2.id } },
      carrera: { connect: { id: carreraIng.id } },
      centroPractica: { connect: { id: centro.id } },
      tipo: 'LABORAL',
      fechaInicio: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 60), // 60 días atrás
      fechaTermino: fechaTerminoAnterior,
      estado: 'ANULADA',
      direccionCentro: 'Calle Falsa 456, Valparaíso',
      departamento: 'Recursos Humanos',
      nombreJefeDirecto: 'Carlos Gómez',
      cargoJefeDirecto: 'Jefe de RRHH',
      contactoCorreoJefe: 'carlos.gomez@example.com',
      contactoTelefonoJefe: '+56-9-8888-7777',
      practicaDistancia: false,
      tareasPrincipales: 'Gestión de personal, reclutamiento, capacitación',
      fechaCompletadoAlumno: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 70), // 70 días atrás
    },
  });

  // 16. Crear evaluaciones
  // Evaluación docente para práctica 5
  await prisma.evaluacionInformeDocente.upsert({
    where: { practicaId: practica5.id },
    update: {},
    create: {
      practica: { connect: { id: practica5.id } },
      nota: 5.8,
      comentarios: 'Excelente informe técnico. Demuestra dominio de las tecnologías utilizadas y reflexión sobre el aprendizaje.',
      fecha: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 15), // 15 días atrás
    },
  });

  // Evaluación empleador para práctica 5
  await prisma.evaluacionEmpleador.upsert({
    where: { practicaId: practica5.id },
    update: {},
    create: {
      practica: { connect: { id: practica5.id } },
      nota: 6.2,
      comentarios: 'Estudiante muy responsable y proactivo. Cumplió con todas las expectativas y se integró bien al equipo.',
      fecha: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 12), // 12 días atrás
    },
  });

  // Evaluación docente para práctica 6
  await prisma.evaluacionInformeDocente.upsert({
    where: { practicaId: practica6.id },
    update: {},
    create: {
      practica: { connect: { id: practica6.id } },
      nota: 6.5,
      comentarios: 'Informe muy completo y bien estructurado. Excelente análisis de la experiencia práctica.',
      fecha: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 55), // 55 días atrás
    },
  });

  // Evaluación empleador para práctica 6
  await prisma.evaluacionEmpleador.upsert({
    where: { practicaId: practica6.id },
    update: {},
    create: {
      practica: { connect: { id: practica6.id } },
      nota: 6.8,
      comentarios: 'Excepcional desempeño. Aportó ideas innovadoras y demostró gran capacidad de adaptación.',
      fecha: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 52), // 52 días atrás
    },
  });

  // 17. Crear actas finales
  // Acta final para práctica 6
  await prisma.actaFinal.upsert({
    where: { practicaId: practica6.id },
    update: {},
    create: {
      practica: { connect: { id: practica6.id } },
      notaInforme: 6.5,
      notaEmpleador: 6.8,
      notaFinal: 6.7, // Promedio ponderado
      fechaCierre: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 50), // 50 días atrás
      estado: 'CERRADA',
    },
  });

  // 18. Crear configuración de evaluación
  await prisma.configuracionEvaluacion.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      porcentajeInforme: 40,
      porcentajeEmpleador: 60,
    },
  });

  // 19. Crear alertas manuales
  await prisma.alertaManual.createMany({
    data: [
      {
        practicaId: practica2.id,
        asunto: 'Recordatorio: Revisión Pendiente',
        mensaje: 'Recordatorio para revisar y aprobar el Acta 1 de la práctica de José Estudiante.',
        enviadoPor: 'Sistema',
        fecha: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 3), // 3 días atrás
      },
      {
        practicaId: practica4.id,
        asunto: 'Evaluación Pendiente',
        mensaje: 'La práctica ha finalizado. Pendiente evaluación del informe y del empleador.',
        enviadoPor: 'Sistema',
        fecha: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 8), // 8 días atrás
      },
      {
        practicaId: practica1.id,
        asunto: 'Alumno debe completar Acta 1',
        mensaje: 'El alumno Juan Pérez debe completar la información del Acta 1 para continuar con su práctica.',
        enviadoPor: 'Coordinadora',
        fecha: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 1), // 1 día atrás
      },
    ],
    skipDuplicates: true,
  });

  // 20. Crear documentos de apoyo
  await prisma.documentoApoyo.createMany({
    data: [
      {
        nombre: 'Reglamento General de Prácticas',
        url: 'https://ejemplo.com/docs/reglamento-practicas.pdf',
        carreraId: carrera.id,
        sedeId: sede.id,
      },
      {
        nombre: 'Manual del Alumno en Práctica',
        url: 'https://ejemplo.com/docs/manual-alumno.pdf',
        carreraId: carrera.id,
        sedeId: sede.id,
      },
      {
        nombre: 'Guía para Empleadores',
        url: 'https://ejemplo.com/docs/guia-empleadores.pdf',
        carreraId: carreraIng.id,
        sedeId: sedeStgo.id,
      },
      {
        nombre: 'Formato de Informe Final',
        url: 'https://ejemplo.com/docs/formato-informe.docx',
        carreraId: carrera.id,
        sedeId: sede.id,
      },
      {
        nombre: 'Protocolo de Evaluación',
        url: 'https://ejemplo.com/docs/protocolo-evaluacion.pdf',
        sedeId: sede.id, // Documento general para toda la sede
      },
    ],
    skipDuplicates: true,
  });

  // 21. Crear logs de auditoría de ejemplo
  await prisma.logAuditoria.createMany({
    data: [
      {
        accion: 'LOGIN_EXITOSO',
        entidad: 'Usuario',
        entidadId: usuarioAlumno.id.toString(),
        usuarioId: usuarioAlumno.id,
        descripcion: 'Inicio de sesión exitoso',
        metadatos: { userAgent: 'Mozilla/5.0', timestamp: new Date() },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        fecha: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 2), // 2 horas atrás
      },
      {
        accion: 'CREAR_PRACTICA',
        entidad: 'Practica',
        entidadId: practica1.id.toString(),
        usuarioId: usuarioCoord.id,
        descripcion: 'Nueva práctica creada para Juan Pérez',
        detallesNuevos: { tipo: 'PROFESIONAL', estado: 'PENDIENTE' },
        metadatos: { carrera: 'Ingeniería Informática', sede: 'Valparaíso' },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        fecha: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 25), // 25 días atrás
      },
      {
        accion: 'COMPLETAR_ACTA1_ALUMNO',
        entidad: 'Practica',
        entidadId: practica2.id.toString(),
        usuarioId: usuarioAlumno2.id,
        descripcion: 'Alumno José Estudiante completó el Acta 1',
        detallesPrevios: { estado: 'PENDIENTE' },
        detallesNuevos: { estado: 'PENDIENTE_ACEPTACION_DOCENTE' },
        metadatos: { centro: 'TechCorp Ltda.' },
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        fecha: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 5), // 5 días atrás
      },
      {
        accion: 'RECHAZAR_ACTA1_DOCENTE',
        entidad: 'Practica',
        entidadId: practica7.id.toString(),
        usuarioId: usuarioDocente.id,
        descripcion: 'Docente rechazó el Acta 1 por información insuficiente',
        detallesPrevios: { estado: 'PENDIENTE_ACEPTACION_DOCENTE' },
        detallesNuevos: { estado: 'RECHAZADA_DOCENTE' },
        metadatos: { motivo: 'Información insuficiente' },
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        fecha: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 12), // 12 horas atrás
      },
      {
        accion: 'COMPLETAR_EVALUACION_EMPLEADOR',
        entidad: 'EvaluacionEmpleador',
        entidadId: practica5.id.toString(),
        usuarioId: usuarioEmpleador.id,
        descripcion: 'Empleador completó evaluación para José Estudiante',
        detallesNuevos: { nota: 6.2 },
        metadatos: { practica: 'PROFESIONAL' },
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        fecha: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 12), // 12 días atrás
      },
      {
        accion: 'CERRAR_ACTA_FINAL',
        entidad: 'ActaFinal',
        entidadId: practica6.id.toString(),
        usuarioId: usuarioCoord.id,
        descripcion: 'Coordinadora cerró administrativamente el acta final',
        detallesPrevios: { estado: 'VALIDADA' },
        detallesNuevos: { estado: 'CERRADA', notaFinal: 6.7 },
        metadatos: { alumno: 'Laura Estudiante' },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        fecha: new Date(fechaHoy.getTime() - 1000 * 60 * 60 * 24 * 50), // 50 días atrás
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seeding completado correctamente con datos completos para pruebas.');
  console.log('📊 Datos creados:');
  console.log('- 2 Sedes: Valparaíso y Santiago');
  console.log('- 2 Carreras: Ingeniería Informática e Ingeniería Civil Industrial');
  console.log('- 8 Usuarios: SA, Coordinador, Director, 2 Docentes, 3 Alumnos, 3 Empleadores');
  console.log('- 3 Centros de Práctica con empleadores asociados');
  console.log('- 8 Prácticas en diferentes estados (PENDIENTE, PENDIENTE_ACEPTACION_DOCENTE, EN_CURSO, FINALIZADA_PENDIENTE_EVAL, EVALUACION_COMPLETA, CERRADA, RECHAZADA_DOCENTE, ANULADA)');
  console.log('- 4 Evaluaciones (docente y empleador)');
  console.log('- 1 Acta Final');
  console.log('- 3 Alertas Manuales');
  console.log('- 5 Documentos de Apoyo');
  console.log('- 6 Logs de Auditoría');
  console.log('- 1 Configuración de Evaluación');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });