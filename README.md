# EASY - Gestão para Portarias

Aplicação web (frontend) para gestão de entregas em condomínios, com foco em registro fotográfico, controle de visitantes/entregas e comunicação em tempo real.

Este repositório contém a interface construída com Vite + React + TypeScript e componentes estilo shadcn/ui. O projeto está configurado para PWA (Progressive Web App) usando `vite-plugin-pwa`.

## Principais funcionalidades
- Registro de entregas com fotos
- Pesquisa e cadastro de entregas e retiradas
- Diálogo para registro de visitantes/porteiros
- Gerenciamento de unidades e convites (para síndico)
- Notificações e toasts na UI
- Layout responsivo e otimizado para mobile

Componentes principais estão em `src/components` e views em `src/components/views`.

## Objetivos do projeto
- Fornecer uma interface leve para equipes de portaria gerenciarem entregas e visitantes.
- Oferecer versão PWA instalável para uso offline/instalado em dispositivos móveis e desktop.
- Ser modular e fácil de integrar com backends (o projeto já inclui integração com Supabase no diretório `integrations/supabase`).

## Estado atual do PWA
- `vite-plugin-pwa` está configurado em `vite.config.ts` e gera o service worker durante o build.
- `manifest.webmanifest` está presente e inclui ícones (SVG e PNG), `theme_color` e `background_color` configurados.
- `src/main.tsx` registra o service worker via helper `virtual:pwa-register` (com fallback manual).
- Ícones principais estão em `public/` (ex.: `app-icon.svg`, `icon-512x512.png`).

Observação: para gerar corretamente o service worker e testar o comportamento de PWA é necessário rodar o build (produção) — o plugin injeta o SW no build final.

## Requisitos
- Node.js 18+ (recomendado) ou LTS compatível
- npm (ou pnpm/yarn)

## Instalação e execução (desenvolvimento)
1. Instale dependências:

```bash
npm install
```

2. Execute em modo desenvolvimento:

```bash
npm run dev
```

O app ficará disponível em http://localhost:8080 (conforme `vite.config.ts`).

## Build e preview (produção)

```bash
npm run build
npm run preview
```

Depois abra a URL indicada pelo `vite preview` e use o DevTools → Application para inspecionar o Manifest e o Service Worker.

## Testes e verificação PWA
- Verifique em Chrome DevTools → Application:
	- Manifest: checar ícones, name, theme/background color
	- Service Workers: checado se `sw.js` está registrado
- Rode Lighthouse → PWA para avaliar a pontuação e itens faltantes

## Notas sobre ícones e aparência instalada
- Adicionei `public/app-icon.svg` (SVG com fundo sólido) para evitar atalho/splash em branco em algumas plataformas.
- Para máxima compatibilidade é recomendado ter PNGs 192x192 e 512x512 com fundo opaco; o projeto contém `icon-512x512.png`. Se necessário posso gerar versões adicionais.

## Integração com backend
- O projeto já tem uma pasta `integrations/supabase` com cliente e tipos; configure as variáveis de ambiente do Supabase para conectar-se ao backend.

## Próximos passos recomendados
- Gerar PNGs adicionais (192x192) para garantir compatibilidade iOS/Android.
- Adicionar declaração TypeScript para o módulo virtual `virtual:pwa-register` (arquivo `src/vite-plugin-pwa.d.ts`) para evitar warnings do TypeScript.
- Configurar HTTPS no servidor de produção (requisito para instalação PWA em ambientes reais).

## Contribuição
- Pull requests são bem-vindos. Mantenha a consistência de estilo do projeto. Execute `npm run lint` antes de submeter.

## Licença
Defina a licença do projeto conforme sua escolha (ex.: MIT). Atualmente o repositório não contém um arquivo LICENSE.

---
Se quiser, eu posso:
- Gerar automaticamente PNGs 192/512 em `public/`.
- Criar `src/vite-plugin-pwa.d.ts` para suprimir warnings de TypeScript.
- Rodar um build/preview e rodar Lighthouse aqui (precisa confirmar Node 18+). Diga qual prefira.
