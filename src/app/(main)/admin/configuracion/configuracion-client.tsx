'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

export function ConfiguracionClient() {
  const [config, setConfig] = useState<ConfiguracionEvaluaciones>({
    pesoEvaluacionEmpleador: 60,
    pesoEvaluacionInforme: 40,
    notaMinimaAprobacion: 4.0
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/configuracion');
        const data = await response.json();
        
        if (data.success) {
          setConfig(data.data);
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

    fetchConfig();
  }, []);

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
        setTimeout(() => setSuccess(null), 3000);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando configuración...</span>
      </div>
    );
  }

  return (
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración de Evaluaciones
          </CardTitle>
          <CardDescription>
            Configure las ponderaciones para el cálculo de la nota final de las prácticas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="pesoEmpleador">Peso Evaluación Empleador (%)</Label>
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
              />
              <p className="text-sm text-muted-foreground">
                Ponderación de la evaluación del empleador (Acta 2)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pesoInforme">Peso Evaluación Informe (%)</Label>
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
              />
              <p className="text-sm text-muted-foreground">
                Ponderación de la evaluación del informe por el docente
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="notaMinima">Nota Mínima de Aprobación</Label>
              <Input
                id="notaMinima"
                type="number"
                min="1.0"
                max="7.0"
                step="0.1"
                value={config.notaMinimaAprobacion}
                onChange={(e) => setConfig({
                  ...config,
                  notaMinimaAprobacion: parseFloat(e.target.value) || 4.0
                })}
              />
              <p className="text-sm text-muted-foreground">
                Nota mínima para aprobar una práctica
              </p>
            </div>

            <div className="space-y-2">
              <Label>Total Ponderación</Label>
              <div className="flex items-center space-x-2">
                <div className={`text-2xl font-bold ${
                  config.pesoEvaluacionEmpleador + config.pesoEvaluacionInforme === 100 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {config.pesoEvaluacionEmpleador + config.pesoEvaluacionInforme}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {config.pesoEvaluacionEmpleador + config.pesoEvaluacionInforme === 100 
                    ? '✓ Correcto' 
                    : '✗ Debe sumar 100%'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restablecer
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || config.pesoEvaluacionEmpleador + config.pesoEvaluacionInforme !== 100}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Configuración
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Adicional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• La configuración se aplica a todas las prácticas nuevas que se evalúen.</p>
            <p>• Las prácticas ya evaluadas mantendrán su nota original.</p>
            <p>• La suma de las ponderaciones debe ser exactamente 100%.</p>
            <p>• La nota mínima de aprobación debe estar entre 1.0 y 7.0.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
