import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import RawMaterialForm from '@/Components/RawMaterials/RawMaterialForm';

export default function RawMaterialEdit({ material, units }) {
    const { data, setData, post, processing, errors } = useForm({
        _method:        'PUT',
        name:           material.name,
        unit:           material.unit ?? '',
        controls_stock: material.controls_stock ?? true,
        min_quantity:   material.min_quantity ?? '',
        photo:          null,
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('raw-materials.update', material.id), { forceFormData: true });
    }

    return (
        <AppLayout title="Editar Matéria-Prima">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Editar matéria-prima</h1>
                <p className="text-sm text-gray-400 mt-1">{material.name}</p>
            </div>

            <RawMaterialForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
                submitLabel="Salvar alterações"
                units={units}
                existingPhoto={material.photo}
                isEdit
            />
        </AppLayout>
    );
}
