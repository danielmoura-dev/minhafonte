import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import RawMaterialForm from '@/Components/RawMaterials/RawMaterialForm';

export default function RawMaterialCreate({ units }) {
    const { data, setData, post, processing, errors } = useForm({
        code:           '',
        name:           '',
        unit:           '',
        controls_stock: true,
        current_price:  '',
        min_quantity:   '',
        photo:          null,
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('raw-materials.store'), { forceFormData: true });
    }

    return (
        <AppLayout title="Cadastrar Matéria-Prima">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Cadastrar matéria-prima</h1>
                <p className="text-sm text-gray-400 mt-1">Preencha os dados da nova matéria-prima.</p>
            </div>

            <RawMaterialForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
                submitLabel="Cadastrar matéria-prima"
                units={units}
                existingPhoto={null}
            />
        </AppLayout>
    );
}
