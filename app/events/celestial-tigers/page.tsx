'use client';

import EventTable from '@/components/EventTable';

export default function CelestialTigersPage() {
  return (
    <div className="min-h-screen bg-[#0B1120]">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <EventTable 
          eventTypeId={3} 
          eventWeight={1}
          title="Tigres Celestiais"
        />
      </div>
    </div>
  );
}
