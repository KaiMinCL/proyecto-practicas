'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useTransition } from 'react';
import { Toaster, toast } from 'sonner';
import { useAuth } from '@/hooks';
import Navbar from '@/components/layout/Navbar';
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
import { LoginFormState, loginUser } from "./(auth)/login/actions";

const initialFormState: LoginFormState = {
  message: undefined,
  errors: {},
  success: false,
};

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formState, formAction] = useActionState(loginUser, initialFormState);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      rut: "",
      password: "",
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (formState.success) {
      // Update context and redirect
      if (formState.tokenPayload) {
        login(formState.tokenPayload);
      }
      if (formState.redirectTo) {
        router.push(formState.redirectTo);
      }
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

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render login form if user is already logged in
  if (user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-1 bg-gradient-to-br from-secondary/20 via-background to-accent/20 flex items-center justify-center p-4">
        <Toaster richColors position="top-center" />
        
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
              <svg 
                className="w-8 h-8 text-primary-foreground" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Portal de Prácticas
            </h1>
            <p className="text-muted-foreground">
              Sistema de Gestión de Prácticas Profesionales
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-card p-8 rounded-2xl shadow-xl border border-border">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="rut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        RUT
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12345678-9"
                          disabled={isPending}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground">
                        Ingresa tu RUT con dígito verificador
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
                      <FormLabel className="text-sm font-medium text-foreground">
                        Contraseña
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          disabled={isPending}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Error Message Display */}
                {formState.message && !formState.success && formState.errors?.general && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-destructive mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-medium text-destructive">
                        {formState.errors.general}
                      </p>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl" 
                  disabled={isPending}
                >
                  {isPending ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Ingresando...
                    </div>
                  ) : (
                    "Ingresar"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
