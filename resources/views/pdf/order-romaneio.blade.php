<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 5mm 7mm; }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: "DejaVu Serif", Times, serif;
            font-size: 8.5pt;
            color: #000;
        }

        /* Cada via ocupa metade da folha A4 (retrato).
           min-height (e não height) para que muitos itens empurrem o layout
           em vez de sobrepor a via de baixo. */
        .half {
            min-height: 139mm;
            /* Pedidos longos empurram a via inteira para a página seguinte
               em vez de cortá-la ao meio. */
            page-break-inside: avoid;
        }

        /* ── Canhoto (assinatura + nº do pedido) ── */
        table.stub {
            width: 100%;
            border-collapse: separate;
            border-spacing: 4px 0;
        }
        table.stub td {
            border: 1px solid #000;
            padding: 5px 8px;
            vertical-align: top;
        }
        td.stub-order {
            width: 62px;
            text-align: center;
            font-weight: bold;
            line-height: 1.3;
        }
        .stub-line { padding: 2px 0; }
        .dots { letter-spacing: -0.5px; }

        /* ── Linha pontilhada (destaque do canhoto) ── */
        .cut {
            border-top: 1px dotted #000;
            margin: 4px 0 5px;
            height: 0;
        }

        /* ── Cabeçalho (logo + dados + nº) ── */
        table.head {
            width: 100%;
            border: 1px solid #000;
            border-collapse: collapse;
        }
        table.head td { vertical-align: middle; padding: 4px 6px; }
        td.logo-cell { width: 130px; text-align: center; }
        td.logo-cell img { max-height: 46px; max-width: 120px; }
        .brand { font-size: 12pt; font-weight: bold; }
        table.info { width: 100%; border-collapse: collapse; }
        table.info td { padding: 1px 0; font-size: 8.5pt; border: none; }
        td.lbl { width: 82px; white-space: nowrap; padding-right: 8px; }
        td.num-cell {
            width: 62px;
            text-align: right;
            font-size: 15pt;
            font-weight: bold;
            vertical-align: top;
            padding-top: 6px;
        }

        /* ── Tabela de itens ── */
        table.items {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border-left: 1px solid #000;
            border-right: 1px solid #000;
        }
        table.items th,
        table.items td {
            border: 1px solid #000;
            padding: 4px 6px;
        }
        table.items th {
            background: #808080;
            color: #fff;
            font-size: 8pt;
            font-weight: bold;
            text-align: center;
            line-height: 1.15;
        }
        td.qty   { text-align: right; }
        td.money { text-align: right; }
        td.row-h { height: 20px; }

        td.gray {
            background: #808080;
            color: #fff;
            font-weight: bold;
            text-align: center;
            font-size: 8pt;
            line-height: 1.15;
        }
        td.center { text-align: center; }
        td.recebido {
            background: #808080;
            color: #fff;
            font-weight: bold;
            font-size: 8.5pt;
        }

        /* ── Divisória entre as duas vias (dobra/corte) ── */
        .fold {
            border-top: 1px dashed #666;
            text-align: center;
            font-size: 6.5pt;
            color: #666;
            margin: 3mm 0 4mm;
            height: 0;
        }
        .fold span {
            background: #fff;
            padding: 0 6px;
            position: relative;
            top: -4pt;
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

    // Quantidade sem casas decimais desnecessárias (102, 10,5 ...)
    $fmtQty = fn ($q) => rtrim(rtrim(number_format((float) $q, 3, ',', '.'), '0'), ',');

    $totalQty = $order->items->sum('quantity');

    // Linhas em branco para a via ocupar a metade da folha (e permitir anotações)
    $minRows = 9;
    $filler  = max(0, $minRows - $order->items->count());
@endphp

{{-- Via 1: com valores · Via 2: somente produtos --}}
@foreach ([true, false] as $showPrices)

    <div class="half">

        {{-- Canhoto --}}
        <table class="stub">
            <tr>
                <td>
                    <div class="stub-line">
                        Assinatura: <span class="dots">___________________________________________________________</span>
                    </div>
                    <div class="stub-line">
                        Data: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="dots">_______</span> /
                        <span class="dots">_______</span> / <span class="dots">_________</span>
                    </div>
                </td>
                <td class="stub-order">
                    Pedido<br>{{ $order->order_number }}
                </td>
            </tr>
        </table>

        <div class="cut"></div>

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
                            <td class="lbl">DATA:</td>
                            <td>{{ Carbon::parse($order->issue_date)->format('d/m/Y') }}</td>
                        </tr>
                        <tr>
                            <td class="lbl">CLIENTE:</td>
                            <td>{{ $order->customer->name ?? '' }}</td>
                        </tr>
                        <tr>
                            <td class="lbl">ENDEREÇO:</td>
                            <td>{{ $addr }}</td>
                        </tr>
                        <tr>
                            <td class="lbl">TELEFONE:</td>
                            <td>{{ $order->customer->phone ?? '' }}</td>
                        </tr>
                    </table>
                </td>
                <td class="num-cell">{{ $order->order_number }}</td>
            </tr>
        </table>

        {{-- Itens --}}
        <table class="items">
            <thead>
                <tr>
                    @if ($showPrices)
                        <th style="width: 20%;">QUANTIDADE</th>
                        <th style="width: 38%;">REFERÊNCIA</th>
                        <th style="width: 21%;">VALOR<br>UNITÁRIO</th>
                        <th style="width: 21%;">VALOR TOTAL</th>
                    @else
                        <th style="width: 20%;">QUANTIDADE</th>
                        <th style="width: 80%;">REFERÊNCIA</th>
                    @endif
                </tr>
            </thead>
            <tbody>
                @foreach ($order->items as $item)
                    <tr>
                        <td class="qty row-h">{{ $fmtQty($item->quantity) }}</td>
                        <td>{{ $item->product_name }}</td>
                        @if ($showPrices)
                            <td class="money">R$ {{ number_format($item->unit_price, 2, ',', '.') }}</td>
                            <td class="money">R$ {{ number_format($item->subtotal, 2, ',', '.') }}</td>
                        @endif
                    </tr>
                @endforeach

                @for ($i = 0; $i < $filler; $i++)
                    <tr>
                        <td class="row-h">&nbsp;</td>
                        <td>&nbsp;</td>
                        @if ($showPrices)
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                        @endif
                    </tr>
                @endfor

                {{-- Totais --}}
                <tr>
                    <td class="gray">TOTAL DE<br>PEÇAS</td>
                    @if ($showPrices)
                        <td class="center">{{ $fmtQty($totalQty) }}</td>
                        <td class="gray">TOTAL A<br>PAGAR</td>
                        <td class="money">R$ {{ number_format($order->total, 2, ',', '.') }}</td>
                    @else
                        <td class="center">{{ $fmtQty($totalQty) }}</td>
                    @endif
                </tr>

                {{-- Recebido por --}}
                <tr>
                    <td class="recebido">RECEBIDO POR:</td>
                    <td colspan="{{ $showPrices ? 3 : 1 }}">&nbsp;</td>
                </tr>
            </tbody>
        </table>

    </div>

    @if ($showPrices)
        <div class="fold"><span>dobre e corte aqui</span></div>
    @endif

@endforeach

</body>
</html>
