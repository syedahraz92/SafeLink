import type { NextPage } from 'next';
import Head from 'next/head';
import Dashboard from '../components/ui/Dashboard';
import { SensorProvider } from '../components/ui/SensorContext';

const Home: NextPage = () => {
return (
<div className="min-h-screen bg-gray-100">
    <Head>
    <title>Dementia Patient Monitor</title>
    <meta name="description" content="Monitor vital signs of dementia patients" />
    <link rel="icon" href="/favicon.ico" />
    </Head>

    <main>
    <SensorProvider>
        <Dashboard />
    </SensorProvider>
    </main>
</div>
);
};

export default Home;