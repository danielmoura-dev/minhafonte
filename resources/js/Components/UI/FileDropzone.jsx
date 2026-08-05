import { useRef, useState } from 'react';
import { UploadCloud, FileText, X, Loader2, ZoomIn } from 'lucide-react';
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
    const [preview, setPreview] = useState(null);   // URL da imagem (null se for PDF)
    const [fileUrl, setFileUrl] = useState(null);   // URL do arquivo (imagem ou PDF)
    const [zoomed, setZoomed] = useState(false);

    async function accept(picked) {
        if (!picked) return;

        setWorking(true);
        try {
            const isImage = picked.type.startsWith('image/');
            // Comprovante tem texto pequeno: mais resolução que fotos de cadastro
            const finalFile = isImage
                ? await compressImage(picked, { maxWidth: 1400, quality: 0.72 })
                : picked;

            const url = URL.createObjectURL(finalFile);
            setFileUrl(url);
            setPreview(isImage ? url : null);
            onChange(finalFile);
        } finally {
            setWorking(false);
        }
    }

    /** Ampliar: imagem abre num modal; PDF abre em nova aba. */
    function openFile(e) {
        e.preventDefault();
        e.stopPropagation();

        if (preview) {
            setZoomed(true);
        } else if (fileUrl) {
            window.open(fileUrl, '_blank', 'noopener');
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
        setFileUrl(null);
        setZoomed(false);
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
                        <button
                            type="button"
                            onClick={openFile}
                            title={preview ? 'Clique para ampliar' : 'Clique para abrir o PDF'}
                            className="relative w-12 h-12 rounded border border-gray-200 overflow-hidden shrink-0 group cursor-zoom-in"
                        >
                            {preview ? (
                                <img src={preview} alt="Comprovante" className="w-full h-full object-cover" />
                            ) : (
                                <span className="w-full h-full bg-red-50 flex items-center justify-center">
                                    <FileText size={18} className="text-red-500" strokeWidth={1.75} />
                                </span>
                            )}
                            <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <ZoomIn size={16} className="text-white" strokeWidth={2} />
                            </span>
                        </button>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">
                                {humanSize(file.size)} · clique na miniatura para {preview ? 'ampliar' : 'abrir'} · aqui para trocar
                            </p>
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

            {/* Ampliação do comprovante (antes mesmo de salvar) */}
            {zoomed && preview && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setZoomed(false)}
                >
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setZoomed(false); }}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition"
                        title="Fechar"
                    >
                        <X size={28} />
                    </button>
                    <img
                        src={preview}
                        alt="Comprovante"
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-full max-h-[90vh] rounded-lg object-contain shadow-2xl"
                    />
                </div>
            )}
        </div>
    );
}
