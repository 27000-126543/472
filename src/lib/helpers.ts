export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function pointInPolygon(
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  const x = point.lat;
  const y = point.lng;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

export function generateId(prefix = ''): string {
  return (
    prefix +
    Date.now().toString(36) +
    Math.random().toString(36).substr(2, 9)
  );
}

export function calculateCost(distance: number, weight: number): number {
  const baseCost = 10;
  const distanceCost = (distance / 1000) * 2;
  const weightCost = weight * 3;
  return Math.round((baseCost + distanceCost + weightCost) * 100) / 100;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function getBatteryColor(battery: number): string {
  if (battery > 60) return 'text-emerald-400';
  if (battery > 30) return 'text-amber-400';
  return 'text-red-400';
}

export function getSignalColor(signal: number): string {
  if (signal > 70) return 'text-emerald-400';
  if (signal > 40) return 'text-amber-400';
  return 'text-red-400';
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
}
