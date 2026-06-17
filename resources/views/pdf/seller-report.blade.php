<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 11px;
            color: #1a1a2e;
            background: #fff;
        }

        /* ── Header ── */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 28px 16px;
            border-bottom: 3px solid #0284c7;
            margin-bottom: 20px;
        }
        .header-left { display: flex; align-items: center; gap: 14px; }
        .logo { height: 48px; }
        .brand-name { font-size: 18px; font-weight: 700; color: #0284c7; }
        .brand-sub  { font-size: 10px; color: #64748b; margin-top: 2px; }
        .header-right { text-align: right; }
        .report-title { font-size: 14px; font-weight: 700; color: #0f172a; }
        .report-meta  { font-size: 9px; color: #64748b; margin-top: 3px; }

        /* ── Seller card ── */
        .seller-card {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            padding: 12px 18px;
            margin: 0 0 18px;
            display: flex;
            justify-content: space-between;
        }
        .seller-name { font-size: 15px; font-weight: 700; color: #0369a1; }
        .seller-meta { font-size: 10px; color: #475569; margin-top: 3px; }
        .period-label { font-size: 10px; color: #475569; text-align: right; }
        .period-value { font-size: 12px; font-weight: 600; color: #0369a1; margin-top: 2px; }

        /* ── Totals grid ── */
        .totals-grid {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        .total-box {
            flex: 1;
            border-radius: 6px;
            padding: 10px 12px;
            text-align: center;
        }
        .total-box.blue   { background: #eff6ff; border: 1px solid #bfdbfe; }
        .total-box.green  { background: #f0fdf4; border: 1px solid #bbf7d0; }
        .total-box.amber  { background: #fffbeb; border: 1px solid #fde68a; }
        .total-box.violet { background: #f5f3ff; border: 1px solid #ddd6fe; }
        .total-box.indigo { background: #eef2ff; border: 1px solid #c7d2fe; }
        .total-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .total-value { font-size: 13px; font-weight: 700; margin-top: 4px; }
        .total-box.blue   .total-value { color: #1d4ed8; }
        .total-box.green  .total-value { color: #15803d; }
        .total-box.amber  .total-value { color: #b45309; }
        .total-box.violet .total-value { color: #6d28d9; }
        .total-box.indigo .total-value { color: #4338ca; }

        /* ── Section ── */
        .section { margin-bottom: 20px; }
        .section-title {
            font-size: 11px;
            font-weight: 700;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
            margin-bottom: 8px;
        }

        /* ── Table ── */
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        thead tr { background: #f8fafc; }
        th {
            text-align: left;
            padding: 6px 8px;
            font-size: 9px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border-bottom: 1px solid #e2e8f0;
        }
        th.right, td.right { text-align: right; }
        th.center, td.center { text-align: center; }
        td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        tr:last-child td { border-bottom: none; }
        .tfoot td {
            border-top: 2px solid #e2e8f0;
            font-weight: 700;
            padding-top: 7px;
            font-size: 10px;
        }
        .badge-green  { color: #15803d; font-weight: 600; }
        .badge-amber  { color: #b45309; font-weight: 600; }
        .badge-violet { color: #6d28d9; font-weight: 600; }

        /* ── Footer ── */
        .footer {
            margin-top: 30px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #94a3b8;
        }
    </style>
</head>
<body>

{{-- ── Header ── --}}
<div class="header">
    <div class="header-left">
        @if(file_exists(public_path('images/logo2.png')))
            <img src="{{ public_path('images/logo2.png') }}" class="logo" alt="Logo">
        @elseif(file_exists(public_path('images/logo.png')))
            <img src="{{ public_path('images/logo.png') }}" class="logo" alt="Logo">
        @endif
        <div>
            <div class="brand-name">{{ $company->name }}</div>
            <div class="brand-sub">Gestão para indústrias de água</div>
        </div>
    </div>
    <div class="header-right">
        <div class="report-title">Relatório do Vendedor</div>
        <div class="report-meta">Gerado em {{ now()->format('d/m/Y \à\s H:i') }}</div>
    </div>
</div>

{{-- ── Seller info ── --}}
<div class="seller-card">
    <div>
        <div class="seller-name">{{ $seller->name }}</div>
        <div class="seller-meta">
            {{ $seller->seller_type === 'commissioned' ? 'Comissionado' : 'Revendedor' }}
            &nbsp;·&nbsp; {{ $seller->city }} / {{ $seller->state }}
            @if($seller->phone) &nbsp;·&nbsp; {{ $seller->phone }} @endif
        </div>
    </div>
    <div>
        <div class="period-label">Período do relatório</div>
        <div class="period-value">
            @if($dateFrom && $dateTo)
                {{ \Carbon\Carbon::parse($dateFrom)->format('d/m/Y') }} até {{ \Carbon\Carbon::parse($dateTo)->format('d/m/Y') }}
            @elseif($dateFrom)
                A partir de {{ \Carbon\Carbon::parse($dateFrom)->format('d/m/Y') }}
            @elseif($dateTo)
                Até {{ \Carbon\Carbon::parse($dateTo)->format('d/m/Y') }}
            @else
                Todo o período
            @endif
        </div>
    </div>
</div>

{{-- ── Totals ── --}}
@if(in_array('total_sold', $sections) || in_array('total_received', $sections) || in_array('total_pending', $sections) || in_array('commission_paid', $sections) || in_array('commission_pending', $sections))
<div class="totals-grid">
    @if(in_array('total_sold', $sections))
    <div class="total-box blue">
        <div class="total-label">Total Vendido</div>
        <div class="total-value">R$ {{ number_format($totalSold, 2, ',', '.') }}</div>
    </div>
    @endif
    @if(in_array('total_received', $sections))
    <div class="total-box green">
        <div class="total-label">Total Recebido</div>
        <div class="total-value">R$ {{ number_format($totalReceived, 2, ',', '.') }}</div>
    </div>
    @endif
    @if(in_array('total_pending', $sections))
    <div class="total-box amber">
        <div class="total-label">Total Pendente</div>
        <div class="total-value">R$ {{ number_format($totalPending, 2, ',', '.') }}</div>
    </div>
    @endif
    @if(in_array('commission_paid', $sections))
    <div class="total-box violet">
        <div class="total-label">Comissão Paga</div>
        <div class="total-value">R$ {{ number_format($totalCommissionPaid, 2, ',', '.') }}</div>
    </div>
    @endif
    @if(in_array('commission_pending', $sections))
    <div class="total-box indigo">
        <div class="total-label">Comissão Pendente</div>
        <div class="total-value">R$ {{ number_format($totalCommissionPending, 2, ',', '.') }}</div>
    </div>
    @endif
</div>
@endif

{{-- ── Sales history ── --}}
@if(in_array('sales_history', $sections) && $sales->count())
<div class="section">
    <div class="section-title">Histórico de Vendas</div>
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Produto</th>
                <th class="right">Qtd</th>
                <th class="right">Total</th>
                <th class="center">Pagamento</th>
                <th class="center">Comissão</th>
            </tr>
        </thead>
        <tbody>
            @foreach($sales as $sale)
            <tr>
                <td>{{ \Carbon\Carbon::parse($sale->sale_date)->format('d/m/Y') }}</td>
                <td>{{ $sale->product->name ?? '—' }}</td>
                <td class="right">{{ $sale->quantity }}</td>
                <td class="right">R$ {{ number_format($sale->total, 2, ',', '.') }}</td>
                <td class="center {{ $sale->payment_received ? 'badge-green' : 'badge-amber' }}">
                    {{ $sale->payment_received ? 'Recebido' : 'Pendente' }}
                </td>
                <td class="center {{ $sale->commission_paid ? 'badge-green' : ($sale->commission_total > 0 ? 'badge-amber' : '') }}">
                    {{ $sale->commission_total > 0 ? ($sale->commission_paid ? 'Paga' : 'Pendente') : '—' }}
                </td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="tfoot">
                <td colspan="3">Total</td>
                <td class="right">R$ {{ number_format($sales->sum('total'), 2, ',', '.') }}</td>
                <td></td><td></td>
            </tr>
        </tfoot>
    </table>
</div>
@endif

{{-- ── Paid commissions ── --}}
@if(in_array('commissions_paid', $sections) && $paidCommissions->count())
<div class="section">
    <div class="section-title">Comissões Pagas</div>
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Produto</th>
                <th class="right">Venda</th>
                <th class="right">%</th>
                <th class="right">Comissão</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paidCommissions as $sale)
            <tr>
                <td>{{ \Carbon\Carbon::parse($sale->sale_date)->format('d/m/Y') }}</td>
                <td>{{ $sale->product->name ?? '—' }}</td>
                <td class="right">R$ {{ number_format($sale->total, 2, ',', '.') }}</td>
                <td class="right">{{ $sale->commission_percentage }}%</td>
                <td class="right badge-green">R$ {{ number_format($sale->commission_total, 2, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="tfoot">
                <td colspan="4">Total pago</td>
                <td class="right badge-green">R$ {{ number_format($paidCommissions->sum('commission_total'), 2, ',', '.') }}</td>
            </tr>
        </tfoot>
    </table>
</div>
@endif

{{-- ── Pending commissions ── --}}
@if(in_array('commissions_pending', $sections) && $pendingCommissions->count())
<div class="section">
    <div class="section-title">Comissões Pendentes</div>
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Produto</th>
                <th class="right">Venda</th>
                <th class="right">%</th>
                <th class="right">Comissão</th>
            </tr>
        </thead>
        <tbody>
            @foreach($pendingCommissions as $sale)
            <tr>
                <td>{{ \Carbon\Carbon::parse($sale->sale_date)->format('d/m/Y') }}</td>
                <td>{{ $sale->product->name ?? '—' }}</td>
                <td class="right">R$ {{ number_format($sale->total, 2, ',', '.') }}</td>
                <td class="right">{{ $sale->commission_percentage }}%</td>
                <td class="right badge-amber">R$ {{ number_format($sale->commission_total, 2, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="tfoot">
                <td colspan="4">Total pendente</td>
                <td class="right badge-amber">R$ {{ number_format($pendingCommissions->sum('commission_total'), 2, ',', '.') }}</td>
            </tr>
        </tfoot>
    </table>
</div>
@endif

{{-- ── Paid payments ── --}}
@if(in_array('payments_paid', $sections) && $paidPayments->count())
<div class="section">
    <div class="section-title">Pagamentos Recebidos</div>
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Produto</th>
                <th class="right">Qtd</th>
                <th class="right">Valor</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paidPayments as $sale)
            <tr>
                <td>{{ \Carbon\Carbon::parse($sale->sale_date)->format('d/m/Y') }}</td>
                <td>{{ $sale->product->name ?? '—' }}</td>
                <td class="right">{{ $sale->quantity }}</td>
                <td class="right badge-green">R$ {{ number_format($sale->total, 2, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="tfoot">
                <td colspan="3">Total recebido</td>
                <td class="right badge-green">R$ {{ number_format($paidPayments->sum('total'), 2, ',', '.') }}</td>
            </tr>
        </tfoot>
    </table>
</div>
@endif

{{-- ── Pending payments ── --}}
@if(in_array('payments_pending', $sections) && $pendingPayments->count())
<div class="section">
    <div class="section-title">Pagamentos Pendentes</div>
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Produto</th>
                <th class="right">Qtd</th>
                <th class="right">Valor</th>
            </tr>
        </thead>
        <tbody>
            @foreach($pendingPayments as $sale)
            <tr>
                <td>{{ \Carbon\Carbon::parse($sale->sale_date)->format('d/m/Y') }}</td>
                <td>{{ $sale->product->name ?? '—' }}</td>
                <td class="right">{{ $sale->quantity }}</td>
                <td class="right badge-amber">R$ {{ number_format($sale->total, 2, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="tfoot">
                <td colspan="3">Total pendente</td>
                <td class="right badge-amber">R$ {{ number_format($pendingPayments->sum('total'), 2, ',', '.') }}</td>
            </tr>
        </tfoot>
    </table>
</div>
@endif

{{-- ── Footer ── --}}
<div class="footer">
    <span>{{ $company->name }} &mdash; Fonte Pro</span>
    <span>Relatório gerado automaticamente em {{ now()->format('d/m/Y \à\s H:i:s') }}</span>
</div>

</body>
</html>
