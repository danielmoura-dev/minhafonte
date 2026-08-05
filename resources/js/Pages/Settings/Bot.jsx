import AppLayout from '@/Layouts/AppLayout';
import { useForm, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    Bot, QrCode, Smartphone, Trash2, Plus, Loader2,
    MessageCircle, Mic, ShieldCheck, AlertTriangle,
    Bell, BellOff, Clock, Send, Volume2,
} from 'lucide-react';
import ConfirmModal from '@/Components/UI/ConfirmModal';

const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";

function formatPhoneDisplay(phone) {
    // 5585999998888 -> +55 (85) 99999-8888
    const m = String(phone).match(/^55(\d{2})(\d{4,5})(\d{4})$/);
    return m ? `+55 (${m[1]}) ${m[2]}-${m[3]}` : phone;
}

function ConnectionCard({ bot, configured }) {
    const [status, setStatus] = useState(bot?.status ?? 'disconnected');
    const [phone, setPhone] = useState(bot?.phone ?? null);
    const [qrcode, setQrcode] = useState(null);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [confirmDisconnect, setConfirmDisconnect] = useState(false);
    const pollRef = useRef(null);

    function stopPolling() {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }

    function startPolling() {
        stopPolling();
        pollRef.current = setInterval(async () => {
            try {
                const { data } = await axios.get(route('bot.status'));
                setStatus(data.status);
                setPhone(data.phone);
                if (data.status === 'connected') {
                    setQrcode(null);
                    stopPolling();
                }
            } catch {
                // mantém o polling; erros transitórios são ignorados
            }
        }, 3000);
    }

    useEffect(() => () => stopPolling(), []);

    async function handleConnect() {
        setConnecting(true);
        setError(null);
        try {
            const { data } = await axios.post(route('bot.connect'));
            if (data.qrcode) {
                setQrcode(data.qrcode);
                setStatus('connecting');
                startPolling();
            } else {
                setError('QR code não retornado. Tente novamente.');
            }
        } catch (e) {
            setError(e.response?.data?.error ?? 'Falha ao conectar. Verifique a Evolution API.');
        } finally {
            setConnecting(false);
        }
    }

    function handleDisconnect() {
        stopPolling();
        router.post(route('bot.disconnect'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setStatus('disconnected');
                setPhone(null);
                setQrcode(null);
                setConfirmDisconnect(false);
            },
        });
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
                <Bot size={17} className="text-primary-500" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-gray-700">Conexão do bot</h2>
            </div>
            <p className="text-xs text-gray-400 mb-5">
                Conecte um número de WhatsApp <strong>dedicado ao bot</strong> (não use o número principal da empresa).
            </p>

            {!configured && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 mb-4">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>
                        Configuração incompleta no servidor: defina <code className="font-mono text-xs">EVOLUTION_API_KEY</code> e{' '}
                        <code className="font-mono text-xs">GEMINI_API_KEY</code> no .env para ativar o bot.
                    </span>
                </div>
            )}

            {status === 'connected' ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                            <Smartphone size={19} className="text-green-600" strokeWidth={1.75} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900">
                                    {phone ? formatPhoneDisplay(phone) : 'Número conectado'}
                                </p>
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Conectado
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">O bot está ativo e respondendo aos números autorizados.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setConfirmDisconnect(true)}
                        className="px-4 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                    >
                        Desconectar
                    </button>
                </div>
            ) : qrcode ? (
                <div className="flex flex-col items-center py-2">
                    <img src={qrcode} alt="QR code" className="w-56 h-56 rounded-lg border border-gray-200" />
                    <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
                        <Loader2 size={15} className="animate-spin text-primary-500" />
                        Aguardando leitura do QR code...
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center max-w-sm">
                        No celular do bot: <strong>WhatsApp → Configurações → Aparelhos conectados → Conectar aparelho</strong> e aponte a câmera para o código.
                    </p>
                    <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Gerar novo QR code
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center py-6">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                        <QrCode size={26} className="text-gray-400" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Nenhum número conectado.</p>
                    <button
                        onClick={handleConnect}
                        disabled={connecting || !configured}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-60"
                    >
                        {connecting ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={15} strokeWidth={2} />}
                        {connecting ? 'Gerando QR code...' : 'Conectar bot'}
                    </button>
                    {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
                </div>
            )}

            <ConfirmModal
                show={confirmDisconnect}
                title="Desconectar bot"
                message="O número será desconectado e o bot deixará de responder. Você poderá reconectar pelo QR code a qualquer momento."
                confirmLabel="Desconectar"
                onConfirm={handleDisconnect}
                onCancel={() => setConfirmDisconnect(false)}
            />
        </div>
    );
}

function AllowedNumbersCard({ allowedNumbers }) {
    const { data, setData, post, processing, errors, reset } = useForm({ name: '', phone: '' });
    const [deleting, setDeleting] = useState(null);
    const [loadingDelete, setLoadingDelete] = useState(false);

    function submit(e) {
        e.preventDefault();
        post(route('bot.numbers.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    function handleDelete() {
        setLoadingDelete(true);
        router.delete(route('bot.numbers.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => { setLoadingDelete(false); setDeleting(null); },
        });
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={17} className="text-primary-500" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-gray-700">Números autorizados</h2>
            </div>
            <p className="text-xs text-gray-400 mb-5">
                Somente estes números conseguem conversar com o bot. Mensagens de qualquer outro número são ignoradas.
            </p>

            <form onSubmit={submit} className="flex gap-3 mb-5 flex-wrap">
                <div className="flex-1 min-w-40">
                    <input
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        placeholder="Nome (ex: Daniel — Dono)"
                        className={inputCls}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div className="flex-1 min-w-40">
                    <input
                        value={data.phone}
                        onChange={e => setData('phone', e.target.value)}
                        placeholder="WhatsApp (ex: 85 99999-8888)"
                        className={inputCls}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-60"
                >
                    <Plus size={15} strokeWidth={2} />
                    Autorizar
                </button>
            </form>

            {allowedNumbers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                    Nenhum número autorizado ainda — o bot não responderá ninguém.
                </p>
            ) : (
                <ul className="divide-y divide-gray-50 border border-gray-100 rounded-lg">
                    {allowedNumbers.map(n => (
                        <li key={n.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{n.name}</p>
                                <p className="text-xs text-gray-400">{formatPhoneDisplay(n.phone)}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => router.patch(route('bot.numbers.toggle-notifications', n.id), {}, { preserveScroll: true })}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                                        n.notifications_enabled
                                            ? 'text-primary-700 bg-primary-50 hover:bg-primary-100'
                                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                                    title={n.notifications_enabled
                                        ? 'Recebendo notificações — clique para desativar'
                                        : 'Sem notificações — clique para ativar'}
                                >
                                    {n.notifications_enabled
                                        ? <Bell size={13} strokeWidth={2} />
                                        : <BellOff size={13} strokeWidth={2} />}
                                    {n.notifications_enabled ? 'Notificações' : 'Desativadas'}
                                </button>
                                <button
                                    onClick={() => setDeleting(n)}
                                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                    title="Remover"
                                >
                                    <Trash2 size={15} strokeWidth={1.75} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <ConfirmModal
                show={!!deleting}
                title="Remover número"
                message={`Remover "${deleting?.name}"? Este número deixará de conseguir falar com o bot.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
                loading={loadingDelete}
            />
        </div>
    );
}

const WEEKDAYS = [
    { value: 1, label: 'Seg' }, { value: 2, label: 'Ter' }, { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' }, { value: 5, label: 'Sex' }, { value: 6, label: 'Sáb' },
    { value: 7, label: 'Dom' },
];

/** Notificações automáticas: resumo diário de vendas. */
function NotificationsCard({ notification, audioFiles, recipientsCount }) {
    const { data, setData, put, processing, errors } = useForm({
        enabled:    notification?.enabled ?? false,
        send_time:  notification?.send_time ?? '19:00',
        days:       notification?.days ?? [1, 2, 3, 4, 5],
        audio_file: notification?.audio_file ?? '',
    });

    const [testing, setTesting] = useState(false);

    function toggleDay(day) {
        setData('days', data.days.includes(day)
            ? data.days.filter(d => d !== day)
            : [...data.days, day].sort((a, b) => a - b));
    }

    function save(e) {
        e.preventDefault();
        put(route('bot.notification.save'), { preserveScroll: true });
    }

    function sendTest() {
        setTesting(true);
        router.post(route('bot.notification.test'), {}, {
            preserveScroll: true,
            onFinish: () => setTesting(false),
        });
    }

    return (
        <form onSubmit={save} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
                <Bell size={17} className="text-primary-500" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-gray-700">Notificações automáticas</h2>
            </div>
            <p className="text-xs text-gray-400 mb-5">
                O bot envia sozinho, no horário escolhido, para os números com notificações ativadas
                {recipientsCount > 0 ? ` (${recipientsCount} no momento).` : '.'}
            </p>

            {/* Resumo diário */}
            <div className={`rounded-xl border p-4 transition ${data.enabled ? 'border-primary-200 bg-primary-50/40' : 'border-gray-200'}`}>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={data.enabled}
                        onChange={e => setData('enabled', e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>
                        <span className="block text-sm font-semibold text-gray-800">Resumo de vendas do dia</span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                            Envia o áudio escolhido e, em seguida, o resumo das vendas e os itens vendidos.
                        </span>
                    </span>
                </label>

                {data.enabled && (
                    <div className="mt-4 pl-7 flex flex-col gap-4">
                        {/* Horário */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                <Clock size={12} className="inline mr-1 -mt-0.5" strokeWidth={2} />
                                Horário do envio
                            </label>
                            <input
                                type="time"
                                value={data.send_time}
                                onChange={e => setData('send_time', e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                            />
                            {errors.send_time && <p className="text-red-500 text-xs mt-1">{errors.send_time}</p>}
                        </div>

                        {/* Dias */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Dias da semana</label>
                            <div className="flex gap-1.5 flex-wrap">
                                {WEEKDAYS.map(d => (
                                    <button
                                        key={d.value}
                                        type="button"
                                        onClick={() => toggleDay(d.value)}
                                        className={`w-11 py-1.5 rounded-lg text-xs font-medium border transition ${
                                            data.days.includes(d.value)
                                                ? 'border-primary-500 bg-primary-600 text-white'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                            {errors.days && <p className="text-red-500 text-xs mt-1">{errors.days}</p>}
                        </div>

                        {/* Áudio */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                <Volume2 size={12} className="inline mr-1 -mt-0.5" strokeWidth={2} />
                                Áudio de abertura
                            </label>
                            <select
                                value={data.audio_file ?? ''}
                                onChange={e => setData('audio_file', e.target.value)}
                                className="w-full max-w-xs px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                            >
                                <option value="">Não enviar áudio</option>
                                {audioFiles.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <p className="text-[11px] text-gray-400 mt-1">
                                {audioFiles.length === 0
                                    ? 'Nenhum arquivo na pasta audios/ do projeto.'
                                    : 'Arquivos da pasta audios/ do projeto.'}
                            </p>
                            {errors.audio_file && <p className="text-red-500 text-xs mt-1">{errors.audio_file}</p>}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-2 mt-5 flex-wrap">
                <button
                    type="button"
                    onClick={sendTest}
                    disabled={testing}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
                    title="Envia o resumo de hoje agora, para conferir o formato"
                >
                    {testing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} strokeWidth={2} />}
                    {testing ? 'Enviando...' : 'Enviar agora (teste)'}
                </button>

                <button
                    type="submit"
                    disabled={processing}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
                >
                    {processing ? 'Salvando...' : 'Salvar notificações'}
                </button>
            </div>
        </form>
    );
}

function HowToUseCard() {
    const examples = [
        { icon: MessageCircle, text: '"Quantas vendas foram feitas hoje?"' },
        { icon: Mic, text: '"Quanto a Padaria Central ainda está devendo?" (por áudio)' },
        { icon: MessageCircle, text: '"Qual o estoque do garrafão 20L?"' },
        { icon: MessageCircle, text: '"Quanto tenho de comissão pendente esse mês?"' },
        { icon: MessageCircle, text: '"O que está precisando repor no estoque?"' },
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Como usar</h2>
            <p className="text-xs text-gray-400 mb-4">
                Mande <strong>texto ou áudio</strong> para o número do bot. Ele entende a pergunta, pede esclarecimento se precisar
                e responde <strong>somente com dados reais</strong> de vendas, comissões e estoque.
            </p>
            <ul className="flex flex-col gap-2.5">
                {examples.map((ex, i) => {
                    const Icon = ex.icon;
                    return (
                        <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                                <Icon size={15} className="text-primary-600" strokeWidth={1.75} />
                            </div>
                            {ex.text}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default function SettingsBot({ bot, allowedNumbers, configured, notification, audioFiles }) {
    const { flash } = usePage().props;

    return (
        <AppLayout title="Conectar Bot">
            {flash?.error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{flash.error}</div>
            )}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Conectar Bot</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Assistente da empresa no WhatsApp: consulte vendas, comissões e estoque por texto ou áudio.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <ConnectionCard bot={bot} configured={configured} />
                    <AllowedNumbersCard allowedNumbers={allowedNumbers} />
                    <NotificationsCard
                        notification={notification}
                        audioFiles={audioFiles}
                        recipientsCount={allowedNumbers.filter(n => n.notifications_enabled).length}
                    />
                </div>
                <div>
                    <HowToUseCard />
                </div>
            </div>
        </AppLayout>
    );
}
