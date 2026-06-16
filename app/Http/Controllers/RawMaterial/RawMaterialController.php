<?php

namespace App\Http\Controllers\RawMaterial;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class RawMaterialController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('RawMaterials/Index');
    }
}