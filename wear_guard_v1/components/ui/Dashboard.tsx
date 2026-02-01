import React from 'react';
import { TemperatureDisplay, AccelerometerDisplay, HeartRateDisplay, GPSDisplay } from './SensorDisplay';
import { useSensorData } from './SensorContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
const { connected, history } = useSensorData();

return (
<div className="p-4">
    <div className="mb-4 flex items-center">
    <h2 className="text-xl font-bold">Patient Monitoring Dashboard</h2>
    <div className="ml-4 flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span>{connected ? 'Connected' : 'Disconnected'}</span>
    </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <TemperatureDisplay />
    <HeartRateDisplay />
    <AccelerometerDisplay />
    <GPSDisplay />
    </div>

    <div className="bg-white p-4 rounded-lg shadow mb-6">
    <h3 className="text-lg font-semibold mb-2">Heart Rate History</h3>
    <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMinutes()}:${date.getSeconds().toString().padStart(2, '0')}`;
            }}
            />
            <YAxis domain={[0, 200]} />
            <Tooltip
            formatter={(value) => [`${value} BPM`, 'Heart Rate']}
            labelFormatter={(label) => {
                const date = new Date(label);
                return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
            }}
            />
            <Line
            type="monotone"
            dataKey="heartRate"
            stroke="#e53e3e"
            dot={false}
            activeDot={{ r: 8 }}
            />
        </LineChart>
        </ResponsiveContainer>
    </div>
    </div>

    <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-2">Temperature History</h3>
    <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMinutes()}:${date.getSeconds().toString().padStart(2, '0')}`;
            }}
            />
            <YAxis domain={[30, 40]} />
            <Tooltip
            formatter={(value) => [`${value}°C`, 'Temperature']}
            labelFormatter={(label) => {
                const date = new Date(label);
                return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
            }}
            />
            <Line
            type="monotone"
            dataKey="objectTemp"
            stroke="#3182ce"
            dot={false}
            activeDot={{ r: 8 }}
            />
        </LineChart>
        </ResponsiveContainer>
    </div>
    </div>
</div>
);
};

export default Dashboard;