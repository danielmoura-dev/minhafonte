<p align="center">
  <img src="public/images/logo2.png" alt="Fonte Pro" height="80">
</p>

<h1 align="center">Fonte Pro</h1>

<p align="center">
  Sistema de gestão completo para distribuidoras e envasadoras de água mineral:<br>
  vendas, clientes, estoque, produção, financeiro, vendedores em campo e um bot de WhatsApp com IA.
</p>

<p align="center">
  <b>Laravel 13</b> · <b>PHP 8.3+</b> · <b>Inertia.js</b> · <b>React 19</b> · <b>Tailwind CSS 4</b> · <b>Vite</b>
</p>

---

## Visão geral

O Fonte Pro é um SaaS multi-empresa: cada empresa se cadastra, faz login e enxerga apenas os próprios dados (isolamento por `company_id` em todas as tabelas, garantido por policies e scopes `fromCompany`). O sistema cobre o ciclo inteiro da operação:

```
Matéria-prima → Produção (receita) → Estoque → Venda → Romaneio → Recebimento
                                        ↑
                    Vendedores em campo (PWA) e comissões
                                        ↑
                Bot de WhatsApp com IA para os donos consultarem tudo
```

## Módulos

### 🛒 Vendas (pedidos ao cliente)
- Pedido com **múltiplos produtos**, preço editável por venda (sem alterar o cadastro), endereço de entrega próprio (preenchido do cliente ou manual) e totais em tempo real.
- Ao concluir, modal com **3 opções de estoque**:
  1. **Não movimentar** — registra só a venda;
  2. **Dar baixa** — saída automática dos produtos vendidos;
  3. **Produzir e dar baixa** — produz cada item (consumindo as matérias-primas da receita) e depois baixa a venda, tudo numa operação.
- Aviso detalhado quando algo ficaria com **estoque negativo** ("Tampa → faltam 15"), com opção de continuar.
- **Rastreabilidade total**: toda movimentação gerada pela venda fica vinculada a ela (`order_id` em `product_movements`; matérias-primas via `product_movement_id`).
- **Romaneio A4 em PDF** com logo e dados da empresa (DomPDF).
- Editar/excluir apenas enquanto o pagamento estiver pendente.

### 💰 Recebimentos
- Controle financeiro das vendas: **pagamentos parciais ilimitados** (Espécie/Dinheiro ou Depósito/Pix), conta bancária de destino, data/hora, observação e usuário responsável.
- Status automático: **Pendente → Parcialmente Pago → Pago**, com resumo em tempo real (total / recebido / saldo).

### 👥 Clientes
- Cadastro enxuto (só o nome é obrigatório) com telefone, e-mail, CPF/CNPJ, inscrição estadual e endereço completo opcional.

### 🤝 Vendedores + PWA
- Cadastro de vendedores (revendedores e comissionados), relatórios em PDF e **área exclusiva do vendedor** (PWA mobile com login próprio): carteira de clientes, vendas e **notificações Web Push** quando a fábrica registra venda/pagamento.

### 📈 Vendas (Comissão)
- Módulo de vendas por vendedor com percentual e valor de comissão, controle de pagamento recebido e comissão paga. Alimenta o Dashboard e os relatórios.

### 📦 Produtos, Matéria-prima e Fornecedores
- Produtos com estoque, estoque mínimo, preço com histórico e **receita de produção** (quais matérias-primas e quantidades compõem cada produto).
- Movimentações de estoque (entrada/saída) com motivo, ator, antes/depois e histórico filtrável; produção consome matéria-prima automaticamente.
- Matérias-primas com unidade, preço com histórico e controle de estoque; fornecedores vinculados às compras.

### 🤖 Bot de WhatsApp com IA
Os donos consultam a empresa **pelo WhatsApp, por texto ou áudio**, sem abrir o sistema:

> 🎤 *"Quantos fardos de garrafinha o Rômulo já vendeu ao todo?"*
> 💬 *"Você fala da Garrafinha 500ml ou da 1L?"* → *"a de 500"* → resumo completo com números reais.

- **Conexão por QR code** na tela Configurações → Conectar Bot (Evolution API self-hosted, chip dedicado).
- IA **Google Gemini (free tier)** com áudio nativo e *function calling* a *temperature* 0.
- **Anti-alucinação por arquitetura**: a IA não acessa o banco — só pode chamar funções whitelisted (buscar vendedor/produto, resumo de vendas, comissões, estoque, itens em falta), todas escopadas pela empresa. Números só saem do resultado das funções; assunto fora da empresa é recusado.
- **Whitelist de números**: somente números autorizados recebem resposta (com tolerância ao nono dígito brasileiro); os demais são ignorados em silêncio.
- Memória de conversa para perguntas de esclarecimento, busca tolerante a acentos, descarte de mensagens antigas (sincronização de histórico) e webhook protegido por token.

### ⚙️ Configurações
- **Dados da Empresa** (logo, telefone, endereço) usados nos documentos impressos.
- **Contas Bancárias** para os recebimentos.
- **Conectar Bot** (QR code + números autorizados).

Além disso: **Dashboard** com KPIs, top produtos/vendedores e vendas por cidade; **auditoria** (`AuditService`) registrando eventos com ator, IP e user agent; e-mails transacionais de verificação e redefinição de senha.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Laravel 13 (PHP 8.3+), fila `database`, policies por empresa |
| Frontend | Inertia.js + React 19 + Tailwind CSS 4 + Vite + lucide-react |
| Banco | SQLite (dev) / qualquer banco suportado pelo Laravel |
| PDF | barryvdh/laravel-dompdf (romaneio, relatórios) |
| Push | minishlink/web-push (VAPID) para o PWA do vendedor |
| WhatsApp | Evolution API v2 (Docker, Baileys/QR code) |
| IA | Google Gemini free tier (function calling + áudio nativo) |

## Instalação (desenvolvimento)

Pré-requisitos: PHP 8.3+, Composer, Node 20+, Docker (apenas para o bot).

```bash
git clone https://github.com/danielmoura-dev/minhafonte.git fontepro
cd fontepro
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
npm run dev        # ou npm run build
php artisan serve  # ou Laragon/Valet apontando para /public
```

**Worker da fila** (push do vendedor + bot — obrigatório para ambos):

```bash
php artisan queue:work --tries=2
```

### Ativando o bot de WhatsApp (opcional)

1. **Chave do Gemini** (grátis): crie em [aistudio.google.com/apikey](https://aistudio.google.com/apikey) e coloque em `GEMINI_API_KEY` no `.env`.
2. **Evolution API** via Docker:
   ```bash
   cd docker/evolution
   cp .env.example .env   # defina uma AUTHENTICATION_API_KEY forte (openssl rand -hex 24)
   docker compose up -d   # sobe em 127.0.0.1:8080 (mude com EVOLUTION_PORT se ocupada)
   ```
3. Complete o `.env` do Laravel (a `EVOLUTION_API_KEY` deve ser **a mesma** do passo 2):

   | Variável | Descrição |
   |---|---|
   | `EVOLUTION_API_URL` | `http://localhost:8080` (ou a porta escolhida) |
   | `EVOLUTION_API_KEY` | mesma `AUTHENTICATION_API_KEY` do compose |
   | `EVOLUTION_WEBHOOK_TOKEN` | token aleatório que protege o webhook |
   | `EVOLUTION_WEBHOOK_BASE` | dev: `http://fontepro.test` (o container não valida o https auto-assinado); produção: **vazio** (usa `APP_URL`) |
   | `GEMINI_API_KEY` | chave do Google AI Studio |
   | `GEMINI_MODEL` | `gemini-flash-lite-latest` (alias que não quebra quando o Google aposenta versões) |

4. No sistema: **Configurações → Conectar Bot → Conectar** → escaneie o QR com um **chip dedicado** → cadastre os números autorizados.

> ⚠️ **Use sempre um chip dedicado ao bot.** A conexão por QR code usa protocolo não-oficial (Baileys); a Meta pode banir o número. Se acontecer, troque o chip e reconecte — nada se perde no sistema.

## Testes

```bash
vendor/bin/phpunit
```

Inclui testes de regressão da segurança do webhook do bot (token) e da whitelist de números (`tests/Feature/BotWebhookCheckTest.php`).

## Deploy (VPS)

1. `git pull` + `composer install --no-dev` + `php artisan migrate --force` + `npm ci && npm run build`.
2. Suba a Evolution API (`docker compose up -d` em `docker/evolution/`) — a porta fica em `127.0.0.1`, **nunca** exposta publicamente.
3. Configure o `.env` (chaves novas de produção; `EVOLUTION_WEBHOOK_BASE` vazio).
4. `php artisan config:clear && php artisan queue:restart` — **sempre reinicie o worker após mudar `.env` ou código**: ele carrega tudo na memória ao iniciar (Supervisor respawna sozinho).
5. Conecte o QR em produção e recadastre os números autorizados (o banco é outro).

## Estrutura (resumo)

```
app/
├── Http/Controllers/     # Customer, Order (pedidos+recebimentos), Product,
│                         # RawMaterial, Sale (comissão), Seller, Settings, Webhook
├── Jobs/                 # SendSellerPushJob, ProcessBotMessageJob
├── Models/               # Order/OrderItem/OrderPayment, Customer, Product(+Recipe),
│                         # RawMaterial, Sale, Seller, WhatsappBot, BotAllowedNumber...
├── Policies/             # ownership por company_id
└── Services/             # OrderStockService (3 opções de estoque),
                          # BotToolsService (whitelist da IA), GeminiBotService,
                          # EvolutionApiService, AuditService
resources/js/
├── Pages/                # Orders, Customers, Receivables, Products, RawMaterials,
│                         # Sales, Sellers, Settings (Company/BankAccounts/Bot), Seller (PWA)
├── Components/           # Sidebar, UI (ConfirmModal, Badge...), forms por módulo
└── Layouts/              # AppLayout (empresa), SellerLayout (PWA)
docker/evolution/         # docker-compose da Evolution API (WhatsApp)
```

---

<p align="center">Projeto privado · Fonte Pro © Daniel Moura</p>
