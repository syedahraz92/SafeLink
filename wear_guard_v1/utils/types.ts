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
    gpsData: string;
    timestamp: number;
}