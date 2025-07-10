'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface ConfiguracionEvaluaciones {
  pesoEvaluacionEmpleador: number;
  pesoEvaluacionInforme: number;
  notaMinimaAprobacion: number;
}

interface ConfiguracionEvaluacionDialogProps {
  children: React.ReactNode;
  onConfiguracionChange?: (config: ConfiguracionEvaluaciones) => void;
}

export function ConfiguracionEvaluacionDialog({ 
  children, 
  onConfiguracionChange 
}: ConfiguracionEvaluacionDialogProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ConfiguracionEvaluaciones>({
    pesoEvaluacionEmpleador: 60,
    pesoEvaluacionInforme: 40,
    notaMinimaAprobacion: 4.0
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchConfig();
    }
  }, [open]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/configuracion');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.data);
        onConfiguracionChange?.(data.data);
      } else {
        setError(data.error || 'Error al cargar la configuración');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (config.pesoEvaluacionEmpleador + config.pesoEvaluacionInforme !== 100) {
      setError('La suma de las ponderaciones debe ser 100%');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/configuracion', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Configuración guardada exitosamente');
        onConfiguracionChange?.(config);
        setTimeout(() => {
          setSuccess(null);
          setOpen(false);
        }, 1500);
      } else {
        setError(data.error || 'Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      pesoEvaluacionEmpleador: 60,
      pesoEvaluacionInforme: 40,
      notaMinimaAprobacion: 4.0
    });
    setError(null);
    setSuccess(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración de Evaluaciones
          </DialogTitle>
          <DialogDescription>
            Configure las ponderaciones para el cálculo de notas finales
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Cargando configuración...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pesoEmpleador">Evaluación Empleador (%)</Label>
                  <Input
                    id="pesoEmpleador"
                    type="number"
                    min="0"
                    max="100"
                    value={config.pesoEvaluacionEmpleador}
                    onChange={(e) => setConfig({
                      ...config,
                      pesoEvaluacionEmpleador: parseInt(e.target.value) || 0
                    })}
                    className="text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pesoInforme">Evaluación Informe (%)</Label>
                  <Input
                    id="pesoInforme"
                    type="number"
                    min="0"
                    max="100"
                    value={config.pesoEvaluacionInforme}
                    onChange={(e) => setConfig({
                      ...config,
                      pesoEvaluacionInforme: parseInt(e.target.value) || 0
                    })}
                    className="text-center"
                  />
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>Total:</span>
                  <span className={`font-medium ${
                    config.pesoEvaluacionEmpleador + config.pesoEvaluacionInforme === 100 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {config.pesoEvaluacionEmpleador + config.pesoEvaluacionInforme}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notaMinima">Nota Mínima de Aprobación</Label>
                <Input
                  id="notaMinima"
                  type="number"
                  min="1"
                  max="7"
                  step="0.1"
                  value={config.notaMinimaAprobacion}
                  onChange={(e) => setConfig({
                    ...config,
                    notaMinimaAprobacion: parseFloat(e.target.value) || 4.0
                  })}
                  className="text-center"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Valor fijo del sistema (no editable)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={saving}
              >
                Restablecer
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || config.pesoEvaluacionEmpleador + config.pesoEvaluacionInforme !== 100}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
