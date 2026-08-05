<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReceivablesFeaturesTest extends TestCase
{
    use RefreshDatabase;

    private function company(): Company
    {
        return Company::create([
            'company_name' => 'Teste', 'fantasy_name' => 'Teste', 'cnpj' => '1',
            'email' => 't@e.com', 'password' => bcrypt('x'),
        ]);
    }

    private function order(Company $company, ?string $dueDate, string $status = 'pending'): Order
    {
        $customer = Customer::create([
            'company_id' => $company->id, 'type' => 'pf', 'name' => 'cliente', 'is_active' => true,
        ]);

        return Order::create([
            'company_id' => $company->id, 'customer_id' => $customer->id,
            'order_number' => random_int(1, 99999), 'issue_date' => now()->toDateString(),
            'due_date' => $dueDate, 'items_count' => 1, 'total' => 100,
            'stock_action' => 'none', 'payment_status' => $status, 'paid_total' => 0,
        ]);
    }

    public function test_due_status_classification(): void
    {
        $company = $this->company();

        $overdue  = $this->order($company, now()->subDays(3)->toDateString());
        $today    = $this->order($company, now()->toDateString());
        $upcoming = $this->order($company, now()->addDays(5)->toDateString());
        $noDue    = $this->order($company, null);
        $paid     = $this->order($company, now()->toDateString(), 'paid');

        $this->assertSame('overdue', $overdue->due_status);
        $this->assertSame('due_today', $today->due_status);
        $this->assertSame('upcoming', $upcoming->due_status);
        $this->assertNull($noDue->due_status);
        // Venda quitada não entra no alerta mesmo vencendo hoje
        $this->assertNull($paid->due_status);

        $this->assertSame(-3, $overdue->days_until_due);
        $this->assertSame(0, $today->days_until_due);
        $this->assertSame(5, $upcoming->days_until_due);

        fwrite(STDERR, "\nvencimento: vencido/hoje/futuro classificados; venda paga fora do alerta\n");
    }

    public function test_due_alert_counts_ignore_paid_and_null(): void
    {
        $company = $this->company();

        $this->order($company, now()->subDays(1)->toDateString());
        $this->order($company, now()->subDays(2)->toDateString());
        $this->order($company, now()->toDateString());
        $this->order($company, now()->addDay()->toDateString());   // futuro: fora
        $this->order($company, null);                               // sem vencimento: fora
        $this->order($company, now()->toDateString(), 'paid');      // paga: fora

        $today = now()->toDateString();

        $dueToday = Order::fromCompany($company->id)->dueAlert()->whereDate('due_date', $today)->count();
        $overdue  = Order::fromCompany($company->id)->dueAlert()->whereDate('due_date', '<', $today)->count();

        $this->assertSame(1, $dueToday);
        $this->assertSame(2, $overdue);

        fwrite(STDERR, "alerta: {$dueToday} vence hoje, {$overdue} vencidas (ignora paga/sem vencimento/futura)\n");
    }

    public function test_payment_stores_receipt_file(): void
    {
        Storage::fake('public');

        $company = $this->company();
        $order   = $this->order($company, null);

        $this->actingAs($company)->post(route('receivables.payments.store', $order), [
            'amount'  => 50,
            'method'  => 'cheque',
            'paid_at' => now()->format('Y-m-d H:i'),
            'receipt' => UploadedFile::fake()->image('cheque.jpg', 1200, 800),
        ])->assertRedirect();

        $payment = $order->payments()->first();

        $this->assertNotNull($payment->receipt_path);
        Storage::disk('public')->assertExists($payment->receipt_path);
        $this->assertStringContainsString('receipts/', $payment->receipt_path);
        $this->assertStringContainsString('/storage/', $payment->receipt_url);

        fwrite(STDERR, "comprovante: salvo em {$payment->receipt_path}\n");
    }

    public function test_receipt_can_be_attached_later_and_replaced(): void
    {
        Storage::fake('public');

        $company = $this->company();
        $order   = $this->order($company, null);

        // Pagamento sem comprovante
        $this->actingAs($company)->post(route('receivables.payments.store', $order), [
            'amount' => 50, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i'),
        ])->assertRedirect();

        $payment = $order->payments()->first();
        $this->assertNull($payment->receipt_path);

        // Anexa depois
        $this->actingAs($company)->post(route('receivables.receipt.store', $payment), [
            'receipt' => UploadedFile::fake()->create('pix.pdf', 100, 'application/pdf'),
        ])->assertRedirect();

        $first = $payment->fresh()->receipt_path;
        $this->assertNotNull($first);
        $this->assertTrue($payment->fresh()->receipt_is_pdf);

        // Troca: o arquivo antigo é removido
        $this->actingAs($company)->post(route('receivables.receipt.store', $payment), [
            'receipt' => UploadedFile::fake()->image('novo.png'),
        ])->assertRedirect();

        $second = $payment->fresh()->receipt_path;
        $this->assertNotSame($first, $second);
        Storage::disk('public')->assertMissing($first);
        Storage::disk('public')->assertExists($second);

        fwrite(STDERR, "comprovante: anexado depois e substituído (arquivo antigo removido)\n");
    }

    public function test_receipt_of_another_company_is_forbidden(): void
    {
        Storage::fake('public');

        $owner   = $this->company();
        $order   = $this->order($owner, null);
        $this->actingAs($owner)->post(route('receivables.payments.store', $order), [
            'amount' => 10, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i'),
        ]);
        $payment = $order->payments()->first();

        $intruder = Company::create([
            'company_name' => 'Outra', 'fantasy_name' => 'Outra', 'cnpj' => '2',
            'email' => 'o@e.com', 'password' => bcrypt('x'),
        ]);

        $this->actingAs($intruder)->post(route('receivables.receipt.store', $payment), [
            'receipt' => UploadedFile::fake()->image('x.jpg'),
        ])->assertForbidden();

        fwrite(STDERR, "comprovante: outra empresa bloqueada (403)\n");
    }
}
