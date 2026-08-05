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

        .totals { width: 100%; border-collapse: separate; border-spacing: 7px 0; margin-bottom: 18px; }
        .totals td { border-radius: 6px; padding: 9px 11px; text-align: center; width: 25%; }
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
        .owing { color: #b45309; font-weight: 700; }
        .muted { color: #94a3b8; }

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
    $brand = $company->fantasy_name ?: $company->company_name;

    $sumBought = $customers->sum(fn ($c) => (float) $c->total_bought);
    $sumPaid   = $customers->sum(fn ($c) => (float) $c->total_paid);
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
        <div class="report-title">{{ $onlyOwing ? 'Clientes com Saldo em Aberto' : 'Resumo de Clientes' }}</div>
        <div class="report-meta">Gerado em {{ now()->format('d/m/Y \à\s H:i') }}</div>
    </div>
</div>

<table class="totals">
    <tr>
        <td class="t-gray">
            <div class="t-label">Clientes</div>
            <div class="t-value">{{ $stats['customers'] }}</div>
        </td>
        <td class="t-blue">
            <div class="t-label">Total vendido</div>
            <div class="t-value">{{ $fmt($stats['total_sold']) }}</div>
        </td>
        <td class="t-green">
            <div class="t-label">Recebido</div>
            <div class="t-value">{{ $fmt($stats['total_sold'] - $stats['total_open']) }}</div>
        </td>
        <td class="t-amber">
            <div class="t-label">Em aberto</div>
            <div class="t-value">{{ $fmt($stats['total_open']) }}</div>
        </td>
    </tr>
</table>

<div class="section-title">
    {{ $onlyOwing ? 'Clientes devendo' : 'Carteira de clientes' }} ({{ $customers->count() }})
</div>

@if ($customers->isEmpty())
    <p style="color:#94a3b8; font-size:9.5px; padding:8px 0;">Nenhum cliente encontrado.</p>
@else
    <table class="data">
        <thead>
            <tr>
                <th>Cliente</th>
                <th style="width:95px;">Telefone</th>
                <th style="width:105px;">Cidade</th>
                <th class="center" style="width:48px;">Compras</th>
                <th class="right" style="width:78px;">Total</th>
                <th class="right" style="width:78px;">Pago</th>
                <th class="right" style="width:78px;">Em aberto</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($customers as $c)
                @php $open = (float) $c->total_bought - (float) $c->total_paid; @endphp
                <tr>
                    <td>
                        {{ $c->name }}
                        @unless ($c->is_active) <span class="muted">(inativo)</span> @endunless
                    </td>
                    <td>{{ $c->phone ?: '—' }}</td>
                    <td>{{ collect([$c->city, $c->state])->filter()->implode(' / ') ?: '—' }}</td>
                    <td class="center">{{ $c->orders_count }}</td>
                    <td class="right">{{ $fmt($c->total_bought) }}</td>
                    <td class="right">{{ $fmt($c->total_paid) }}</td>
                    <td class="right {{ $open > 0 ? 'owing' : '' }}">{{ $fmt($open) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="tfoot">
                <td colspan="4">Total</td>
                <td class="right">{{ $fmt($sumBought) }}</td>
                <td class="right">{{ $fmt($sumPaid) }}</td>
                <td class="right">{{ $fmt($sumBought - $sumPaid) }}</td>
            </tr>
        </tfoot>
    </table>
@endif

<div class="footer">{{ $brand }} · Relatório gerado pelo Fonte Pro</div>

</body>
</html>
