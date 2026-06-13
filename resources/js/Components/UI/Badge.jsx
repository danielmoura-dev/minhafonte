const variants = {
    commissioned: 'bg-violet-100 text-violet-700',
    reseller:     'bg-blue-100 text-blue-700',
    individual:   'bg-gray-100 text-gray-600',
    legal_entity: 'bg-amber-100 text-amber-700',
};

const labels = {
    commissioned: 'Comissionado',
    reseller:     'Revendedor',
    individual:   'Pessoa Física',
    legal_entity: 'Pessoa Jurídica',
};

export default function Badge({ value }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variants[value] ?? 'bg-gray-100 text-gray-600'}`}>
            {labels[value] ?? value}
        </span>
    );
}