import React from 'react';
import { SimulationForm } from '@/features/simulation/components/SimulationForm';

const SimulationPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
        <SimulationForm />
    </div>
  );
};

export default SimulationPage;