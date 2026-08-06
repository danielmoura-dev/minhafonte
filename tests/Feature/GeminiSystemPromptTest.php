<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Services\GeminiBotService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Protege as instruções enviadas ao Gemini.
 *
 * O bot já respondeu "Só consigo responder sobre os dados da empresa" a um
 * "top, obrigado!" do dono — a regra de recusa era ampla demais e engolia
 * conversa social. Aqui garantimos que a permissão para conversar continua no
 * prompt, e que a trava contra inventar números continua junto.
 */
class GeminiSystemPromptTest extends TestCase
{
    use RefreshDatabase;

    private function systemInstruction(): string
    {
        config([
            'services.gemini.api_key' => 'chave-de-teste',
            'services.gemini.model'   => 'gemini-flash-lite-latest',
        ]);

        $company = Company::create([
            'company_name' => 'Zilumina', 'fantasy_name' => 'Zilumina', 'cnpj' => '1',
            'email' => 't@e.com', 'password' => bcrypt('x'),
        ]);

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => ['parts' => [['text' => 'Valeu! 😄']]],
                ]],
            ], 200),
        ]);

        app(GeminiBotService::class)->reply($company->id, '5585999999999', 'top, obrigado!', null, 'Zilumina');

        $request = collect(Http::recorded())->map(fn ($pair) => $pair[0])->first();

        return json_encode(
            $request->data()['system_instruction'],
            JSON_UNESCAPED_UNICODE
        );
    }

    public function test_prompt_libera_conversa_social(): void
    {
        $prompt = $this->systemInstruction();

        $this->assertStringContainsString('CONVERSA NORMAL', $prompt);
        $this->assertStringContainsString('agradecimento', $prompt);
        $this->assertStringContainsString('elogio', $prompt);

        // O ponto central: agradecer não pode cair na frase de recusa.
        $this->assertStringContainsString('NUNCA responda a essas mensagens com a frase de recusa', $prompt);

        fwrite(STDERR, "\nbot: prompt permite responder cumprimento, agradecimento e elogio\n");
    }

    public function test_prompt_mantem_a_trava_contra_inventar_numeros(): void
    {
        $prompt = $this->systemInstruction();

        // Soltar o tom não pode afrouxar a regra que impede alucinação.
        $this->assertStringContainsString('PROIBIDO estimar, inventar ou completar números', $prompt);
        $this->assertStringContainsString('nunca preencha com suposição', $prompt);

        // A recusa continua existindo, mas só para assunto de fora.
        $this->assertStringContainsString('INFORMAÇÃO DE FORA da empresa', $prompt);

        fwrite(STDERR, "bot: trava contra inventar números segue no prompt\n");
    }
}
