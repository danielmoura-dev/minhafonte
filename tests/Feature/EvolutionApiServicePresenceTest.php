<?php

namespace Tests\Feature;

use App\Services\EvolutionApiService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * sendPresence() recebe segundos mas a Evolution API espera `delay` em
 * milissegundos — confere a conversão de verdade no corpo da requisição HTTP.
 */
class EvolutionApiServicePresenceTest extends TestCase
{
    public function test_delay_in_seconds_is_sent_as_milliseconds(): void
    {
        config(['services.evolution.url' => 'https://evolution.test']);

        Http::fake(['*' => Http::response(['ok' => true], 200)]);

        (new EvolutionApiService())->sendPresence('fontepro_1', '5585999990001', 'composing', 5);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://evolution.test/chat/sendPresence/fontepro_1'
                && $request['number'] === '5585999990001'
                && $request['presence'] === 'composing'
                && $request['delay'] === 5000;
        });
    }

    public function test_zero_delay_is_sent_as_zero(): void
    {
        config(['services.evolution.url' => 'https://evolution.test']);

        Http::fake(['*' => Http::response(['ok' => true], 200)]);

        (new EvolutionApiService())->sendPresence('fontepro_1', '5585999990001', 'recording', 0);

        Http::assertSent(fn ($request) => $request['delay'] === 0);
    }
}
