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
        .page { padding: 28px 32px; }

        /* Header */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 14px;
            border-bottom: 3px solid #0284c7;
            margin-bottom: 18px;
        }
        .header-left { display: flex; align-items: center; }
        .logo { height: 52px; max-width: 160px; margin-right: 14px; }
        .brand-name { font-size: 17px; font-weight: 700; color: #0284c7; }
        .brand-sub  { font-size: 9.5px; color: #64748b; margin-top: 2px; line-height: 1.4; }
        .doc-box { text-align: right; }
        .doc-title { font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: 1px; }
        .doc-number { font-size: 13px; font-weight: 700; color: #0284c7; margin-top: 3px; }
        .doc-date { font-size: 10px; color: #64748b; margin-top: 3px; }

        /* Cliente */
        .info-card {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 18px;
        }
        .info-label { font-size: 8.5px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { font-size: 12px; font-weight: 700; color: #0369a1; margin-top: 1px; }
        .info-line { font-size: 10px; color: #475569; margin-top: 3px; }

        /* Tabela */
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        thead th {
            background: #0284c7;
            color: #fff;
            font-size: 9.5px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding: 8px 10px;
            text-align: left;
        }
        thead th.right { text-align: right; }
        thead th.center { text-align: center; }
        tbody td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10.5px; }
        tbody td.right { text-align: right; }
        tbody td.center { text-align: center; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        .prod-code { font-size: 8.5px; color: #94a3b8; }

        /* Rodapé */
        .footer-grid { display: flex; justify-content: space-between; margin-top: 6px; }
        .totals { width: 46%; }
        .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; }
        .totals-row.grand { border-top: 2px solid #0f172a; margin-top: 4px; padding-top: 8px; font-size: 14px; font-weight: 700; }
        .totals-label { color: #475569; }
        .totals-value { font-weight: 700; color: #0f172a; }

        .sign-area { margin-top: 48px; }
        .sign-row { display: flex; justify-content: space-between; }
        .sign-box { width: 46%; text-align: center; }
        .sign-line { border-top: 1px solid #475569; padding-top: 5px; font-size: 9.5px; color: #64748b; }
    </style>
</head>
<body>
<div class="page">

    <div class="header">
        <div class="header-left">
            @if($company->logo && file_exists(public_path('storage/'.$company->logo)))
                <img src="{{ public_path('storage/'.$company->logo) }}" class="logo" alt="">
            @endif
            <div>
                <div class="brand-name">{{ $company->fantasy_name ?: $company->company_name }}</div>
                <div class="brand-sub">
                    @if($company->address){{ $company->address }}<br>@endif
                    @if($company->city){{ $company->city }}@if($company->state)/{{ $company->state }}@endif @endif
                    @if($company->phone) &middot; {{ $company->phone }}@endif
                </div>
            </div>
        </div>
        <div class="doc-box">
            <div class="doc-title">ROMANEIO</div>
            <div class="doc-number">Pedido #{{ $order->order_number }}</div>
            <div class="doc-date">{{ \Illuminate\Support\Carbon::parse($order->issue_date)->format('d/m/Y') }}</div>
        </div>
    </div>

    <div class="info-card">
        <div class="info-label">Cliente</div>
        <div class="info-value">{{ $order->customer->name ?? '—' }}</div>
        @if($order->customer && $order->customer->phone)
            <div class="info-line">Telefone: {{ $order->customer->phone }}</div>
        @endif
        @php
            $addr = collect([
                $order->delivery_street, $order->delivery_number, $order->delivery_neighborhood,
                $order->delivery_city, $order->delivery_state,
            ])->filter()->implode(', ');
        @endphp
        @if($addr)
            <div class="info-line">Endereço: {{ $addr }}</div>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th class="center" style="width:60px;">Qtd</th>
                <th>Produto</th>
                <th class="right" style="width:100px;">Vlr Unitário</th>
                <th class="right" style="width:110px;">Vlr Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
                <tr>
                    <td class="center">{{ rtrim(rtrim(number_format($item->quantity, 3, ',', '.'), '0'), ',') }}</td>
                    <td>
                        {{ $item->product_name }}
                        @if($item->product_code)<div class="prod-code">Cód. {{ $item->product_code }}</div>@endif
                    </td>
                    <td class="right">R$ {{ number_format($item->unit_price, 2, ',', '.') }}</td>
                    <td class="right">R$ {{ number_format($item->subtotal, 2, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer-grid">
        <div></div>
        <div class="totals">
            <div class="totals-row">
                <span class="totals-label">Total de peças</span>
                <span class="totals-value">{{ rtrim(rtrim(number_format($order->items->sum('quantity'), 3, ',', '.'), '0'), ',') }}</span>
            </div>
            <div class="totals-row grand">
                <span>Valor total</span>
                <span>R$ {{ number_format($order->total, 2, ',', '.') }}</span>
            </div>
        </div>
    </div>

    <div class="sign-area">
        <div class="sign-row">
            <div class="sign-box">
                <div class="sign-line">Recebido por</div>
            </div>
            <div class="sign-box">
                <div class="sign-line">Assinatura &middot; Data</div>
            </div>
        </div>
    </div>

</div>
</body>
</html>
