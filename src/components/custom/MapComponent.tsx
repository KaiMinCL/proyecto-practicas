"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  ExternalLink, 
  Navigation, 
  Info,
  AlertTriangle 
} from 'lucide-react';
import { generateMapActions, isValidAddress, normalizeAddress } from '@/lib/maps';

interface MapComponentProps {
  address: string;
  title?: string;
  className?: string;
  height?: string;
  showActions?: boolean;
}

export function MapComponent({ 
  address, 
  title = "Ubicación", 
  className = "",
  height = "400px",
  showActions = true 
}: MapComponentProps) {
  const normalizedAddress = normalizeAddress(address);
  const isValid = isValidAddress(normalizedAddress);
  const mapActions = isValid ? generateMapActions(normalizedAddress) : null;

  if (!isValid) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              La dirección proporcionada no es válida para mostrar en el mapa.
              <br />
              <span className="text-sm text-muted-foreground mt-1 block">
                Dirección: {address}
              </span>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!mapActions?.embed) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Google Maps no está configurado. La clave API es necesaria para mostrar mapas interactivos.
            </AlertDescription>
          </Alert>
          
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Dirección:</p>
                <p className="text-sm text-muted-foreground">{normalizedAddress}</p>
              </div>
            </div>
          </div>

          {showActions && mapActions?.view && (
            <div className="flex gap-2">
              <Button asChild size="sm">
                <a href={mapActions.view} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver en Google Maps
                </a>
              </Button>
              
              {mapActions.directions && (
                <Button asChild variant="outline" size="sm">
                  <a href={mapActions.directions} target="_blank" rel="noopener noreferrer">
                    <Navigation className="w-4 h-4 mr-2" />
                    Cómo llegar
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {title}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            <MapPin className="w-3 h-3 mr-1" />
            Interactivo
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Dirección */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Dirección:</p>
              <p className="text-sm text-muted-foreground">{normalizedAddress}</p>
            </div>
          </div>
        </div>

        {/* Mapa embebido */}
        <div className="relative overflow-hidden rounded-lg border">
          <iframe
            src={mapActions.embed}
            width="100%"
            height={height}
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Mapa de ${normalizedAddress}`}
            className="w-full"
          />
        </div>

        {/* Acciones del mapa */}
        {showActions && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild size="sm" className="flex-1">
              <a href={mapActions.view} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver en Google Maps
              </a>
            </Button>
            
            <Button asChild variant="outline" size="sm" className="flex-1">
              <a href={mapActions.directions} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-4 h-4 mr-2" />
                Cómo llegar
              </a>
            </Button>
          </div>
        )}

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground">
          <p>• Haz clic y arrastra para mover el mapa</p>
          <p>• Usa la rueda del mouse para hacer zoom</p>
          <p>• Haz clic en el marcador para más información</p>
        </div>
      </CardContent>
    </Card>
  );
}
