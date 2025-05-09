import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  // 1. Crear roles
  const rolesData = [
    { nombre: 'SA' },
    { nombre: 'Alumno' },
    { nombre: 'Docente' },
    { nombre: 'Empleador' },
    { nombre: 'Coordinador' },
    { nombre: 'DirectorCarrera' },
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

  // 7. Crear práctica
  const practicaExistente = await prisma.practica.findFirst({
    where: {
      alumnoId: alumno.id,
      docenteId: docente.id,
      carreraId: carrera.id,
      centroPracticaId: centro.id,
      tipo: 'PROFESIONAL',
    }
  });

  if (!practicaExistente) {
    await prisma.practica.create({
      data: {
        alumno: { connect: { id: alumno.id } },
        docente: { connect: { id: docente.id } },
        carrera: { connect: { id: carrera.id } },
        centroPractica: { connect: { id: centro.id } },
        tipo: 'PROFESIONAL', 
        fechaInicio: new Date(),
        fechaTermino: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // +30 días
        estado: 'PENDIENTE',
      },
    });
    console.log('Práctica creada.');
  } else {
    console.log('Práctica ya existe, no se creó una nueva duplicada.');
  }

  console.log('✅ Seeding completado correctamente.');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });