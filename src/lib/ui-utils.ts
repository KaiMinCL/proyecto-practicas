// Utilidades para estilos consistentes según la guía de estilos

export const colors = {
  primary: '#007F7C',
  secondary: '#00B0FF', 
  accent: '#00C853',
  background: '#FFFFFF',
  foreground: '#1E1E1E',
  muted: '#D0D0D0',
} as const;

export const gradients = {
  primary: 'bg-gradient-to-r from-primary to-secondary',
  primarySubtle: 'bg-gradient-to-r from-primary/10 to-secondary/10',
  primaryMuted: 'bg-gradient-to-r from-primary/5 to-secondary/5',
  card: 'bg-gradient-to-b from-muted/50 to-background',
} as const;

export const spacing = {
  xs: 'p-2',
  sm: 'p-4', 
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12',
} as const;

export const borderRadius = {
  sm: 'rounded-md',
  md: 'rounded-lg', 
  lg: 'rounded-xl',
  full: 'rounded-full',
} as const;

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
} as const;

// Clases de componentes comunes
export const componentClasses = {
  // Headers de páginas
  pageHeader: `${gradients.primarySubtle} ${borderRadius.lg} border border-border ${spacing.lg} ${shadows.sm}`,
  
  // Cards estándar
  card: `bg-card border border-border ${borderRadius.md} ${shadows.md} hover:shadow-lg transition-shadow`,
  
  // Estados vacíos
  emptyState: `text-center py-16 ${gradients.card} ${borderRadius.lg} border-2 border-dashed border-border`,
  
  // Botones de acción principal
  primaryButton: `bg-primary hover:bg-primary/90 text-primary-foreground ${borderRadius.md} ${shadows.md} hover:shadow-lg transition-all`,
  
  // Iconos en círculos
  iconCircle: `w-8 h-8 bg-primary ${borderRadius.full} flex items-center justify-center`,
  iconCircleLarge: `w-12 h-12 bg-primary ${borderRadius.lg} flex items-center justify-center ${shadows.md}`,
  iconCircleXLarge: `w-16 h-16 bg-primary ${borderRadius.lg} flex items-center justify-center ${shadows.lg}`,
  
  // Badges y etiquetas
  badge: `inline-flex items-center ${borderRadius.sm} px-2 py-1 text-xs font-medium`,
  badgePrimary: `bg-primary/20 text-primary`,
  badgeSecondary: `bg-secondary/20 text-secondary`,
  badgeAccent: `bg-accent/20 text-accent`,
  
  // Texto
  title: 'text-foreground font-bold',
  subtitle: 'text-muted-foreground',
  body: 'text-foreground',
  caption: 'text-muted-foreground text-sm',
} as const;

// Utilidades para estados comunes
export const stateClasses = {
  pending: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  success: 'bg-green-50 border-green-200 text-green-800', 
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
} as const;

// Función para combinar clases
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Configuración de variantes de componentes
export const variants = {
  button: {
    default: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    secondary: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground',
    outline: 'border border-border bg-transparent hover:bg-muted',
    ghost: 'hover:bg-muted',
    destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
  },
  
  alert: {
    default: 'bg-background border-border',
    destructive: 'bg-destructive/10 border-destructive/20 text-destructive',
    success: 'bg-accent/10 border-accent/20 text-accent',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  },
} as const;

// Utilidades responsivas
export const responsive = {
  mobile: 'sm:',
  tablet: 'md:',
  desktop: 'lg:',
  wide: 'xl:',
} as const;

// Utilidades para animaciones
export const animations = {
  fadeIn: 'animate-in fade-in-0 duration-300',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-300',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
} as const;
