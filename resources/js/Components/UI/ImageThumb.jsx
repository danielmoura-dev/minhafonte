import { useState } from 'react';
import { X } from 'lucide-react';

/**
 * Miniatura de imagem que, ao clicar, abre a imagem em tamanho grande
 * num modal (lightbox). Reaproveita as classes da miniatura via `className`.
 */
export default function ImageThumb({ src, alt = '', className = '' }) {
    const [open, setOpen] = useState(false);

    function show(e) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
    }

    return (
        <>
            <img
                src={src}
                alt={alt}
                onClick={show}
                className={`${className} cursor-zoom-in`}
            />

            {open && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setOpen(false)}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition"
                        title="Fechar"
                    >
                        <X size={28} />
                    </button>
                    <img
                        src={src}
                        alt={alt}
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-full max-h-[90vh] rounded-lg object-contain shadow-2xl"
                    />
                </div>
            )}
        </>
    );
}
