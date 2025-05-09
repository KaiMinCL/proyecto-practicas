'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react'; 

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoginSchema, LoginFormData } from "@/lib/validators";
import { loginUser, LoginFormState } from "./actions"; 


const initialFormState: LoginFormState = {
  message: '',
  errors: {},
  success: false,
};

export default function LoginPage() {
  // const { toast } = useToast(); // Descomentar para Incremento 12
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<LoginFormState>(initialFormState);

  // 1. Define tu formulario.
  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      rut: "",
      password: "",
    },
    // Cargar el estado de error del servidor en el formulario
    // Esto se manejará mejor con useFormState en un paso posterior
  });

  // 2. Define un handler para el submit.
  async function onSubmit(values: LoginFormData) {
    startTransition(async () => {
      const result = await loginUser(undefined, createFormData(values)); // Pasamos undefined como prevState por ahora
      setFormState(result);

      if (result.success) {
        // toast({ title: "Éxito", description: result.message || "Login exitoso." }); // Descomentar para Incremento 12
        console.log("Login exitoso, redirigiendo...");
        // La redirección ahora se maneja dentro de la Server Action
        // Si la Server Action no redirige, puedes hacerlo aquí:
        // router.push(result.redirectTo || '/dashboard');
      } else {
        // toast({ variant: "destructive", title: "Error de Login", description: result.message }); // Descomentar para Incremento 12
        console.error("Error de login:", result.message, result.errors);
        // Si hay errores específicos de campos desde el servidor, RHF no los mostrará automáticamente
        // sin una integración más profunda o usando useActionState (React 19) / useFormState (Next.js)
        if (result.errors?.rut) {
          form.setError("rut", { type: "server", message: result.errors.rut.join(', ') });
        }
        if (result.errors?.password) {
          form.setError("password", { type: "server", message: result.errors.password.join(', ') });
        }
      }
    });
  }

  // Helper para convertir el objeto de valores a FormData
  function createFormData(values: LoginFormData): FormData {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return formData;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white shadow-md rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678-9" {...field} />
                  </FormControl>
                  <FormDescription>
                    Ingresa tu RUT con guion y dígito verificador.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    {/* El tipo password se abordará en el Incremento 8 */}
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mensaje de error general del servidor */}
            {formState.message && !formState.success && formState.errors?.general && (
              <div className="text-sm font-medium text-destructive bg-red-100 p-3 rounded-md">
                {formState.errors.general}
              </div>
            )}
             {/* Mensaje de éxito general del servidor (si no hay redirección inmediata) */}
            {formState.message && formState.success && (
              <div className="text-sm font-medium text-green-700 bg-green-100 p-3 rounded-md">
                {formState.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </Form>
        {/* <Toaster /> */} {/* Descomentar para Incremento 12 */}
      </div>
    </div>
  );
}