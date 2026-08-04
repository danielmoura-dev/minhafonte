import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ links }) {
    if (!links || links.length <= 3) return null;

    return (
        <div className="flex items-center justify-center gap-1 mt-6">
            {links.map((link, i) => {
                if (link.label.includes('Previous')) {
                    return (
                        <Link
                            key={i}
                            href={link.url ?? '#'}
                            preserveScroll
                            preserveState
                            className={`p-2 rounded-lg border text-sm transition ${
                                link.url
                                    ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    : 'border-gray-100 text-gray-300 cursor-not-allowed pointer-events-none'
                            }`}
                        >
                            <ChevronLeft size={15} />
                        </Link>
                    );
                }

                if (link.label.includes('Next')) {
                    return (
                        <Link
                            key={i}
                            href={link.url ?? '#'}
                            preserveScroll
                            preserveState
                            className={`p-2 rounded-lg border text-sm transition ${
                                link.url
                                    ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    : 'border-gray-100 text-gray-300 cursor-not-allowed pointer-events-none'
                            }`}
                        >
                            <ChevronRight size={15} />
                        </Link>
                    );
                }

                return (
                    <Link
                        key={i}
                        href={link.url ?? '#'}
                        preserveScroll
                        preserveState
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                            link.active
                                ? 'bg-primary-600 text-white border-primary-600'
                                : link.url
                                    ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    : 'border-gray-100 text-gray-300 cursor-not-allowed pointer-events-none'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </div>
    );
}