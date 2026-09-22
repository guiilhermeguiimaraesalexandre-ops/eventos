# OAB Rio Preto — Eventos (v2, Supabase + React)

Reescrita do sistema de eventos que rodava em Google Apps Script + planilha.
Mesma ideia, arquitetura de verdade: banco relacional (Supabase/Postgres),
autenticação real, storage de arquivos, sem limite de execução de 6 minutos
e sem "uma aba por evento".

## O que já está pronto e funcionando

- **Login admin** via Supabase Auth (nada de senha fixa no código)
- **Dashboard** com estatísticas e lista de eventos
- **Criar/editar evento**: campos básicos, vagas, lotes, cor/tema, campos
  dinâmicos do formulário (texto, select, radio, checkbox, upload, PIX,
  informativo, CPF, CNPJ, OAB), upload de imagens (Supabase Storage)
- **Formulário público de inscrição** (`/f/:eventId`) — respeita vagas,
  lotes, campos dinâmicos, LGPD, upload de anexos
- **Lista pública de presença em tempo real** (`/presenca/:eventId`) —
  usa Supabase Realtime, atualiza sozinha sem F5
- **Check-in por CPF** (`/checkin/:eventId`)
- **Sorteio entre presentes** (`/sorteio/:eventId`)
- **Painel de inscritos com exportação CSV** (substitui a "planilha por evento")

## O que ficou de fora de propósito (para você plugar depois)

O Apps Script original tinha vários recursos bem específicos e amarrados
a templates do Google (lista solene em planilha-modelo, geração de
planilha de certificados, abas "Jantar do Advogado" / "Festa Julina" com
links fixos, notificações via sininho, modo escuro, QR code impresso).
Isso tudo é fácil de recriar aqui, mas é trabalho "de segunda fase":
- Lista solene / certificados → gerar PDF com `pdf-lib` ou exportar CSV
  (já dá pra fazer no botão "Exportar CSV" da página de Inscritos)
- Envio de e-mail de confirmação → já deixei pronta a Edge Function
  `supabase/functions/send-email` (usa Resend); é só chamar
  `supabase.functions.invoke('send-email', {...})` de onde quiser
- QR Code de check-in → gere a URL `/checkin/:eventId` com
  `https://api.qrserver.com/v1/create-qr-code/?data=...` como no original

## Por que Supabase "substitui" o Sheets aqui

Você pediu pra manter uma visão "tipo planilha" do banco. Não precisa
construir nada pra isso: abra seu projeto em **supabase.com → Table
Editor**. As tabelas `events` e `registrations` já aparecem lá como uma
planilha navegável, com filtro, ordenação e edição de células — é
literalmente a "visualização do banco como Sheets" que você queria,
de graça, sem manter mais uma tela.

---

## 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (grátis).
2. Vá em **SQL Editor** e cole o conteúdo de
   `supabase/migrations/0001_init.sql`, depois clique em **Run**.
   Isso cria as tabelas, as políticas de segurança (RLS) e o bucket de
   arquivos `uploads`.
3. Vá em **Authentication → Users → Add user** e crie seu usuário admin
   (email + senha). É com essa conta que você vai logar no painel.
4. Vá em **Project Settings → API** e copie:
   - `Project URL` → vai virar `VITE_SUPABASE_URL`
   - `anon public key` → vai virar `VITE_SUPABASE_ANON_KEY`

(Opcional, pra e-mails automáticos) Vá em **Edge Functions**, crie
`send-email` com o conteúdo de `supabase/functions/send-email/index.ts`,
crie uma conta grátis em [resend.com](https://resend.com), gere uma API
key e rode `supabase secrets set RESEND_API_KEY=...`.

## 2. Rodar localmente no VS Code

Pré-requisito: [Node.js 18+](https://nodejs.org) instalado.

```bash
# dentro da pasta do projeto
npm install
cp .env.example .env
# edite o .env e cole a URL + anon key do seu projeto Supabase
npm run dev
```

Abra `http://localhost:5173` — vai te mandar pro `/login`.
Extensões recomendadas no VS Code: **ESLint**, **Prettier**, e a
extensão oficial **Supabase** (dá autocomplete do schema).

## 3. Subir pro GitHub

```bash
git init
git add .
git commit -m "Primeira versão: OAB Eventos em React + Supabase"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/oab-eventos.git
git push -u origin main
```

O `.env` **não** vai junto (está no `.gitignore`) — suas chaves ficam
seguras. No GitHub só vai o `.env.example` como referência.

## 4. Colocar no ar (hospedagem)

O GitHub sozinho guarda o código, mas quem serve o site pra visitante
é um host de front-end. O mais simples e gratuito para esse stack:

- **Vercel** ou **Netlify**: conecte o repositório do GitHub, defina
  como variáveis de ambiente `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  e `VITE_APP_URL` (a URL final que ele vai te dar, tipo
  `https://oab-eventos.vercel.app`), e pronto — cada `git push` já
  publica sozinho.

Se preferir GitHub Pages, dá também, mas exige configurar
`base` no `vite.config.ts` e publicar a pasta `dist` manualmente ou via
GitHub Actions — Vercel/Netlify é bem mais direto pra esse tipo de app.

## Estrutura do projeto

```
src/
  pages/         → uma página por rota (Dashboard, EventEditor, PublicForm...)
  components/    → pedaços reutilizáveis (Sidebar, EventCard, uploaders...)
  lib/           → cliente Supabase
  hooks/         → useAuth
  utils/         → formatação, máscaras, validação de CPF
  types/         → tipos TypeScript espelhando as tabelas do banco
supabase/
  migrations/    → SQL do banco (rode no SQL Editor do Supabase)
  functions/     → Edge Functions (e-mail)
```

## Segurança (RLS) — o que já está travado

- Qualquer visitante pode **ler** eventos e **criar** uma inscrição
  (é o formulário público) — igual ao original.
- Só o admin logado pode **criar/editar/apagar eventos** e **ler**
  a lista completa de inscritos (com e-mail, telefone, CPF).
- A lista pública de presença usa uma *view* (`v_public_registrations`)
  que só expõe nome + presença, nunca e-mail/telefone/CPF — isso é
  mais rígido que o Sheets original, que expunha a aba inteira pra
  quem tivesse o link.
