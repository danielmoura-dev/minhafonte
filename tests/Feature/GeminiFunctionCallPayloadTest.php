<?php

namespace Tests\Feature;

use App\Services\GeminiBotService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Protege o formato do payload enviado de volta ao Gemini quando ele pede
 * uma função. Dois detalhes já quebraram o bot em produção:
 *  - `args` sem argumentos precisa ir como objeto {} (o PHP transformaria em []);
 *  - `thoughtSignature` precisa ser devolvido nos modelos novos.
 */
class GeminiFunctionCallPayloadTest extends TestCase
{
    use RefreshDatabase;

    public function test_function_call_is_echoed_back_correctly(): void
    {
        config([
            'services.gemini.api_key' => 'chave-de-teste',
            'services.gemini.model'   => 'gemini-flash-lite-latest',
        ]);

        $company = \App\Models\Company::create([
            'company_name' => 'Teste', 'fantasy_name' => 'Teste', 'cnpj' => '1',
            'email' => 't@e.com', 'password' => bcrypt('x'),
        ]);

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::sequence()
                // 1ª resposta: o modelo pede a função SEM argumentos
                ->push([
                    'candidates' => [[
                        'content' => ['parts' => [[
                            'functionCall'     => ['name' => 'sales_summary', 'args' => new \stdClass()],
                            'thoughtSignature' => 'assinatura-do-modelo',
                        ]]],
                    ]],
                ], 200)
                // 2ª resposta: texto final
                ->push([
                    'candidates' => [[
                        'content' => ['parts' => [['text' => 'Hoje tivemos 1 venda.']]],
                    ]],
                ], 200),
        ]);

        $answer = app(GeminiBotService::class)
            ->reply($company->id, '5585999999999', 'quanto vendeu hoje?', null, 'Teste');

        $this->assertSame('Hoje tivemos 1 venda.', $answer);

        $requests = collect(Http::recorded())->map(fn ($pair) => $pair[0]);
        $this->assertCount(2, $requests, 'Deveria haver a chamada inicial e a de retorno da função.');

        /** @var Request $second */
        $second = $requests[1];
        $body   = $second->body();

        // args vazio precisa ser objeto, nunca lista
        $this->assertStringContainsString('"args":{}', $body);
        $this->assertStringNotContainsString('"args":[]', $body);

        // thoughtSignature precisa voltar ao modelo
        $this->assertStringContainsString('assinatura-do-modelo', $body);

        // e o resultado da função precisa ser enviado
        $this->assertStringContainsString('functionResponse', $body);

        fwrite(STDERR, "\ngemini: args como objeto, thoughtSignature preservado no retorno\n");
    }
}
