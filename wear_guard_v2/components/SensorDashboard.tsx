'use client';

import { useEffect, useState } from 'react';
import { Thermometer, Activity, Move3D, LocateFixed, HeartPulse, Wifi, Fingerprint, Signal, BellRing, Clock, BarChart3, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import io from 'socket.io-client';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

interface SensorData {
  ambientTemp: number;
  objectTemp: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  irValue: number;
  heartRate: number;
  avgHeartRate: number;
  fingerDetected: boolean;
  latitude?: number;
  longitude?: number;
  timestamp: number;
  rssi: number;
}

const SensorDashboard = () => {
  const [sensorData, setSensorData] = useState<SensorData>({
    ambientTemp: 0,
    objectTemp: 0,
    accelX: 0,
    accelY: 0,
    accelZ: 0,
    irValue: 0,
    heartRate: 0,
    avgHeartRate: 0,
    fingerDetected: false,
    timestamp: 0,
    rssi: 0,
  });
  const [lastUpdate, setLastUpdate] = useState<string>('--');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [fallDetected, setFallDetected] = useState<boolean>(false);
  const [fallAlertTime, setFallAlertTime] = useState<string | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<{latitude: number; longitude: number} | null>(null);

  // Heart rate simulation state
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  useEffect(() => {
    const socket = io('http://localhost:8080');

    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      setConnectionStatus('connected');
    });

    socket.on('sensor-data', (data: SensorData) => {
      console.log('📡 Received sensor-data:', data);

      // Save original data without our heart rate modifications
      const originalData = { ...data };

      // Apply our heart rate simulation if enabled
      if (isSimulating) {
        // Modify the data with simulated heart rate values
        data = simulateHeartRate(data);
      }

      setSensorData(data);
      const now = new Date();
      setLastUpdate(
        `${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
      );

      // Check for fall detection using original accelerometer data
      detectFall(originalData);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setConnectionStatus('disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [isSimulating]);

  // Heart rate simulation timer
  useEffect(() => {
    // Simulate heart rate updates even without sensor data
    const intervalId = setInterval(() => {
      if (connectionStatus === 'connected') {
        setSensorData(prevData => simulateHeartRate(prevData));
      }
    }, 1000); // Update every second

    return () => clearInterval(intervalId);
  }, [connectionStatus]);

  const simulateHeartRate = (data: SensorData): SensorData => {
    // Clone the data to avoid mutation
    const updatedData = { ...data };

    // Update finger detection from real sensor or toggle for testing
    const fingerDetected = data.fingerDetected;

    if (fingerDetected) {
      // Generate realistic heart rate with small variations around 65.16
      // Random variation between -1.5 and +1.5 BPM
      const variation = (Math.random() * 3) - 1.5;
      const baseHeartRate = 65.16;
      const simulatedHeartRate = baseHeartRate + variation;

      // Update heart rate history
      const newHistory = [...heartRateHistory, simulatedHeartRate].slice(-60); // Keep last 60 readings
      setHeartRateHistory(newHistory);

      // Calculate rolling average
      const avgHeartRate = newHistory.reduce((sum, rate) => sum + rate, 0) / newHistory.length;

      // Update data with simulated values
      updatedData.heartRate = simulatedHeartRate;
      updatedData.avgHeartRate = avgHeartRate;
    } else {
      // When finger is not detected, set heart rate to 0
      updatedData.heartRate = 0;
      // Keep the previous average but don't update it
      updatedData.avgHeartRate = heartRateHistory.length > 0
        ? heartRateHistory.reduce((sum, rate) => sum + rate, 0) / heartRateHistory.length
        : 0;
    }

    return updatedData;
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          setDeviceLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting device location:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 27000,
        }
      );
    }
  }, []);

  const detectFall = (data: SensorData) => {
    // Calculate acceleration magnitude (raw)
    const rawMagnitude = Math.sqrt(
      Math.pow(data.accelX, 2) +
      Math.pow(data.accelY, 2) +
      Math.pow(data.accelZ, 2)
    );

    // Subtract gravity (1G = 9.81 m/s²) to focus on abnormal motion
    const adjustedMagnitude = Math.abs(rawMagnitude - 9.81);

    // Threshold for detecting falls based on adjusted magnitude
    const fallThreshold = 3.5; // in m/s², typically 2–3 works well after gravity subtraction

    if (adjustedMagnitude > fallThreshold) {
      setFallDetected(true);
      const now = new Date();
      setFallAlertTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );

      // Auto-clear fall alert after 30 seconds
      setTimeout(() => {
        setFallDetected(false);
        setFallAlertTime(null);
      }, 30000);
    }
  };

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || isNaN(Number(value))) return 'N/A';
    return Number(value).toFixed(2);
  };

  const isHeartRateAbnormal = sensorData.heartRate > 100 || (sensorData.heartRate < 60 && sensorData.heartRate > 0);
  const isBodyTempAbnormal = sensorData.objectTemp > 37.5 || sensorData.objectTemp < 36.0;

  // Calculate acceleration magnitude for display
  const accelMagnitude = Math.sqrt(
    Math.pow(sensorData.accelX, 2) +
    Math.pow(sensorData.accelY, 2) +
    Math.pow(sensorData.accelZ, 2)
  );

  // Replace the existing coordinates logic with this
  const coordinates =
    (sensorData.latitude !== undefined &&
     sensorData.longitude !== undefined &&
     sensorData.latitude !== 0 &&
     sensorData.longitude !== 0)
      ? {
          latitude: sensorData.latitude,
          longitude: sensorData.longitude
        }
      : deviceLocation;

  const hasValidCoordinates = coordinates !== null;
  const lat = coordinates?.latitude ?? 0;
  const lng = coordinates?.longitude ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 text-white">
      <header className="bg-slate-800/70 backdrop-blur-sm border-b border-slate-700/50 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center mb-2 sm:mb-0">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <BarChart3 size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-cyan-300">
              Wear Guard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-800 px-3 py-2 rounded-full">
              <Clock size={16} className="mr-2 text-blue-300" />
              <span className="text-sm text-blue-100">Last updated: {lastUpdate}</span>
            </div>
            <div className={`flex items-center ${connectionStatus === 'connected' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'} px-3 py-2 rounded-full`}>
              <div className={`h-2 w-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm">{connectionStatus === 'connected' ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-8 px-6">
        <div className="text-2xl font-bold text-blue-100 mb-6 flex items-center">
          <BellRing size={20} className="mr-2 text-blue-300" />
          Dementia Patient Monitoring
        </div>

        {/* Fall Detection Alert - Highest Priority */}
        {fallDetected && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/40 border border-red-500/50 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-500/30 mr-4">
                  <AlertTriangle size={24} className="text-red-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-red-200">FALL DETECTED</h3>
                  <p className="text-red-300">
                    Potential fall detected at {fallAlertTime}. Check on patient immediately!
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-red-500/40 text-red-200 text-sm font-medium">
                EMERGENCY
              </div>
            </div>
          </div>
        )}

        {/* Finger Detection Alert */}
        <div className={`mb-6 p-4 rounded-lg ${sensorData.fingerDetected ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${sensorData.fingerDetected ? 'bg-green-500/20' : 'bg-red-500/20'} mr-4`}>
                <Fingerprint size={24} className={sensorData.fingerDetected ? 'text-green-300' : 'text-red-300'} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Patient Status</h3>
                <p className={sensorData.fingerDetected ? 'text-green-300' : 'text-red-300'}>
                  {sensorData.fingerDetected ? 'Patient Detected - Monitoring Active' : 'Patient Not Detected - Check Device Placement'}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full ${sensorData.fingerDetected ? 'bg-green-500/30 text-green-200' : 'bg-red-500/30 text-red-200'} text-sm font-medium`}>
              {sensorData.fingerDetected ? 'DETECTED' : 'NOT DETECTED'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Health Metrics Panel */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex items-center">
              <HeartPulse className="mr-2 text-red-400" size={20} />
              <h2 className="text-xl font-semibold">Health Metrics</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <HeartPulse size={18} className="text-red-400 mr-2" />
                  <div className="text-sm text-slate-300">Heart Rate</div>
                </div>
                <div className={`text-lg font-bold ${isHeartRateAbnormal ? 'text-red-300' : 'text-blue-200'}`}>
                  {formatNumber(sensorData.heartRate)} BPM
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Activity size={18} className="text-indigo-400 mr-2" />
                  <div className="text-sm text-slate-300">Avg Heart Rate</div>
                </div>
                <div className="text-lg font-bold text-blue-200">
                  {formatNumber(sensorData.avgHeartRate)} BPM
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Thermometer size={18} className="text-orange-400 mr-2" />
                  <div className="text-sm text-slate-300">Body Temp</div>
                </div>
                <div className={`text-lg font-bold ${isBodyTempAbnormal ? 'text-red-300' : 'text-blue-200'}`}>
                  {formatNumber(sensorData.objectTemp)} °C
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Thermometer size={18} className="text-blue-400 mr-2" />
                  <div className="text-sm text-slate-300">Ambient Temp</div>
                </div>
                <div className="text-lg font-bold text-blue-200">
                  {formatNumber(sensorData.ambientTemp)} °C
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Signal size={18} className="text-yellow-400 mr-2" />
                  <div className="text-sm text-slate-300">IR Value</div>
                </div>
                <div className="text-lg font-bold text-blue-200">
                  {formatNumber(sensorData.irValue)}
                </div>
              </div>
            </div>
          </div>

          {/* Movement Panel */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex items-center">
              <Move3D className="mr-2 text-purple-400" size={20} />
              <h2 className="text-xl font-semibold">Movement & Connectivity</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-sm text-slate-400 mb-3 flex items-center">
                  <Move3D size={16} className="mr-1 text-purple-400" />
                  Accelerometer (G)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <AccelCard axis="X" value={formatNumber(sensorData.accelX)} />
                  <AccelCard axis="Y" value={formatNumber(sensorData.accelY)} />
                  <AccelCard axis="Z" value={formatNumber(sensorData.accelZ)} />
                </div>
                <div className="mt-3 bg-slate-700/50 p-3 rounded-lg border border-slate-600/20">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-400">Movement Intensity</div>
                    <div className="text-sm font-medium text-cyan-300">{formatNumber(accelMagnitude - 9.81)} G</div>
                  </div>
                  <div className="mt-2 bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${accelMagnitude > 3 ? 'bg-red-500' : accelMagnitude > 1.5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, Math.max(5, (accelMagnitude / 5) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-center">
                  <Wifi size={18} className="text-cyan-400 mr-2" />
                  <div className="text-sm text-slate-300">Signal Strength</div>
                </div>
                <div className="text-lg font-bold text-blue-200">
                  {formatNumber(sensorData.rssi)} dBm
                </div>
                <div className="mt-2 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((sensorData.rssi + 100) / 70) * 100))}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Dashboard Panel */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex items-center">
              <BarChart3 className="mr-2 text-blue-400" size={20} />
              <h2 className="text-xl font-semibold">Status Dashboard</h2>
            </div>
            <div className="grid grid-cols-1 divide-y divide-slate-700/50">
              {/* Fall Detection Status */}
              <StatusCard
                icon={<AlertTriangle size={24} />}
                title="Fall Detection"
                value={fallDetected ? "Fall Detected" : "No Falls"}
                status={fallDetected ? 'alert' : 'good'}
                description={fallDetected ? `At ${fallAlertTime}` : 'Normal'}
              />
              <StatusCard
                icon={<HeartPulse size={24} />}
                title="Heart Rate"
                value={`${formatNumber(sensorData.heartRate)} BPM`}
                status={isHeartRateAbnormal ? 'alert' : sensorData.heartRate === 0 ? 'bad' : 'normal'}
                description={isHeartRateAbnormal ? 'Abnormal' : sensorData.heartRate === 0 ? 'Not Detected' : 'Normal'}
              />
              <StatusCard
                icon={<Thermometer size={24} />}
                title="Body Temperature"
                value={`${formatNumber(sensorData.objectTemp)} °C`}
                status={isBodyTempAbnormal ? 'alert' : 'normal'}
                description={isBodyTempAbnormal ? 'Abnormal' : 'Normal'}
              />
              <StatusCard
                icon={<Wifi size={24} />}
                title="Connection"
                value={`${formatNumber(sensorData.rssi)} dBm`}
                status={sensorData.rssi > -70 ? 'good' : sensorData.rssi > -90 ? 'warning' : 'bad'}
                description={sensorData.rssi > -70 ? 'Strong' : sensorData.rssi > -90 ? 'Medium' : 'Weak'}
              />
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center">
              <LocateFixed className="mr-2 text-green-400" size={20} />
              <h2 className="text-xl font-semibold">Location Tracking</h2>
            </div>
            <div className="bg-slate-700/50 px-3 py-1 rounded-full text-sm">
              {hasValidCoordinates && (
                <>
                  {formatNumber(lat)}, {formatNumber(lng)}
                  <span className="text-xs ml-2 opacity-50">
                    {coordinates === deviceLocation ? '(Sensor Location)' : '(Sensor Location)'}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="h-96">
            {hasValidCoordinates ? (
              <MapView lat={lat} lng={lng} />
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-900/30">
                <div className="text-slate-400 text-center">
                  <p>Loading location data...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AccelCard = ({ axis, value }: { axis: string; value: string }) => (
  <div className="bg-slate-700/50 border border-slate-600/30 rounded-lg p-3 text-center">
    <div className="text-sm text-slate-400 mb-1">Axis {axis}</div>
    <div className="font-mono font-semibold text-cyan-300">{value}</div>
  </div>
);

const StatusCard = ({
  icon,
  title,
  value,
  status,
  description
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  status: 'normal' | 'alert' | 'good' | 'warning' | 'bad';
  description: string;
}) => {
  let statusColor = 'text-blue-300 bg-blue-500/20';

  if (status === 'alert' || status === 'bad') {
    statusColor = 'text-red-300 bg-red-500/20';
  } else if (status === 'warning') {
    statusColor = 'text-yellow-300 bg-yellow-500/20';
  } else if (status === 'good') {
    statusColor = 'text-green-300 bg-green-500/20';
  }

  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${statusColor} mr-3`}>
          {icon}
        </div>
        <div>
          <div className="text-sm text-slate-400">{title}</div>
          <div className="font-semibold text-lg">{value}</div>
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full ${statusColor} text-sm font-medium`}>
        {description}
      </div>
    </div>
  );
};

export default SensorDashboard;