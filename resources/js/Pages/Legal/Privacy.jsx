import { Head } from '@inertiajs/react';
import { Droplets, ArrowLeft } from 'lucide-react';

export default function Privacy() {
    return (
        <>
            <Head title="Política de Privacidade" />
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-3xl mx-auto px-4 py-10">

                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <Droplets size={15} className="text-white" strokeWidth={2} />
                        </div>
                        <span className="font-bold text-gray-900">Minha Fonte</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
                        <p className="text-sm text-gray-400 mb-8">Versão 1.0 — Vigente desde 01/01/2025</p>

                        <div className="prose prose-sm text-gray-700 flex flex-col gap-6">

                            <section>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">1. Dados coletados</h2>
                                <p className="leading-relaxed">
                                    Coletamos dados como razão social, CNPJ, e-mail, endereço IP e informações
                                    de uso do sistema para fins de operação, segurança e melhoria do serviço.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">2. Uso dos dados</h2>
                                <p className="leading-relaxed">
                                    Os dados são utilizados exclusivamente para prestação do serviço, comunicações
                                    relacionadas à conta e cumprimento de obrigações legais. Não vendemos ou
                                    compartilhamos seus dados com terceiros para fins comerciais.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">3. Base legal (LGPD)</h2>
                                <p className="leading-relaxed">
                                    O tratamento de dados é realizado com base no consentimento do titular,
                                    na execução do contrato e no legítimo interesse, conforme a Lei nº 13.709/2018 (LGPD).
                                </p>
                            </section>

                            <section>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">4. Direitos do titular</h2>
                                <p className="leading-relaxed">
                                    Você tem direito a acessar, corrigir, exportar e solicitar a exclusão de seus dados
                                    a qualquer momento, mediante solicitação pelo e-mail de contato.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">5. Segurança</h2>
                                <p className="leading-relaxed">
                                    Adotamos medidas técnicas e organizacionais para proteger seus dados contra
                                    acesso não autorizado, alteração, divulgação ou destruição.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">6. Retenção de dados</h2>
                                <p className="leading-relaxed">
                                    Os dados são mantidos pelo período necessário à prestação do serviço e
                                    cumprimento de obrigações legais. Após o encerramento da conta, os dados
                                    podem ser mantidos por até 5 anos para fins fiscais e legais.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">7. Contato do DPO</h2>
                                <p className="leading-relaxed">
                                    Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato
                                    pelo e-mail{' '}
                                    <a href="mailto:privacidade@minhafonte.com.br" className="text-primary-600 hover:underline">
                                        privacidade@minhafonte.com.br
                                    </a>.
                                </p>
                            </section>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <a href="javascript:window.close()" className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1.5">
                            <ArrowLeft size={14} />
                            Fechar
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}