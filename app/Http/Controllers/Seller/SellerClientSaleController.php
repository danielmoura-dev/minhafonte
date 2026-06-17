<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\ClientSale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SellerClientSaleController extends Controller
{
    public function index(): Response
    {
        $seller = auth('seller')->user();

        $sales = $seller->clientSales()
            ->with('client')
            ->orderByDesc('sale_date')
            ->get();

        $clients = $seller->clients()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $summary = [
            'total'    => $sales->sum('amount'),
            'received' => $sales->where('payment_received', true)->sum('amount'),
            'pending'  => $sales->where('payment_received', false)->sum('amount'),
        ];

        return Inertia::render('Seller/Vendas', [
            'sales'   => $sales,
            'clients' => $clients,
            'summary' => $summary,
        ]);
    }

    public function store(Request $request)
    {
        $seller = auth('seller')->user();

        $data = $request->validate([
            'client_id'        => 'required|exists:clients,id',
            'description'      => 'required|string|max:255',
            'sale_date'        => 'required|date',
            'amount'           => 'required|numeric|min:0.01',
            'payment_received' => 'boolean',
            'notes'            => 'nullable|string',
        ], [
            'client_id.required'   => 'Selecione um cliente.',
            'client_id.exists'     => 'Cliente inválido.',
            'description.required' => 'A descrição é obrigatória.',
            'description.max'      => 'A descrição deve ter no máximo 255 caracteres.',
            'sale_date.required'   => 'A data é obrigatória.',
            'sale_date.date'       => 'Data inválida.',
            'amount.required'      => 'O valor é obrigatório.',
            'amount.numeric'       => 'Informe um valor numérico.',
            'amount.min'           => 'O valor deve ser maior que zero.',
        ]);

        // Security: ensure client belongs to this seller
        abort_if(
            $seller->clients()->where('id', $data['client_id'])->doesntExist(),
            403
        );

        if (!empty($data['payment_received'])) {
            $data['payment_received_at'] = now();
        }

        $seller->clientSales()->create($data);

        return back()->with('success', 'Venda registrada com sucesso!');
    }

    public function destroy(ClientSale $sale)
    {
        abort_if($sale->seller_id !== auth('seller')->id(), 403);

        $sale->delete();

        return back()->with('success', 'Venda removida.');
    }

    public function toggle(ClientSale $sale)
    {
        abort_if($sale->seller_id !== auth('seller')->id(), 403);

        $sale->update([
            'payment_received'    => !$sale->payment_received,
            'payment_received_at' => !$sale->payment_received ? now() : null,
        ]);

        return back()->with('success', $sale->payment_received ? 'Pagamento marcado!' : 'Pagamento desmarcado.');
    }
}
