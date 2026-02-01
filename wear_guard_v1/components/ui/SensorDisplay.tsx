import React from 'react';
import { useSensorData } from './SensorContext';

export const TemperatureDisplay: React.FC = () => {
const { sensorData } = useSensorData();

return (
<div className="p-4 bg-white rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-2">Temperature</h3>
    {sensorData ? (
    <div>
        <p>Body Temperature: <span className="font-bold text-xl">{sensorData.objectTemp.toFixed(1)}°C</span></p>
        <p>Ambient: {sensorData.ambientTemp.toFixed(1)}°C</p>
    </div>
    ) : (
    <p>Waiting for data...</p>
    )}
</div>
);
};

export const AccelerometerDisplay: React.FC = () => {
const { sensorData } = useSensorData();

return (
<div className="p-4 bg-white rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-2">Movement</h3>
    {sensorData ? (
    <div>
        <p>X: {sensorData.accelX.toFixed(2)} m/s²</p>
        <p>Y: {sensorData.accelY.toFixed(2)} m/s²</p>
        <p>Z: {sensorData.accelZ.toFixed(2)} m/s²</p>
    </div>
    ) : (
    <p>Waiting for data...</p>
    )}
</div>
);
};

export const HeartRateDisplay: React.FC = () => {
const { sensorData } = useSensorData();

return (
<div className="p-4 bg-white rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-2">Heart Rate</h3>
    {sensorData ? (
    <div>
        <p>Current: <span className="font-bold text-xl">{sensorData.heartRate.toFixed(0)}</span> BPM</p>
        <p>Average: {sensorData.avgHeartRate.toFixed(0)} BPM</p>
        <p>{sensorData.fingerDetected ? 'Finger detected' : 'No finger detected'}</p>
    </div>
    ) : (
    <p>Waiting for data...</p>
    )}
</div>
);
};

export const GPSDisplay: React.FC = () => {
const { sensorData } = useSensorData();

// Very basic NMEA parser (for demonstration purposes)
const extractCoordinates = (gpsData: string) => {
const lines = gpsData.split('\n');
for (const line of lines) {
    if (line.startsWith('$GPRMC') || line.startsWith('$GNRMC')) {
    const parts = line.split(',');
    if (parts.length >= 6 && parts[2] === 'A') {
        // Valid position
        const lat = parts[3];
        const latDir = parts[4];
        const lon = parts[5];
        const lonDir = parts[6];

        return `${lat} ${latDir}, ${lon} ${lonDir}`;
    }
    }
}
return 'No valid position';
};

return (
<div className="p-4 bg-white rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-2">Location</h3>
    {sensorData ? (
    <div>
        <p>GPS Data: <span className="font-mono text-sm">{extractCoordinates(sensorData.gpsData)}</span></p>
    </div>
    ) : (
    <p>Waiting for data...</p>
    )}
</div>
);
};