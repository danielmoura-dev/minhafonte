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

    public function test_imagem_vai_como_foto_e_pdf_como_documento(): void
    {
        config(['services.evolution.url' => 'https://evolution.test']);

        $dir = sys_get_temp_dir() . '/fontepro-midia';
        @mkdir($dir, 0777, true);
        file_put_contents("{$dir}/comprovante.jpg", 'conteudo-imagem');
        file_put_contents("{$dir}/comprovante.pdf", 'conteudo-pdf');

        Http::fake(['*' => Http::response(['ok' => true], 200)]);

        $service = new EvolutionApiService();

        $service->sendMedia('fontepro_1', '5585999990001', "{$dir}/comprovante.jpg", 'Comprovante');
        Http::assertSent(fn ($request) => $request['mediatype'] === 'image'
            && $request['mimetype'] === 'image/jpeg'
            && $request['caption'] === 'Comprovante'
            // Foto não leva nome de arquivo; documento sim.
            && ! isset($request['fileName']));

        $service->sendMedia('fontepro_1', '5585999990001', "{$dir}/comprovante.pdf");
        Http::assertSent(fn ($request) => $request['mediatype'] === 'document'
            && $request['mimetype'] === 'application/pdf'
            && $request['fileName'] === 'comprovante.pdf');

        @unlink("{$dir}/comprovante.jpg");
        @unlink("{$dir}/comprovante.pdf");

        fwrite(STDERR, "midia: JPG vai como foto; PDF vai como documento nomeado\n");
    }

    public function test_zero_delay_is_sent_as_zero(): void
    {
        config(['services.evolution.url' => 'https://evolution.test']);

        Http::fake(['*' => Http::response(['ok' => true], 200)]);

        (new EvolutionApiService())->sendPresence('fontepro_1', '5585999990001', 'recording', 0);

        Http::assertSent(fn ($request) => $request['delay'] === 0);
    }
}
