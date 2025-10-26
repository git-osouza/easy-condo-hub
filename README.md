# EASY - Gestão para Portarias

Aplicação PWA 100% funcional para gestão de entregas em condomínios. Sistema completo com registro fotográfico, notificações push e controle de acesso por perfis (Síndico, Porteiro, Morador).

## Funcionalidades

### Porteiro
- Registrar entregas com foto e notificação automática ao morador
- Registrar retirada com foto do recebedor e nome
- Buscar entregas por unidade
- Visualizar histórico de entregas

### Morador
- Receber notificações de novas entregas
- Visualizar entregas pendentes e retiradas
- Ver fotos das entregas e comprovantes de retirada

### Síndico
- Cadastrar unidades em lote (blocos, andares, apartamentos)
- Convidar moradores por e-mail (token validado)
- Cadastrar porteiros com login/senha
- Exportar relatórios de entregas (CSV)
- Exportar log de auditoria (CSV)
- Dashboard com estatísticas

## Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Database, Auth, Storage)
- **PWA**: Service Worker + Web Push API
- **Deploy**: GitHub Pages

## Requisitos

- Node.js 18+ (recomendado)
- npm ou pnpm

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:8080

## Build de Produção

```bash
npm run build
```

## Deploy no GitHub Pages

### Configuração Inicial (fazer apenas uma vez)

1. Vá em Settings → Pages do seu repositório
2. Em "Source", selecione "Deploy from a branch"
3. Em "Branch", selecione `gh-pages` e `/ (root)`
4. Clique em "Save"

### Deploy

```bash
npm run deploy
```

Este comando irá:
1. Fazer build do projeto
2. Criar/atualizar a branch `gh-pages`
3. Fazer push automático para o GitHub
4. Aguarde 1-2 minutos e acesse: `https://seu-usuario.github.io/nome-do-repo`

## Estrutura do Projeto

```
src/
├── components/
│   ├── views/           # Views principais (AuthView, PortariaView, etc)
│   ├── portaria/        # Componentes do porteiro
│   ├── sindico/         # Componentes do síndico
│   └── ui/              # Componentes shadcn/ui
├── contexts/
│   └── AuthContext.tsx  # Gerenciamento de autenticação
├── integrations/
│   └── supabase/        # Cliente e tipos Supabase
└── main.tsx             # Entry point + Service Worker
```

## PWA - Progressive Web App

O projeto está 100% configurado como PWA:

- ✅ Service Worker para cache offline (`public/sw.js`)
- ✅ Web Push para notificações
- ✅ Manifest com ícones e tema
- ✅ Instalável em desktop e mobile
- ✅ Funciona offline (dados em cache)

### Testando PWA Localmente

```bash
npm run build
npm run preview
```

Abra Chrome DevTools → Application → Manifest e Service Workers

### Testando Notificações Push

Após instalar o PWA, o morador pode aceitar notificações. Quando o porteiro registrar uma entrega, a notificação será enviada automaticamente.

## Variáveis de Ambiente

Crie um arquivo `.env` com:

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
```

## Segurança e RLS

Todas as tabelas possuem Row Level Security (RLS) habilitado:
- Moradores veem apenas entregas de suas unidades
- Porteiros veem e gerenciam todas as entregas
- Síndicos têm acesso total para gestão e relatórios

## Credenciais de Teste

### Primeiro Acesso (Síndico)
Faça o cadastro inicial como síndico para:
1. Cadastrar as unidades do condomínio
2. Convidar moradores por e-mail
3. Cadastrar porteiros

### Porteiro
- Login: `nome.sobrenome` (exemplo: `joao.silva`)
- Senha: gerada pelo síndico

### Morador
- E-mail: convite enviado pelo síndico
- Senha: definida no primeiro acesso via token

## Scripts Disponíveis

```bash
npm run dev        # Desenvolvimento
npm run build      # Build de produção
npm run preview    # Preview do build
npm run lint       # Verificar código
npm run deploy     # Deploy no GitHub Pages
```

## Próximos Passos

- [ ] Adicionar gráficos no dashboard do síndico
- [ ] Implementar filtros avançados de busca
- [ ] Adicionar modo escuro
- [ ] Exportar relatórios em PDF
- [ ] Integração com impressora térmica (para recibos)

## Contribuição

Pull requests são bem-vindos. Para mudanças importantes:
1. Abra uma issue primeiro para discutir
2. Execute `npm run lint` antes de submeter
3. Mantenha o padrão de código do projeto

## Licença

MIT

## Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
