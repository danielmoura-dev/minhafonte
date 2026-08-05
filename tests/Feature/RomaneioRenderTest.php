<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RomaneioRenderTest extends TestCase
{
    use RefreshDatabase;

    private function makeOrder(int $itemCount): Order
    {
        $company = Company::create([
            'company_name' => 'zilumina agua ltda', 'fantasy_name' => 'zilumina', 'cnpj' => '11222333000144',
            'email' => 'r@t.com', 'password' => bcrypt('x'),
            'phone' => '(85) 99999-8888', 'address' => 'rua das fontes, 100',
            'city' => 'fortaleza', 'state' => 'CE',
        ]);

        $customer = Customer::create([
            'company_id' => $company->id, 'type' => 'pf', 'name' => 'leandro do alto luminoso',
            'phone' => '(85) 98888-7777', 'is_active' => true,
        ]);

        $order = Order::create([
            'company_id' => $company->id, 'customer_id' => $customer->id, 'order_number' => 3825,
            'issue_date' => '2026-08-04', 'items_count' => $itemCount, 'total' => 0,
            'stock_action' => 'none', 'payment_status' => 'pending', 'paid_total' => 0,
            'delivery_neighborhood' => 'alto luminoso',
        ]);

        for ($i = 1; $i <= $itemCount; $i++) {
            $order->items()->create([
                'product_name' => "produto {$i}", 'unit_price' => 2.00,
                'quantity' => 10 * $i, 'subtotal' => 20.00 * $i,
            ]);
        }

        $order->update(['total' => $order->items()->sum('subtotal')]);

        return $order->load(['customer', 'items']);
    }

    private function render(Order $order): string
    {
        return Pdf::loadView('pdf.order-romaneio', [
            'order'   => $order,
            'company' => $order->company,
        ])->setPaper('a4', 'portrait')->output();
    }

    public function test_romaneio_fits_one_page_with_both_vias(): void
    {
        $pdf = $this->render($this->makeOrder(2));

        $this->assertStringStartsWith('%PDF', $pdf);
        // Pedido comum: as duas vias cabem numa única folha A4 (dobrar e cortar).
        $this->assertSame(1, substr_count($pdf, '/Type /Page') - substr_count($pdf, '/Type /Pages'));
    }

    public function test_romaneio_renders_long_order(): void
    {
        $pdf = $this->render($this->makeOrder(12));

        // Pedido longo continua gerando PDF válido (vias inteiras, sem corte no meio).
        $this->assertStringStartsWith('%PDF', $pdf);
    }
}
