import AppLayout from '@/Layouts/AppLayout';
import { Users, Cake } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={18} strokeWidth={1.75} className="text-white" />
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
        </div>
    );
}

export default function Dashboard({ totalSellers = 0, birthdayToday = [] }) {
    return (
        <AppLayout title="Dashboard">

            <div className="mb-7">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-400 text-sm mt-1">Visão geral do sistema.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={Users}
                    label="Vendedores"
                    value={totalSellers}
                    color="bg-primary-600"
                />
                <StatCard
                    icon={Cake}
                    label="Aniversariantes hoje"
                    value={birthdayToday.length}
                    color="bg-violet-500"
                />
            </div>

            {birthdayToday.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Aniversariantes do dia</h2>
                    <div className="flex flex-col gap-2">
                        {birthdayToday.map((seller) => (
                            <div key={seller.id} className="flex items-center gap-3 text-sm text-gray-600">
                                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-semibold text-xs shrink-0">
                                    {seller.name?.charAt(0).toUpperCase()}
                                </div>
                                <span>{seller.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}