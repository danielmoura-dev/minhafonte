<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint' => 'required|string',
            'keys.p256dh' => 'required|string',
            'keys.auth'   => 'required|string',
        ]);

        $seller = auth('seller')->user();

        PushSubscription::updateOrCreate(
            ['endpoint' => $request->input('endpoint')],
            [
                'seller_id'  => $seller->id,
                'p256dh'     => $request->input('keys.p256dh'),
                'auth'       => $request->input('keys.auth'),
                'user_agent' => $request->userAgent(),
            ]
        );

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $seller = auth('seller')->user();

        PushSubscription::where('seller_id', $seller->id)
            ->where('endpoint', $request->input('endpoint'))
            ->delete();

        return response()->json(['ok' => true]);
    }
}
