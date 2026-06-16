import { Head, Link } from '@inertiajs/react';
import { Droplets, ArrowLeft } from 'lucide-react';

export default function Terms() {
    return (
        <>
            <Head title="Termos de Uso" />
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-3xl mx-auto px-4 py-10">

                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <Droplets size={15} className="text-white" strokeWidth={2} />
                        </div>
                        <span className="font-bold text-gray-900">Minha Fonte</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
                        <p className="text-sm text-gray-400 mb-8">Versão 1.0 — Vigente desde 01/01/2025</p>

                        <div className="prose prose-sm text-gray-700 flex flex-col gap-6">

                            <section>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">1. Aceitação dos termos</h2>
                                <p className="leading-relaxed">
                                    Ao criar uma conta no Minha Fonte, você declara que leu, compreendeu e concorda com estes Termos de Uso.
                                    Caso não concorde, não utilize o sistema.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">2. Descrição do serviço</h2>
                                <p className="leading-relaxed">
                                    O Minha Fonte é uma plataforma SaaS de gestão para distribuidoras de água,
                                    oferecendo funcionalidades de controle de vendas, vendedores, produtos e comissões.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">3. Responsabilidades do usuário</h2>
                                <p className="leading-relaxed">
                                    O usuário é responsável por manter suas credenciais de acesso em sigilo,
                                    pela veracidade das informações cadastradas e pelo uso adequado do sistema conforme a legislação vigente.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">4. Propriedade intelectual</h2>
                                <p className="leading-relaxed">
                                    Todo o conteúdo, marca, código e design do Minha Fonte são propriedade exclusiva dos seus desenvolvedores.
                                    É vedada a reprodução sem autorização expressa.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">5. Limitação de responsabilidade</h2>
                                <p className="leading-relaxed">
                                    O Minha Fonte não se responsabiliza por perdas decorrentes de uso indevido,
                                    falhas de conexão ou dados inseridos incorretamente pelos usuários.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">6. Alterações</h2>
                                <p className="leading-relaxed">
                                    Estes termos podem ser alterados a qualquer momento. O uso continuado do sistema
                                    após notificação implica aceitação das novas condições.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">7. Contato</h2>
                                <p className="leading-relaxed">
                                    Dúvidas sobre estes termos podem ser enviadas para{' '}
                                    <a href="mailto:contato@minhafonte.com.br" className="text-primary-600 hover:underline">
                                        contato@minhafonte.com.br
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