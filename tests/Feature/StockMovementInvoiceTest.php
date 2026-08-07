<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Duas mudanças na movimentação de estoque:
 *  - valor unitário pago aceita 3 casas decimais (decimal(10,2) arredondava
 *    R$ 0,067 para 0,07 silenciosamente);
 *  - compra pode anexar a nota fiscal, do mesmo jeito que o comprovante em
 *    Recebimentos — só faz sentido em compra, então fica de fora em outros
 *    motivos mesmo que um arquivo seja enviado.
 */
class StockMovementInvoiceTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->company = Company::create([
            'company_name' => 'Zilumina', 'fantasy_name' => 'Zilumina', 'cnpj' => '1',
            'email' => 'empresa@teste.com', 'password' => bcrypt('x'),
        ]);

        $this->supplier = Supplier::create([
            'company_id' => $this->company->id, 'name' => 'FORNECEDOR X', 'active' => true,
        ]);

        $this->actingAsCompany($this->company);
    }

    private function rawMaterial(): RawMaterial
    {
        return RawMaterial::create([
            'company_id' => $this->company->id, 'code' => 'MP1', 'name' => 'TAMPA',
            'unit' => 'un', 'controls_stock' => true, 'current_price' => 1,
            'min_quantity' => 0, 'current_stock' => 100, 'active' => true,
        ]);
    }

    private function product(): Product
    {
        return Product::create([
            'company_id' => $this->company->id, 'code' => 'P1', 'name' => 'GARRAFAO 20L',
            'default_price' => 10, 'controls_stock' => true, 'min_quantity' => 0,
            'current_stock' => 50, 'active' => true,
        ]);
    }

    public function test_valor_unitario_com_3_casas_decimais_e_preservado(): void
    {
        $material = $this->rawMaterial();

        $this->post(route('raw-materials.movements.store'), [
            'raw_material_id' => $material->id,
            'type'            => 'entrada',
            'reason'          => 'compra',
            'quantity'        => 1000,
            'supplier_id'     => $this->supplier->id,
            'unit_price'      => '0.067',
        ])->assertRedirect(route('raw-materials.index'));

        $movement = \App\Models\RawMaterialMovement::where('raw_material_id', $material->id)->first();

        $this->assertSame('0.067', (string) $movement->unit_price);

        fwrite(STDERR, "\nvalor unitario: 0,067 gravado sem arredondar para 0,07\n");
    }

    public function test_produto_tambem_aceita_3_casas_decimais(): void
    {
        $product = $this->product();

        $this->post(route('products.movements.store'), [
            'product_id'  => $product->id,
            'type'        => 'entrada',
            'reason'      => 'compra',
            'quantity'    => 500,
            'supplier_id' => $this->supplier->id,
            'unit_price'  => '0.067',
        ])->assertRedirect(route('products.index'));

        $movement = \App\Models\ProductMovement::where('product_id', $product->id)->first();

        $this->assertSame('0.067', (string) $movement->unit_price);

        fwrite(STDERR, "produto: valor unitario 0,067 também preservado\n");
    }

    public function test_compra_de_materia_prima_anexa_nota_fiscal(): void
    {
        $material = $this->rawMaterial();
        $invoice  = UploadedFile::fake()->create('nota.pdf', 200, 'application/pdf');

        $this->post(route('raw-materials.movements.store'), [
            'raw_material_id' => $material->id,
            'type'            => 'entrada',
            'reason'          => 'compra',
            'quantity'        => 10,
            'supplier_id'     => $this->supplier->id,
            'unit_price'      => '5.00',
            'invoice'         => $invoice,
        ])->assertRedirect();

        $movement = \App\Models\RawMaterialMovement::where('raw_material_id', $material->id)->first();

        $this->assertNotNull($movement->invoice_path);
        $this->assertTrue($movement->invoice_is_pdf);
        Storage::disk('public')->assertExists($movement->invoice_path);

        fwrite(STDERR, "\nnota fiscal: anexada numa compra de matéria-prima\n");
    }

    public function test_compra_de_produto_anexa_nota_fiscal(): void
    {
        $product = $this->product();
        $invoice = UploadedFile::fake()->image('nota.jpg');

        $this->post(route('products.movements.store'), [
            'product_id'  => $product->id,
            'type'        => 'entrada',
            'reason'      => 'compra',
            'quantity'    => 5,
            'supplier_id' => $this->supplier->id,
            'unit_price'  => '20.00',
            'invoice'     => $invoice,
        ])->assertRedirect();

        $movement = \App\Models\ProductMovement::where('product_id', $product->id)->first();

        $this->assertNotNull($movement->invoice_path);
        $this->assertFalse($movement->invoice_is_pdf);
        Storage::disk('public')->assertExists($movement->invoice_path);

        fwrite(STDERR, "nota fiscal: anexada numa compra de produto\n");
    }

    /**
     * Nota fiscal só faz sentido em compra — um arquivo enviado junto de
     * outro motivo (ex.: ajuste) é ignorado, não fica pendurado no registro.
     */
    public function test_nota_fiscal_e_ignorada_fora_de_compra(): void
    {
        $material = $this->rawMaterial();
        $invoice  = UploadedFile::fake()->create('nota.pdf', 100, 'application/pdf');

        $this->post(route('raw-materials.movements.store'), [
            'raw_material_id' => $material->id,
            'type'            => 'entrada',
            'reason'          => 'ajuste',
            'quantity'        => 3,
            'invoice'         => $invoice,
        ])->assertRedirect();

        $movement = \App\Models\RawMaterialMovement::where('raw_material_id', $material->id)->first();

        $this->assertNull($movement->invoice_path);

        fwrite(STDERR, "nota fiscal: ignorada fora de compra (ex.: ajuste)\n");
    }

    public function test_compra_sem_nota_fiscal_continua_opcional(): void
    {
        $material = $this->rawMaterial();

        $this->post(route('raw-materials.movements.store'), [
            'raw_material_id' => $material->id,
            'type'            => 'entrada',
            'reason'          => 'compra',
            'quantity'        => 10,
            'supplier_id'     => $this->supplier->id,
            'unit_price'      => '5.00',
        ])->assertSessionHasNoErrors()->assertRedirect();

        fwrite(STDERR, "nota fiscal: continua opcional, compra sem arquivo não falha\n");
    }

    public function test_arquivo_invalido_e_recusado(): void
    {
        $material = $this->rawMaterial();
        $invalido = UploadedFile::fake()->create('planilha.xlsx', 100);

        $this->post(route('raw-materials.movements.store'), [
            'raw_material_id' => $material->id,
            'type'            => 'entrada',
            'reason'          => 'compra',
            'quantity'        => 10,
            'supplier_id'     => $this->supplier->id,
            'unit_price'      => '5.00',
            'invoice'         => $invalido,
        ])->assertSessionHasErrors('invoice');

        fwrite(STDERR, "nota fiscal: extensão inválida (xlsx) é recusada\n");
    }
}
