interface ApiHoliday {
  date: string; // "YYYY-MM-DD"
  title: string;
  type: string;
  inalienable: boolean;
  extra: string;
}

// Interfaz para la estructura de la respuesta completa de la API
interface ApiResponse {
  status: string;
  data: ApiHoliday[];
}

// Caché simple en memoria para los feriados: Map<año, Set<string_fecha_YYYY-MM-DD>>
const holidayCacheByYear = new Map<number, Set<string>>();
const lastFetchTimestampByYear = new Map<number, number>();
const CACHE_TTL_HOURS = 6;

/**
 * Obtiene y cachea los feriados para un año específico desde la API de Boostr.cl.
 * @param year El año para el cual obtener los feriados.
 * @returns Un Set con las fechas de los feriados en formato "YYYY-MM-DD".
 */
async function fetchAndCacheHolidaysForYear(year: number): Promise<Set<string>> {
  const currentTime = Date.now();
  const lastFetch = lastFetchTimestampByYear.get(year);

  if (lastFetch && (currentTime - lastFetch < CACHE_TTL_HOURS * 60 * 60 * 1000)) {
    const cachedHolidays = holidayCacheByYear.get(year);
    if (cachedHolidays) {
      return cachedHolidays;
    }
  }

  console.log(`Obteniendo feriados para el año ${year} desde api.boostr.cl...`);
  try {
    const response = await fetch(`https://api.boostr.cl/holidays/${year}.json`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      // Intenta obtener más detalles del error si la API los provee
      let errorDetails = `Error HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorDetails += ` - ${JSON.stringify(errorBody)}`;
      } catch (e) { /* No se pudo parsear el cuerpo del error, se ignora */ }
      
      console.error(`Error al obtener feriados para el año ${year}: ${errorDetails}`);
      // Devuelve el caché antiguo si existe, o un set vacío para no bloquear el cálculo principal
      return holidayCacheByYear.get(year) || new Set<string>();
    }

    const responseData: ApiResponse = await response.json();

    if (responseData && responseData.status === 'success' && Array.isArray(responseData.data)) {
      const holidaysForYear = new Set(
        responseData.data.map((holiday: ApiHoliday) => holiday.date) // Solo nos interesan las fechas "YYYY-MM-DD"
      );
      holidayCacheByYear.set(year, holidaysForYear);
      lastFetchTimestampByYear.set(year, currentTime);
      return holidaysForYear;
    } else {
      console.error(`Estructura de respuesta inesperada de la API de feriados para el año ${year}:`, responseData);
      return holidayCacheByYear.get(year) || new Set<string>();
    }
  } catch (error) {
    console.error(`Error de red u otro al obtener feriados para el año ${year}:`, error);
    return holidayCacheByYear.get(year) || new Set<string>();
  }
}


/**
 * Verifica si una fecha dada es un feriado.
 * Utiliza el caché y consulta la API si es necesario.
 */
export async function isHoliday(fecha: Date): Promise<boolean> {
  const year = fecha.getUTCFullYear();
  // La función fetchAndCacheHolidaysForYear maneja el caché y la obtención por año.
  const holidaysInYear = await fetchAndCacheHolidaysForYear(year);

  // Formatea la fecha de entrada a YYYY-MM-DD en UTC para una comparación consistente.
  const month = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = fecha.getUTCDate().toString().padStart(2, '0');
  const fechaStr = `${year}-${month}-${day}`;
  
  return holidaysInYear.has(fechaStr);
}