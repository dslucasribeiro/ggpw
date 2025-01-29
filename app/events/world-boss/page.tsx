'use client';

import EventTable from '@/components/EventTable';

export default function WorldBossPage() {
  return (
    <div className="min-h-screen bg-[#0B1120]">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <EventTable 
          eventTypeId={4} 
          eventWeight={1}
          title="World Boss"
        />
      </div>
    </div>
  );
}
