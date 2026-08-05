import { useRef, useState } from 'react';
import { UploadCloud, FileText, X, Loader2 } from 'lucide-react';
import { compressImage } from '@/utils/compressImage';

const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

function humanSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Área para anexar arquivo: aceita clique e arrastar-e-soltar.
 * Imagens são comprimidas no navegador (comprovantes ficam leves);
 * PDFs seguem como estão.
 */
export default function FileDropzone({ file, onChange, error, hint }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [working, setWorking] = useState(false);
    const [preview, setPreview] = useState(null);

    async function accept(picked) {
        if (!picked) return;

        setWorking(true);
        try {
            const isImage = picked.type.startsWith('image/');
            // Comprovante tem texto pequeno: mais resolução que fotos de cadastro
            const finalFile = isImage
                ? await compressImage(picked, { maxWidth: 1400, quality: 0.72 })
                : picked;

            setPreview(isImage ? URL.createObjectURL(finalFile) : null);
            onChange(finalFile);
        } finally {
            setWorking(false);
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files?.[0]);
    }

    function clear(e) {
        e.stopPropagation();
        setPreview(null);
        onChange(null);
        if (inputRef.current) inputRef.current.value = '';
    }

    return (
        <div>
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition ${
                    dragging
                        ? 'border-primary-500 bg-primary-50'
                        : file
                            ? 'border-gray-200 bg-gray-50'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }`}
            >
                {working ? (
                    <>
                        <Loader2 size={20} className="text-primary-500 animate-spin shrink-0" />
                        <span className="text-sm text-gray-500">Otimizando arquivo...</span>
                    </>
                ) : file ? (
                    <>
                        {preview ? (
                            <img src={preview} alt="" className="w-10 h-10 rounded object-cover border border-gray-200 shrink-0" />
                        ) : (
                            <div className="w-10 h-10 rounded bg-red-50 flex items-center justify-center shrink-0">
                                <FileText size={18} className="text-red-500" strokeWidth={1.75} />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">{humanSize(file.size)} · clique para trocar</p>
                        </div>
                        <button
                            type="button"
                            onClick={clear}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                            title="Remover"
                        >
                            <X size={15} strokeWidth={2} />
                        </button>
                    </>
                ) : (
                    <>
                        <UploadCloud size={20} className={`shrink-0 ${dragging ? 'text-primary-600' : 'text-gray-400'}`} strokeWidth={1.75} />
                        <div>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium text-primary-600">Clique para escolher</span> ou arraste o arquivo aqui
                            </p>
                            <p className="text-xs text-gray-400">{hint ?? 'Foto do cheque, comprovante de Pix/depósito — JPG, PNG ou PDF'}</p>
                        </div>
                    </>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT}
                    onChange={e => accept(e.target.files?.[0])}
                    className="hidden"
                />
            </div>

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
