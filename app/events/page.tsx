import EventsDashboard from '@/components/EventsDashboard';

export const metadata = {
  title: 'Event Delivery Tracking | GraVITas',
};

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-gray-200 p-6 md:p-12 overflow-x-hidden selection:bg-purple-500/30">
      <div className="max-w-7xl mx-auto w-full">
        <EventsDashboard />
      </div>
    </main>
  );
}
