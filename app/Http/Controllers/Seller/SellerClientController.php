<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SellerClientController extends Controller
{
    public function index(Request $request): Response
    {
        $seller = auth('seller')->user();
        $search = $request->get('search', '');
        $city   = $request->get('city', '');

        $clients = $seller->clients()
            ->withCount('clientSales')
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->when($city, fn ($q) => $q->where('city', $city))
            ->orderBy('name')
            ->get();

        // Cidades distintas (de todos os clientes do vendedor) para o filtro
        $cities = $seller->clients()
            ->whereNotNull('city')
            ->where('city', '!=', '')
            ->distinct()
            ->orderBy('city')
            ->pluck('city');

        return Inertia::render('Seller/Clientes', [
            'clients' => $clients,
            'cities'  => $cities,
            'filters' => ['search' => $search, 'city' => $city],
        ]);
    }

    private function validationRules(): array
    {
        return [
            'type'         => 'required|in:pf,pj',
            'name'         => 'required|string|max:255',
            'fantasy_name' => 'nullable|string|max:255',
            'whatsapp'     => 'required|string|max:20',
            'email'        => 'nullable|email|max:255',
            'cpf'          => 'nullable|string|max:14',
            'cnpj'         => 'nullable|string|max:18',
            'birth_date'   => 'nullable|date',
            'street'       => 'nullable|string|max:255',
            'number'       => 'nullable|string|max:20',
            'complement'   => 'nullable|string|max:100',
            'neighborhood' => 'nullable|string|max:100',
            'city'         => 'nullable|string|max:100',
            'state'        => 'nullable|string|max:2',
            'zip_code'     => 'nullable|string|max:9',
            'notes'        => 'nullable|string',
            'photo'        => 'nullable|image|max:3072',
        ];
    }

    private function validationMessages(): array
    {
        return [
            'type.required'         => 'Selecione o tipo de pessoa.',
            'type.in'               => 'Tipo de pessoa inválido.',
            'name.required'         => 'O nome é obrigatório.',
            'name.max'              => 'O nome deve ter no máximo 255 caracteres.',
            'whatsapp.required'     => 'O WhatsApp é obrigatório.',
            'whatsapp.max'          => 'O WhatsApp deve ter no máximo 20 caracteres.',
            'email.email'           => 'Informe um e-mail válido.',
            'email.max'             => 'O e-mail deve ter no máximo 255 caracteres.',
            'cpf.max'               => 'O CPF deve ter no máximo 14 caracteres.',
            'cnpj.max'              => 'O CNPJ deve ter no máximo 18 caracteres.',
            'birth_date.date'       => 'Data de nascimento inválida.',
            'street.max'            => 'A rua deve ter no máximo 255 caracteres.',
            'number.max'            => 'O número deve ter no máximo 20 caracteres.',
            'complement.max'        => 'O complemento deve ter no máximo 100 caracteres.',
            'neighborhood.max'      => 'O bairro deve ter no máximo 100 caracteres.',
            'city.max'              => 'A cidade deve ter no máximo 100 caracteres.',
            'state.max'             => 'Selecione um estado válido.',
            'zip_code.max'          => 'O CEP deve ter no máximo 9 caracteres.',
            'photo.image'           => 'O arquivo deve ser uma imagem (JPG, PNG, etc.).',
            'photo.max'             => 'A foto deve ter no máximo 3 MB.',
        ];
    }

    public function store(Request $request)
    {
        $seller = auth('seller')->user();

        $data = $request->validate($this->validationRules(), $this->validationMessages());

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store("clients/{$seller->id}", 'public');
        }

        $seller->clients()->create($data);

        return back()->with('success', 'Cliente cadastrado com sucesso!');
    }

    public function show(Client $client): Response
    {
        abort_if($client->seller_id !== auth('seller')->id(), 403);

        $sales = $client->clientSales()
            ->orderByDesc('sale_date')
            ->get();

        $summary = [
            'total'    => $sales->sum('amount'),
            'received' => $sales->where('payment_received', true)->sum('amount'),
            'pending'  => $sales->where('payment_received', false)->sum('amount'),
        ];

        return Inertia::render('Seller/ClienteShow', [
            'client'  => $client,
            'sales'   => $sales,
            'summary' => $summary,
        ]);
    }

    public function update(Request $request, Client $client)
    {
        abort_if($client->seller_id !== auth('seller')->id(), 403);

        $data = $request->validate($this->validationRules(), $this->validationMessages());

        if ($request->hasFile('photo')) {
            if ($client->photo) Storage::disk('public')->delete($client->photo);
            $data['photo'] = $request->file('photo')->store("clients/{$client->seller_id}", 'public');
        } else {
            unset($data['photo']);
        }

        $client->update($data);

        return back()->with('success', 'Cliente atualizado com sucesso!');
    }

    public function destroy(Client $client)
    {
        abort_if($client->seller_id !== auth('seller')->id(), 403);

        // Inclui vendas soft-deletadas para decidir entre inativar ou excluir
        $hasSales = $client->clientSales()->withTrashed()->exists();

        if ($hasSales) {
            $client->update(['is_active' => false]);
            return back()->with('success', 'Cliente inativado.');
        }

        if ($client->photo) Storage::disk('public')->delete($client->photo);
        $client->forceDelete();

        return back()->with('success', 'Cliente removido com sucesso!');
    }

    public function toggleStatus(Client $client)
    {
        abort_if($client->seller_id !== auth('seller')->id(), 403);

        $client->update(['is_active' => !$client->is_active]);

        $msg = $client->is_active ? 'Cliente ativado.' : 'Cliente inativado.';
        return back()->with('success', $msg);
    }
}
