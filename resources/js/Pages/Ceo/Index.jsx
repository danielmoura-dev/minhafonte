import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import {
    Landmark, ShoppingCart, Trophy,
    Users, Package, FileText, TrendingUp, Lock,
} from 'lucide-react';

function money(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

/** Quadrado clicável, com um número em destaque. */
function Card({ href, icon: Icon, title, description, value, hint, color }) {
    return (
        <Link
            href={href}
            className="group flex flex-col bg-white border border-gray-200 rounded-2xl p-6 hover:border-primary-300 hover:shadow-md transition"
        >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={21} strokeWidth={1.75} />
            </div>

            <h2 className="mt-4 text-base font-bold text-gray-900 group-hover:text-primary-700 transition">
                {title}
            </h2>
            <p className="mt-1 text-sm text-gray-400 leading-relaxed flex-1">
                {description}
            </p>

            <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
            </div>
        </Link>
    );
}

/** Espaço reservado para os próximos painéis. */
function SoonCard({ icon: Icon, title }) {
    return (
        <div className="flex flex-col bg-gray-50/60 border border-dashed border-gray-200 rounded-2xl p-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gray-100 text-gray-300">
                <Icon size={21} strokeWidth={1.75} />
            </div>

            <h2 className="mt-4 text-base font-bold text-gray-400">{title}</h2>
            <p className="mt-1 text-sm text-gray-300 leading-relaxed flex-1">
                Este painel ainda está sendo preparado.
            </p>

            <div className="mt-5 pt-4 border-t border-gray-100">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    <Lock size={11} />
                    Em breve
                </span>
            </div>
        </div>
    );
}

export default function CeoIndex({ highlights }) {
    return (
        <AppLayout title="Painel do Dono">
            <div className="mb-7">
                <h1 className="text-2xl font-bold text-gray-900">Painel do Dono</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Os números da empresa reunidos num lugar só. Clique num quadro para ver os detalhes.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                <Card
                    href={route('ceo.bank-accounts')}
                    icon={Landmark}
                    color="bg-emerald-50 text-emerald-600"
                    title="Contas bancárias"
                    description="Quanto já entrou em cada conta, com o total recebido e a última movimentação."
                    value={money(highlights.accounts_total)}
                    hint={`Recebido em ${highlights.accounts_count} conta${highlights.accounts_count === 1 ? '' : 's'} ativa${highlights.accounts_count === 1 ? '' : 's'}`}
                />

                <Card
                    href={route('ceo.sales')}
                    icon={ShoppingCart}
                    color="bg-primary-50 text-primary-600"
                    title="Vendas"
                    description="Quanto foi vendido, quanto já entrou e quanto ainda falta receber. Filtre por dia, mês ou desde o início."
                    value={money(highlights.month_sold)}
                    hint={`${highlights.month_count} venda${highlights.month_count === 1 ? '' : 's'} neste mês`}
                />

                <Card
                    href={route('ceo.ranks')}
                    icon={Trophy}
                    color="bg-amber-50 text-amber-600"
                    title="Rankings"
                    description="Os produtos que mais vendem, os clientes que mais compram e as cidades que mais faturam."
                    value={money(highlights.open_total)}
                    hint="Total ainda em aberto para receber"
                />

                <SoonCard icon={Users}      title="Equipe" />
                <SoonCard icon={Package}    title="Estoque" />
                <SoonCard icon={TrendingUp} title="Metas" />
                <SoonCard icon={FileText}   title="Relatórios" />
            </div>
        </AppLayout>
    );
}
