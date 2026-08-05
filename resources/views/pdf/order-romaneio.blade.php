<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <style>
        /* Sem margem de página: cada via é uma metade exata da A4,
           permitindo cortar a folha no meio (148,5mm). */
        @page { margin: 0; }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: "DejaVu Sans", sans-serif;
            font-size: 7.5pt;
            color: #0f172a;
        }

        table.sheet { width: 100%; border-collapse: collapse; }

        /* Metade da folha: conteúdo centralizado na vertical + borda lateral */
        td.half {
            height: 148mm;
            vertical-align: middle;
            padding: 0 11mm;
        }
        td.half.second { border-top: 1px dashed #94a3b8; }

        /* ── Canhoto (assinatura + nº do pedido) ── */
        table.stub {
            width: 100%;
            border-collapse: separate;
            border-spacing: 5px 0;
        }
        table.stub td {
            border: 1px solid #94a3b8;
            padding: 6px 9px;
            vertical-align: top;
        }
        td.stub-order {
            width: 68px;
            text-align: center;
            border-color: #0369a1;
            background: #f0f9ff;
        }
        .stub-order-lbl {
            font-size: 6pt;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 0.6px;
        }
        .stub-order-num {
            font-size: 12pt;
            font-weight: bold;
            color: #0369a1;
            line-height: 1.1;
        }
        .stub-line { padding: 2px 0; color: #334155; }
        .dots { color: #94a3b8; letter-spacing: -0.5px; }

        .tear {
            border-top: 1px dotted #94a3b8;
            margin: 5px 0 6px;
            height: 0;
        }

        /* ── Cabeçalho ── */
        table.head {
            width: 100%;
            border: 1px solid #94a3b8;
            border-top: 2px solid #0369a1;
            border-collapse: collapse;
            background: #f8fafc;
        }
        table.head td { vertical-align: middle; padding: 6px 8px; }
        td.logo-cell { width: 122px; text-align: center; }
        td.logo-cell img { max-height: 42px; max-width: 112px; }
        .brand {
            font-size: 11pt;
            font-weight: bold;
            color: #0369a1;
            letter-spacing: 0.3px;
        }
        table.info { width: 100%; border-collapse: collapse; }
        table.info td { padding: 1.5px 0; border: none; font-size: 7.5pt; }
        td.lbl {
            width: 74px;
            white-space: nowrap;
            padding-right: 8px;
            color: #64748b;
            font-size: 6.5pt;
            letter-spacing: 0.4px;
        }
        td.val { color: #0f172a; font-weight: bold; }
        td.num-cell { width: 78px; text-align: right; vertical-align: top; }
        .num {
            font-size: 17pt;
            font-weight: bold;
            color: #0369a1;
            line-height: 1;
        }
        .via-tag {
            font-size: 5.5pt;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding-top: 3px;
        }

        /* ── Itens ── */
        table.items {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        table.items th {
            background: #0369a1;
            color: #fff;
            font-size: 6.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: center;
            padding: 5px 6px;
            border: 1px solid #0369a1;
            line-height: 1.2;
        }
        table.items td {
            border: 1px solid #cbd5e1;
            padding: 4px 7px;
            height: 19px;
        }
        td.qty   { text-align: right; font-weight: bold; }
        td.money { text-align: right; }
        td.ref   { color: #0f172a; }

        /* Totais / recebido */
        td.tot-lbl {
            background: #e0f2fe;
            color: #075985;
            font-weight: bold;
            text-align: center;
            font-size: 6.5pt;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            line-height: 1.2;
            border-color: #94a3b8;
        }
        td.tot-val {
            text-align: center;
            font-weight: bold;
            font-size: 8.5pt;
            border-color: #94a3b8;
        }
        td.tot-money {
            text-align: right;
            font-weight: bold;
            font-size: 9pt;
            color: #0369a1;
            border-color: #94a3b8;
        }
        td.receb {
            background: #e0f2fe;
            color: #075985;
            font-weight: bold;
            font-size: 7pt;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border-color: #94a3b8;
        }

        /* ── Rodapé discreto com a marca Fonte Pro ── */
        table.foot { width: 100%; border-collapse: collapse; margin-top: 4px; }
        table.foot td { border: none; padding: 0; vertical-align: middle; }
        td.foot-cut { font-size: 5.5pt; color: #94a3b8; letter-spacing: 0.3px; }
        td.foot-brand { text-align: right; white-space: nowrap; }
        td.foot-brand img { height: 13px; vertical-align: middle; }
        .fp {
            font-size: 5.5pt;
            color: #94a3b8;
            letter-spacing: 0.4px;
            vertical-align: middle;
            padding-left: 3px;
        }
    </style>
</head>
<body>

@php
    use Illuminate\Support\Carbon;

    $addr = collect([
        $order->delivery_street,
        $order->delivery_number,
        $order->delivery_neighborhood,
        $order->delivery_city,
        $order->delivery_state,
    ])->filter()->implode(', ');

    $logoPath = ($company->logo && file_exists(public_path('storage/' . $company->logo)))
        ? public_path('storage/' . $company->logo)
        : null;

    $fpLogo = file_exists(public_path('images/logo2.png'))
        ? public_path('images/logo2.png')
        : null;

    $fmtQty = fn ($q) => rtrim(rtrim(number_format((float) $q, 3, ',', '.'), '0'), ',');

    $totalQty = $order->items->sum('quantity');

    // Linhas em branco para equilibrar a via na metade da folha
    $minRows = 8;
    $filler  = max(0, $minRows - $order->items->count());
@endphp

<table class="sheet">
@foreach ([true, false] as $showPrices)
    <tr>
        <td class="half {{ $loop->last ? 'second' : '' }}">

            {{-- Canhoto --}}
            <table class="stub">
                <tr>
                    <td>
                        <div class="stub-line">
                            Assinatura: <span class="dots">_______________________________________________________</span>
                        </div>
                        <div class="stub-line">
                            Data: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="dots">_______</span> /
                            <span class="dots">_______</span> / <span class="dots">_________</span>
                        </div>
                    </td>
                    <td class="stub-order">
                        <div class="stub-order-lbl">Pedido</div>
                        <div class="stub-order-num">{{ $order->order_number }}</div>
                    </td>
                </tr>
            </table>

            <div class="tear"></div>

            {{-- Cabeçalho --}}
            <table class="head">
                <tr>
                    <td class="logo-cell">
                        @if ($logoPath)
                            <img src="{{ $logoPath }}" alt="">
                        @else
                            <span class="brand">{{ $company->fantasy_name ?: $company->company_name }}</span>
                        @endif
                    </td>
                    <td>
                        <table class="info">
                            <tr>
                                <td class="lbl">DATA</td>
                                <td class="val">{{ Carbon::parse($order->issue_date)->format('d/m/Y') }}</td>
                            </tr>
                            <tr>
                                <td class="lbl">CLIENTE</td>
                                <td class="val">{{ $order->customer->name ?? '' }}</td>
                            </tr>
                            <tr>
                                <td class="lbl">ENDEREÇO</td>
                                <td>{{ $addr }}</td>
                            </tr>
                            <tr>
                                <td class="lbl">TELEFONE</td>
                                <td>{{ $order->customer->phone ?? '' }}</td>
                            </tr>
                        </table>
                    </td>
                    <td class="num-cell">
                        <div class="num">{{ $order->order_number }}</div>
                        <div class="via-tag">{{ $showPrices ? 'Via com valores' : 'Via de entrega' }}</div>
                    </td>
                </tr>
            </table>

            {{-- Itens --}}
            <table class="items">
                <thead>
                    <tr>
                        @if ($showPrices)
                            <th style="width: 19%;">Quantidade</th>
                            <th style="width: 39%;">Referência</th>
                            <th style="width: 21%;">Valor unitário</th>
                            <th style="width: 21%;">Valor total</th>
                        @else
                            <th style="width: 19%;">Quantidade</th>
                            <th style="width: 81%;">Referência</th>
                        @endif
                    </tr>
                </thead>
                <tbody>
                    @foreach ($order->items as $item)
                        <tr>
                            <td class="qty">{{ $fmtQty($item->quantity) }}</td>
                            <td class="ref">{{ $item->product_name }}</td>
                            @if ($showPrices)
                                <td class="money">R$ {{ number_format($item->unit_price, 2, ',', '.') }}</td>
                                <td class="money">R$ {{ number_format($item->subtotal, 2, ',', '.') }}</td>
                            @endif
                        </tr>
                    @endforeach

                    @for ($i = 0; $i < $filler; $i++)
                        <tr>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            @if ($showPrices)
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                            @endif
                        </tr>
                    @endfor

                    <tr>
                        <td class="tot-lbl">Total de peças</td>
                        @if ($showPrices)
                            <td class="tot-val">{{ $fmtQty($totalQty) }}</td>
                            <td class="tot-lbl">Total a pagar</td>
                            <td class="tot-money">R$ {{ number_format($order->total, 2, ',', '.') }}</td>
                        @else
                            <td class="tot-val">{{ $fmtQty($totalQty) }}</td>
                        @endif
                    </tr>

                    <tr>
                        <td class="receb">Recebido por</td>
                        <td colspan="{{ $showPrices ? 3 : 1 }}">&nbsp;</td>
                    </tr>
                </tbody>
            </table>

            {{-- Rodapé: marca Fonte Pro (discreta) --}}
            <table class="foot">
                <tr>
                    <td class="foot-cut">{{ $loop->first ? 'Dobre e corte na linha tracejada' : '' }}</td>
                    <td class="foot-brand">
                        @if ($fpLogo)
                            <img src="{{ $fpLogo }}" alt="">
                        @endif
                        <span class="fp">FONTE PRO</span>
                    </td>
                </tr>
            </table>

        </td>
    </tr>
@endforeach
</table>

</body>
</html>
