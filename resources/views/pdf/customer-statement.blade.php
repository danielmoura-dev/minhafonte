<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "DejaVu Sans", sans-serif; font-size: 10px; color: #1a1a2e; }
        @page { margin: 14mm 12mm; }

        .header {
            display: flex; align-items: center; justify-content: space-between;
            padding-bottom: 12px; border-bottom: 3px solid #0369a1; margin-bottom: 16px;
        }
        .header-left { display: flex; align-items: center; }
        .logo { height: 42px; margin-right: 12px; }
        .brand-name { font-size: 15px; font-weight: 700; color: #0369a1; }
        .brand-sub { font-size: 9px; color: #64748b; margin-top: 2px; }
        .header-right { text-align: right; }
        .report-title { font-size: 13px; font-weight: 700; color: #0f172a; }
        .report-meta { font-size: 8.5px; color: #94a3b8; margin-top: 3px; }

        .card {
            background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;
            padding: 11px 15px; margin-bottom: 16px;
        }
        .cust-name { font-size: 14px; font-weight: 700; color: #0369a1; }
        .cust-meta { font-size: 9.5px; color: #475569; margin-top: 3px; line-height: 1.5; }

        .totals { width: 100%; border-collapse: separate; border-spacing: 7px 0; margin-bottom: 18px; }
        .totals td {
            border-radius: 6px; padding: 9px 11px; text-align: center; width: 25%;
        }
        .t-blue  { background: #eff6ff; border: 1px solid #bfdbfe; }
        .t-green { background: #f0fdf4; border: 1px solid #bbf7d0; }
        .t-amber { background: #fffbeb; border: 1px solid #fde68a; }
        .t-gray  { background: #f8fafc; border: 1px solid #e2e8f0; }
        .t-label { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .t-value { font-size: 12.5px; font-weight: 700; margin-top: 3px; }
        .t-blue .t-value  { color: #1d4ed8; }
        .t-green .t-value { color: #15803d; }
        .t-amber .t-value { color: #b45309; }
        .t-gray .t-value  { color: #334155; }

        .section { margin-bottom: 18px; }
        .section-title {
            font-size: 10.5px; font-weight: 700; color: #0369a1; text-transform: uppercase;
            letter-spacing: 0.6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 8px;
        }

        table.data { width: 100%; border-collapse: collapse; font-size: 9.5px; }
        table.data thead tr { background: #f8fafc; }
        table.data th {
            text-align: left; padding: 6px 8px; font-size: 8.5px; font-weight: 700;
            color: #64748b; text-transform: uppercase; letter-spacing: 0.4px;
            border-bottom: 1px solid #e2e8f0;
        }
        table.data td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        th.right, td.right { text-align: right; }
        th.center, td.center { text-align: center; }
        .tfoot td { border-top: 2px solid #e2e8f0; font-weight: 700; padding-top: 7px; }
        .paid    { color: #15803d; font-weight: 600; }
        .partial { color: #1d4ed8; font-weight: 600; }
        .pending { color: #b45309; font-weight: 600; }
        .overdue { color: #b91c1c; font-weight: 600; }

        .footer {
            position: fixed; bottom: 0; left: 0; right: 0;
            border-top: 1px solid #e2e8f0; padding-top: 8px;
            font-size: 8px; color: #94a3b8; text-align: center;
        }
    </style>
</head>
<body>

@php
    $fmt   = fn ($v) => 'R$ ' . number_format((float) $v, 2, ',', '.');
    $qty   = fn ($v) => rtrim(rtrim(number_format((float) $v, 3, ',', '.'), '0'), ',');
    $brand = $company->fantasy_name ?: $company->company_name;

    $statusLabel = [
        'paid'    => ['Pago', 'paid'],
        'partial' => ['Parcial', 'partial'],
        'pending' => ['Pendente', 'pending'],
    ];
@endphp

<div class="header">
    <div class="header-left">
        @if ($company->logo && file_exists(public_path('storage/' . $company->logo)))
            <img src="{{ public_path('storage/' . $company->logo) }}" class="logo" alt="">
        @elseif (file_exists(public_path('images/logo2.png')))
            <img src="{{ public_path('images/logo2.png') }}" class="logo" alt="">
        @endif
        <div>
            <div class="brand-name">{{ $brand }}</div>
            <div class="brand-sub">
                {{ collect([$company->city, $company->state])->filter()->implode(' / ') }}
                @if ($company->phone) · {{ $company->phone }} @endif
            </div>
        </div>
    </div>
    <div class="header-right">
        <div class="report-title">Extrato do Cliente</div>
        <div class="report-meta">
            @if ($dateFrom || $dateTo)
                Período: {{ $dateFrom ? \Illuminate\Support\Carbon::parse($dateFrom)->format('d/m/Y') : 'início' }}
                a {{ $dateTo ? \Illuminate\Support\Carbon::parse($dateTo)->format('d/m/Y') : 'hoje' }}<br>
            @endif
            Gerado em {{ now()->format('d/m/Y \à\s H:i') }}
        </div>
    </div>
</div>

<div class="card">
    <div class="cust-name">{{ $customer->name }}</div>
    <div class="cust-meta">
        @if ($customer->document) {{ $customer->type === 'pj' ? 'CNPJ' : 'CPF' }}: {{ $customer->document }} · @endif
        @if ($customer->phone) Telefone: {{ $customer->phone }} @endif
        @if ($customer->email) · {{ $customer->email }} @endif
        @php
            $addr = collect([$customer->street, $customer->number, $customer->neighborhood, $customer->city, $customer->state])
                ->filter()->implode(', ');
        @endphp
        @if ($addr) <br>{{ $addr }} @endif
    </div>
</div>

<table class="totals">
    <tr>
        <td class="t-blue">
            <div class="t-label">Total comprado</div>
            <div class="t-value">{{ $fmt($totalBought) }}</div>
        </td>
        <td class="t-green">
            <div class="t-label">Total pago</div>
            <div class="t-value">{{ $fmt($totalPaid) }}</div>
        </td>
        <td class="t-amber">
            <div class="t-label">Em aberto</div>
            <div class="t-value">{{ $fmt($totalOpen) }}</div>
        </td>
        <td class="t-gray">
            <div class="t-label">Compras</div>
            <div class="t-value">{{ $orders->count() }}</div>
        </td>
    </tr>
</table>

<div class="section">
    <div class="section-title">Histórico de compras</div>

    @if ($orders->isEmpty())
        <p style="color:#94a3b8; font-size:9.5px; padding:8px 0;">Nenhuma compra no período.</p>
    @else
        <table class="data">
            <thead>
                <tr>
                    <th style="width:52px;">Pedido</th>
                    <th style="width:70px;">Data</th>
                    <th style="width:70px;">Vencimento</th>
                    <th>Itens</th>
                    <th class="center" style="width:60px;">Situação</th>
                    <th class="right" style="width:70px;">Total</th>
                    <th class="right" style="width:70px;">Pago</th>
                    <th class="right" style="width:70px;">Em aberto</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($orders as $order)
                    @php
                        [$label, $class] = $statusLabel[$order->payment_status] ?? ['—', ''];
                        $open = (float) $order->total - (float) $order->paid_total;
                        $isOverdue = $order->due_status === 'overdue';
                    @endphp
                    <tr>
                        <td>#{{ $order->order_number }}</td>
                        <td>{{ $order->issue_date?->format('d/m/Y') }}</td>
                        <td class="{{ $isOverdue ? 'overdue' : '' }}">
                            {{ $order->due_date?->format('d/m/Y') ?? '—' }}
                        </td>
                        <td>{{ $order->items->map(fn ($i) => $qty($i->quantity) . 'x ' . $i->product_name)->implode(', ') }}</td>
                        <td class="center {{ $class }}">{{ $label }}</td>
                        <td class="right">{{ $fmt($order->total) }}</td>
                        <td class="right">{{ $fmt($order->paid_total) }}</td>
                        <td class="right {{ $open > 0 ? 'pending' : '' }}">{{ $fmt($open) }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr class="tfoot">
                    <td colspan="5">Total</td>
                    <td class="right">{{ $fmt($totalBought) }}</td>
                    <td class="right">{{ $fmt($totalPaid) }}</td>
                    <td class="right">{{ $fmt($totalOpen) }}</td>
                </tr>
            </tfoot>
        </table>
    @endif
</div>

@if ($topProducts->isNotEmpty())
    <div class="section">
        <div class="section-title">Produtos comprados</div>
        <table class="data">
            <thead>
                <tr>
                    <th>Produto</th>
                    <th class="right" style="width:90px;">Quantidade</th>
                    <th class="right" style="width:90px;">Valor</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($topProducts as $p)
                    <tr>
                        <td>{{ $p['name'] }}</td>
                        <td class="right">{{ $qty($p['quantity']) }}</td>
                        <td class="right">{{ $fmt($p['total']) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
@endif

<div class="footer">{{ $brand }} · Extrato gerado pelo Fonte Pro</div>

</body>
</html>
