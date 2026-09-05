import DeliveryTracking from '@/components/DeliveryTracking';

export const metadata = {
  title: 'Delivery Tracking | GraVITas',
  description: 'Track events and domains for the festival.',
};

export default function DeliveryPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-gray-200 p-6 md:p-12 overflow-x-hidden selection:bg-purple-500/30">
      <div className="max-w-7xl mx-auto w-full">
        <DeliveryTracking />
      </div>
    </main>
  );
}
