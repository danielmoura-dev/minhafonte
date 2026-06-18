<?php

namespace App\Http\Controllers\Sale;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sale\StoreSaleRequest;
use App\Http\Requests\Sale\UpdateSaleRequest;
use App\Jobs\SendSellerPushJob;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Seller;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Sale::class);

        $sales = Sale::fromCompany(Auth::id())
            ->with(['seller', 'product'])
            ->when($request->seller_id, fn ($q, $v) =>
                $q->where('seller_id', $v)
            )
            ->when($request->seller_type, fn ($q, $v) =>
                $q->whereHas('seller', fn ($sq) => $sq->where('seller_type', $v))
            )
            ->when($request->date_from, fn ($q, $v) =>
                $q->whereDate('sale_date', '>=', $v)
            )
            ->when($request->date_to, fn ($q, $v) =>
                $q->whereDate('sale_date', '<=', $v)
            )
            ->when($request->payment_received !== null && $request->payment_received !== '', fn ($q) =>
                $q->where('payment_received', filter_var($request->payment_received, FILTER_VALIDATE_BOOLEAN))
            )
            ->when($request->commission_paid !== null && $request->commission_paid !== '', fn ($q) =>
                $q->where('commission_paid', filter_var($request->commission_paid, FILTER_VALIDATE_BOOLEAN))
            )
            ->orderByDesc('sale_date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $sellers = Seller::fromCompany(Auth::id())
            ->orderBy('name')
            ->get(['id', 'name', 'seller_type']);

        return Inertia::render('Sales/Index', [
            'sales'   => $sales,
            'sellers' => $sellers,
            'filters' => $request->only([
                'seller_id', 'seller_type', 'date_from',
                'date_to', 'payment_received', 'commission_paid',
            ]),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Sale::class);

        $sellers = Seller::fromCompany(Auth::id())
            ->orderBy('name')
            ->get(['id', 'name', 'seller_type', 'default_commission']);

        $products = Product::fromCompany(Auth::id())
            ->orderBy('name')
            ->get(['id', 'name', 'default_price']);

        return Inertia::render('Sales/Create', [
            'sellers'  => $sellers,
            'products' => $products,
        ]);
    }

    public function store(StoreSaleRequest $request): RedirectResponse
    {
        $this->authorize('create', Sale::class);

        $data = $request->validated();
        $data['company_id'] = Auth::id();

        $data['total'] = round($data['unit_price'] * $data['quantity'], 2);

        if (!empty($data['commission_percentage'])) {
            $data['commission_total'] = round($data['total'] * ($data['commission_percentage'] / 100), 2);
        }

        if (!empty($data['payment_received'])) {
            $data['payment_received_at'] = now();
        }

        if (!empty($data['commission_paid'])) {
            $data['commission_paid_at'] = now();
        }

        $sale = Sale::create($data);

        AuditService::log(
            event:       'sale.created',
            auditable:   $sale,
            newValues:   ['seller_id' => $sale->seller_id, 'total' => $sale->total],
            description: "Venda registrada. Total: R$ {$sale->total}",
        );

        $productName = $sale->product?->name ?? 'produto';
        $totalFormatted = 'R$ ' . number_format((float) $sale->total, 2, ',', '.');
        SendSellerPushJob::dispatch(
            $sale->seller_id,
            'Nova venda registrada',
            "{$totalFormatted} — {$productName}",
            '/vendedor/fabrica',
        );

        return redirect()
            ->route('sales.index')
            ->with('success', 'Venda registrada com sucesso!');
    }

    public function edit(Sale $sale): Response
    {
        $this->authorize('update', $sale);

        $sellers = Seller::fromCompany(Auth::id())
            ->orderBy('name')
            ->get(['id', 'name', 'seller_type', 'default_commission']);

        $products = Product::fromCompany(Auth::id())
            ->orderBy('name')
            ->get(['id', 'name', 'default_price']);

        return Inertia::render('Sales/Edit', [
            'sale'     => $sale->load(['seller', 'product']),
            'sellers'  => $sellers,
            'products' => $products,
        ]);
    }

    public function update(UpdateSaleRequest $request, Sale $sale): RedirectResponse
    {
        $this->authorize('update', $sale);

        $data = $request->validated();

        $data['total'] = round($data['unit_price'] * $data['quantity'], 2);

        if (!empty($data['commission_percentage'])) {
            $data['commission_total'] = round($data['total'] * ($data['commission_percentage'] / 100), 2);
        } else {
            $data['commission_total'] = null;
        }

        if (!empty($data['payment_received']) && !$sale->payment_received) {
            $data['payment_received_at'] = now();
        } elseif (empty($data['payment_received'])) {
            $data['payment_received_at'] = null;
        }

        if (!empty($data['commission_paid']) && !$sale->commission_paid) {
            $data['commission_paid_at'] = now();
        } elseif (empty($data['commission_paid'])) {
            $data['commission_paid_at'] = null;
        }

        $sale->update($data);

        AuditService::log(
            event:       'sale.updated',
            auditable:   $sale,
            description: "Venda #{$sale->id} atualizada.",
        );

        return redirect()
            ->route('sales.index')
            ->with('success', 'Venda atualizada com sucesso!');
    }

    public function toggle(Request $request, Sale $sale): RedirectResponse
    {
        $this->authorize('update', $sale);

        $field = $request->input('field');

        if (!in_array($field, ['payment_received', 'commission_paid'])) {
            abort(422);
        }

        $wasAlreadyPaid = $sale->$field;
        $sale->$field   = !$wasAlreadyPaid;

        if ($field === 'payment_received') {
            $sale->payment_received_at = $sale->payment_received ? now() : null;
        } else {
            $sale->commission_paid_at = $sale->commission_paid ? now() : null;
        }

        $sale->save();

        // Notifica quando pagamento é confirmado
        if ($field === 'payment_received' && $sale->payment_received) {
            $totalFormatted = 'R$ ' . number_format((float) $sale->total, 2, ',', '.');
            SendSellerPushJob::dispatch(
                $sale->seller_id,
                'Pagamento recebido',
                "{$totalFormatted} confirmado",
                '/vendedor/fabrica',
            );
        }

        return back();
    }

    public function destroy(Sale $sale): RedirectResponse
    {
        $this->authorize('delete', $sale);

        AuditService::log(
            event:       'sale.deleted',
            auditable:   $sale,
            description: "Venda #{$sale->id} removida.",
        );

        $sale->delete();

        return redirect()
            ->route('sales.index')
            ->with('success', 'Venda removida com sucesso!');
    }
}