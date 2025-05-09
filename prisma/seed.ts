// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Import bcryptjs

const prisma = new PrismaClient();

const SALT_ROUNDS = 10; // Define salt rounds, consistent with auth.ts if possible or manage centrally

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  // 1. Crear roles
  await prisma.rol.createMany({
    data: [
      { nombre: 'SA' },
      { nombre: 'Alumno' },
      { nombre: 'Docente' },
      { nombre: 'Empleador' },
      { nombre: 'Coordinador' },
      { nombre: 'DirectorCarrera' },
    ],
    skipDuplicates: true,
  });

  // 2. Crear sede
  const sede = await prisma.sede.create({
    data: {
      nombre: 'Sede Valparaíso',
      direccion: 'Av. Ejemplo 123',
      estado: 'ACTIVO',
    },
  });

  // 3. Crear carrera ligada a la sede
  const carrera = await prisma.carrera.create({
    data: {
      nombre: 'Ingeniería Informática',
      horasPracticaLaboral: 180,
      horasPracticaProfesional: 360,
      estado: 'ACTIVO',
      sede: { connect: { id: sede.id } },
    },
  });

  // 4. Crear usuario + Alumno
  const hashedPasswordAlumno = await hashPassword('clave123');
  const usuarioAlumno = await prisma.usuario.create({
    data: {
      rut: '11111111-1',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@example.com',
      password: hashedPasswordAlumno, // Use hashed password
      claveInicialVisible: true,
      estado: 'ACTIVO',
      rol:    { connect: { nombre: 'Alumno' } },
      sede:   { connect: { id: sede.id } },
    },
  });

  const alumno = await prisma.alumno.create({
    data: {
      usuario: { connect: { id: usuarioAlumno.id } },
      carrera: { connect: { id: carrera.id } },
    },
  });

  // 5. Crear usuario + Docente
  const hashedPasswordDocente = await hashPassword('clave123');
  const usuarioDocente = await prisma.usuario.create({
    data: {
      rut: '22222222-2',
      nombre: 'Ana',
      apellido: 'Soto',
      email: 'ana.soto@example.com',
      password: hashedPasswordDocente, // Use hashed password
      claveInicialVisible: true,
      estado: 'ACTIVO',
      rol:    { connect: { nombre: 'Docente' } },
      sede:   { connect: { id: sede.id } },
    },
  });

  const docente = await prisma.docente.create({
    data: {
      usuario: { connect: { id: usuarioDocente.id } },
    },
  });

  // 6. Crear centro de práctica y empleador + relación
  const centro = await prisma.centroPractica.create({
    data: {
      nombreEmpresa: 'Empresa Ejemplo S.A.',
      giro:          'Tecnología',
      direccion:     'Calle Falsa 456',
    },
  });

  const hashedPasswordEmpleador = await hashPassword('clave123');
  const usuarioEmpleador = await prisma.usuario.create({
    data: {
      rut: '33333333-3',
      nombre: 'Carlos',
      apellido: 'Gómez',
      email: 'carlos.gomez@example.com',
      password: hashedPasswordEmpleador, // Use hashed password
      claveInicialVisible: true,
      estado: 'ACTIVO',
      rol:    { connect: { nombre: 'Empleador' } },
      sede:   { connect: { id: sede.id } },
    },
  });

  const empleador = await prisma.empleador.create({
    data: {
      usuario: { connect: { id: usuarioEmpleador.id } },
    },
  });

  await prisma.empleadorCentro.create({
    data: {
      empleador:      { connect: { id: empleador.id } },
      centroPractica: { connect: { id: centro.id } },
    },
  });

  // 7. Crear práctica vinculando alumno, docente, carrera y centro
  await prisma.practica.create({
    data: {
      alumno:           { connect: { id: alumno.id } },
      docente:          { connect: { id: docente.id } },
      carrera:          { connect: { id: carrera.id } },
      centroPractica:   { connect: { id: centro.id } },
      tipo:             'PROFESIONAL',
      fechaInicio:      new Date(),
      fechaTermino:     new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // +30 días
      estado:           'PENDIENTE',
      informeUrl:       null,
    },
  });

  console.log('✅ Seeding completado correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
