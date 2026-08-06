import { Check } from 'lucide-react';

const ACTION_LABELS = {
    view:   'Ver',
    create: 'Criar',
    edit:   'Editar',
    delete: 'Excluir',
};

const ALL_ACTIONS = ['view', 'create', 'edit', 'delete'];

/**
 * Matriz módulo x ação.
 *
 * `value` é o mapa { modulo: [acoes] }. Marcar qualquer ação marca "Ver"
 * junto, espelhando o Permissions::sanitize() do servidor — assim a tela
 * mostra exatamente o que vai ser salvo.
 */
export default function PermissionMatrix({ modules, value, onChange }) {
    const groups = {};
    for (const [key, mod] of Object.entries(modules)) {
        (groups[mod.group] = groups[mod.group] || []).push([key, mod]);
    }

    function actionsOf(moduleKey) {
        return value[moduleKey] ?? [];
    }

    function toggle(moduleKey, action) {
        const current = new Set(actionsOf(moduleKey));

        if (current.has(action)) {
            current.delete(action);
            // Tirar "Ver" tira o módulo inteiro: não faz sentido poder editar
            // uma tela que não se pode abrir.
            if (action === 'view') current.clear();
        } else {
            current.add(action);
            current.add('view');
        }

        const next = { ...value };
        if (current.size === 0) delete next[moduleKey];
        else next[moduleKey] = ALL_ACTIONS.filter(a => current.has(a));

        onChange(next);
    }

    function toggleModule(moduleKey, moduleActions) {
        const next = { ...value };

        if (actionsOf(moduleKey).length === moduleActions.length) delete next[moduleKey];
        else next[moduleKey] = [...moduleActions];

        onChange(next);
    }

    const totalSelected = Object.keys(value).length;
    const totalModules  = Object.keys(modules).length;

    function toggleAll() {
        if (totalSelected === totalModules) return onChange({});

        const next = {};
        for (const [key, mod] of Object.entries(modules)) next[key] = [...mod.actions];
        onChange(next);
    }

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">

            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Permissões
                </span>
                <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                    {totalSelected === totalModules ? 'Desmarcar tudo' : 'Marcar tudo'}
                </button>
            </div>

            <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-100">
                {Object.entries(groups).map(([groupName, items]) => (
                    <div key={groupName}>
                        <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                            {groupName}
                        </p>

                        {items.map(([key, mod]) => {
                            const selected = actionsOf(key);
                            const allOn    = selected.length === mod.actions.length;

                            return (
                                <div key={key} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50">
                                    <button
                                        type="button"
                                        onClick={() => toggleModule(key, mod.actions)}
                                        className="flex items-center gap-2 text-left min-w-0"
                                    >
                                        <span className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition ${
                                            allOn
                                                ? 'bg-primary-600 border-primary-600'
                                                : selected.length > 0
                                                    ? 'bg-primary-100 border-primary-300'
                                                    : 'border-gray-300'
                                        }`}>
                                            {allOn && <Check size={11} className="text-white" strokeWidth={3} />}
                                            {!allOn && selected.length > 0 && (
                                                <span className="w-1.5 h-1.5 rounded-sm bg-primary-600" />
                                            )}
                                        </span>
                                        <span className="text-sm text-gray-700 truncate">{mod.label}</span>
                                    </button>

                                    <div className="flex gap-1 shrink-0">
                                        {mod.actions.map(action => {
                                            const on = selected.includes(action);

                                            return (
                                                <button
                                                    key={action}
                                                    type="button"
                                                    onClick={() => toggle(key, action)}
                                                    className={`px-2 py-1 rounded-md text-[11px] font-medium border transition ${
                                                        on
                                                            ? 'bg-primary-50 border-primary-200 text-primary-700'
                                                            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                                                    }`}
                                                >
                                                    {ACTION_LABELS[action]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <p className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[11px] text-gray-400">
                {totalSelected === 0
                    ? 'Nenhum módulo liberado — o usuário não verá nada no menu.'
                    : `${totalSelected} de ${totalModules} módulos liberados.`}
            </p>
        </div>
    );
}
