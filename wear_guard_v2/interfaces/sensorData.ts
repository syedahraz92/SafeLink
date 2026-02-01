export interface SensorData {
  ambientTemp: number;
  objectTemp: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  irValue: number;
  heartRate: number;
  avgHeartRate: number;
  fingerDetected: boolean;
  latitude: number;
  longitude: number;
  timestamp: number;
  rssi: number;
}