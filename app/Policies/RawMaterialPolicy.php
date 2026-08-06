<?php

namespace App\Policies;

/** Acesso ao módulo de matéria-prima. */
class RawMaterialPolicy extends ModulePolicy
{
    protected function module(): string
    {
        return 'raw_materials';
    }
}
