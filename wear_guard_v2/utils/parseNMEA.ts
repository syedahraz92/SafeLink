export function parseNMEA(nmea: string): { lat: number; lon: number } | null {
    const match = nmea.match(/^\$(?:GNRMC|GPGGA),[^,]*,[A,V],(\d{2})(\d{2}\.\d+),([NS]),(\d{3})(\d{2}\.\d+),([EW])/);
  
    if (!match) return null;
  
    const latDeg = parseInt(match[1], 10);
    const latMin = parseFloat(match[2]);
    const latHem = match[3];
    const lonDeg = parseInt(match[4], 10);
    const lonMin = parseFloat(match[5]);
    const lonHem = match[6];
  
    const latitude = latDeg + latMin / 60;
    const longitude = lonDeg + lonMin / 60;
  
    return {
      lat: latHem === 'S' ? -latitude : latitude,
      lon: lonHem === 'W' ? -longitude : longitude,
    };
  }
  