'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { Toaster, toast } from 'sonner';
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
  message: undefined,
  errors: {},
  success: false,
};

export default function LoginPage() {
  const router = useRouter(); // Aunque la redirección principal está en la SA
  const [isPending, startTransition] = useTransition();
  const [formState, formAction] = useFormState(loginUser, initialFormState);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      rut: "",
      password: "",
    },
  });

  useEffect(() => {
    if (formState.success) {
      // La redirección ya ocurre en la Server Action.
      console.log("Login exitoso (manejado por Server Action redirect). Mensaje:", formState.message);
    } else if (formState.message || Object.keys(formState.errors || {}).length > 0) {
      // Si hay un mensaje general de error
      if (formState.errors?.general) {
        toast.error(formState.errors.general);
      }
      // Si hay errores específicos de campo, Zod ya los muestra via FormMessage.
      // Si solo hay un mensaje general y no errores de campo específicos
      else if (formState.message && !formState.errors?.general && Object.keys(formState.errors || {}).length === 0) {
         toast.error(formState.message);
      }

      // Establecer errores específicos de campo en React Hook Form para que FormMessage los muestre
      if (formState.errors?.rut) {
        form.setError("rut", { type: "server", message: formState.errors.rut.join(', ') });
      }
      if (formState.errors?.password) {
        form.setError("password", { type: "server", message: formState.errors.password.join(', ') });
      }
    }
  }, [formState, form, router]);

  const onSubmit = (values: LoginFormData) => {
    startTransition(() => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formAction(formData);
    });
  };

  return (
    <> {/* Necesario para Toaster y el div principal */}
      <Toaster richColors position="top-center" /> {/* Añade el Toaster de Sonner */}
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
                      <Input placeholder="12345678-9" {...field} disabled={isPending} />
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
                      <Input type="password" placeholder="********" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* El mensaje de error general del servidor ahora se maneja principalmente con toasts */}
              {formState.message && !formState.success && formState.errors?.general && (
                <div className="text-sm font-medium text-destructive bg-red-100 p-3 rounded-md mt-2">
                  {formState.errors.general}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}