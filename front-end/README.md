# Espelho Meu — Front-End

Projeto da turma **1TDSPW de ADS da FIAP**, Global Solution 2026/2. Interface em React, Vite, TypeScript e Tailwind CSS, preparada para futura integração com a API Java. Esta pasta contém código, lockfile, assets originais e guias de contribuição.

## Executar e validar

Use Node.js **22.12+**. Na cópia local atual:

```bash
cd "/home/victor/Documentos/Espelho Meu/espelho-meu/front-end"
npm ci
npm run dev
```

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

`npm test` verifica validação de acesso e renderização das rotas/filtros via React no servidor; não substitui teste interativo em navegador. Não há script de lint configurado. O build gera `dist/`. Para Vercel, usar `front-end` como Root Directory; `vercel.json` contém o fallback das rotas da SPA.

## Estado real em 14/11/2026

| Área | Disponível | Pendente |
| --- | --- | --- |
| Home | Capa, cabeçalho e navegação preservados | Passos/ajuda (Arthur), benefícios/convite/rodapé (Yasmin), vitrine (Matheus L.) |
| Cabelo | Capa original, quatro cortes, filtros combinados por textura/comprimento, detalhes em diálogo, comparação ilustrativa | Cartões de colorações e simulação de cor/combinação; a categoria informa a ausência de referências |
| Maquiagem | Capa original, cartões, filtros Pele/Olhos/Lábios, detalhes e comparação ilustrativa | Simulação personalizada |
| Catálogo | Três atalhos para cortes, colorações e maquiagem, com categoria na URL | Conferir aparência e categorias com o frame, indisponível por limite do Figma |
| Acesso | Login/cadastro/recuperação, validação local, confirmação de senha e navegação | Endpoints de autenticação, cadastro e recuperação; documentos de termos e privacidade |
| Minha conta | Menu de Perfil, Minhas consultorias, Favoritas, Preferências e Configurações | Dados reais e sessão autenticada; nenhuma identidade ou histórico de exemplo é apresentado como real |
| Consultoria | Abertura, seleção capilar/maquiagem e preservação da escolha na navegação de acesso | Autenticação, upload, questionário, recomendação e processamento |
| Ajuda | Rota `/ajuda` reservada com página em preparação | Conteúdo a ser implementado pelo Arthur |

Os formulários **não enviam nem persistem dados**, não criam sessão e nunca apresentam cadastro, login ou envio de e-mail como concluídos. Ao submeter campos válidos, exibem a indisponibilidade e limpam as senhas. A regra provisória de nova senha é mínimo de oito caracteres; telefone é opcional. Essas regras devem ser alinhadas ao contrato Java. O aceite de termos está desabilitado até os documentos existirem.

A pasta `../java/` contém somente um README; não há URL de API, código de endpoint ou contrato documentado nesta cópia. Por isso nenhum endpoint foi inventado. A implementação de `src/services/api/` com **Fetch API**, login/cadastro e consulta de perfil continua atribuída ao Matheus P. em [PLANO-DE-COMMITS.md](PLANO-DE-COMMITS.md).

O upload em `src/pages/consultoria/foto/` e a vitrine em `src/pages/home/simulation-preview/` continuam com Matheus L. A tela de consultoria não abre seletor de arquivo nem permite análise personalizada sem autenticação. JPG/PNG vêm do protótipo; limite de tamanho ainda precisa ser confirmado com a API.

## Organização e revisão

| Caminho | Conteúdo |
| --- | --- |
| `src/app/` | Rotas e caminhos compartilhados |
| `src/components/layout/` | Cabeçalho preservado, layout público e layout sem cabeçalho para acesso/conta |
| `src/pages/inspiracao/` | Cabelo/maquiagem, dados editoriais, filtros, diálogo e estilos |
| `src/pages/acesso/` | Formulários, validação e layout de cadastro reaproveitado no acesso |
| `src/pages/conta/` | Navegação da conta em estado não autenticado |
| `src/pages/catalogo/` | Atalhos por categoria |
| `src/pages/consultoria/` | Abertura e seleção de jornada |
| `src/assets/figma/` | Exports originais locais e registro de origem |
| `tests/` | Validação de campos e renderização de rotas |
| [codigo integrantes/](<codigo integrantes/README.md>) | Guias de Arthur e Yasmin, com TSX/CSS, montagem e cinco entregas cada |

Os componentes reservados aos integrantes estão descritos nos guias, **não implementados**. `PLANO-DE-COMMITS.md` foi preservado. O rodapé não foi duplicado nas páginas internas; sua integração global ficará com Yasmin e Victor. Os exemplos do Figma não equivalem a funcionalidades de IA já disponíveis.

## Referências e limites desta revisão

[Protótipo completo](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=0-1).

Foram consultados os frames [home](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=20-363), [cabelo](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=54-104), [maquiagem](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=74-464), [cadastro](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=35-379), [conta](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=150-1400) e [consultoria](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=3-1739), com código e screenshots de referência.

O limite do plano Figma impediu a leitura de [catálogo](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=3-1783), [login](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=27-98) e [recuperação](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=74-169). Essas telas receberam navegação/formulários com os componentes existentes; a fidelidade aos respectivos frames permanece pendente. O cadastro usa o layout disponível; conta e consultoria foram adaptadas para deixar explícito o estado sem autenticação.

O ZIP `espelho-meu-frontend-v2.zip` da biblioteca ChatGPT não estava acessível nesta sessão nem anexado localmente. A versão exata **não foi incorporada**; o trabalho partiu do código local e dos frames disponíveis.

## Conferência manual pendente

Não havia navegador conectado nesta sessão. Os estilos incluem adaptações para celular/tablet/desktop, mas a geometria renderizada, o foco e as interações precisam ser revisados em **360, 768 e 1280 px**:

1. Home: seguir todos os links do cabeçalho e os dois CTAs, depois voltar pelo histórico.
2. Catálogo: abrir cada atalho; colorações deve mostrar sua pendência, nunca os cortes como se fossem colorações.
3. Cabelo: combinar Lisa + Curto (estado vazio), limpar filtros, abrir Bob reto; fechar por botão e Escape, conferindo retorno do foco ao acionador. Testar histórico dos filtros.
4. Maquiagem: selecionar Pele, Olhos e Lábios, abrir detalhes e chegar à consultoria com a jornada correta.
5. Formulários: enviar vazio, e-mail inválido, senha curta e confirmação diferente; conferir mensagens e foco no primeiro campo inválido. Com campos válidos, confirmar aviso de indisponibilidade, senhas limpas e ausência de requisições/sessão.
6. Conta: percorrer as cinco opções e conferir que nenhuma apresenta usuário ou dados fictícios.
7. Consultoria: selecionar maquiagem, abrir cadastro/login e voltar; a escolha deve permanecer. Não deve haver upload nem resultado personalizado.
8. Verificar Tab/Shift+Tab, foco visível, Escape no diálogo, zoom 200%, textos sem cortes e ausência de scroll horizontal.

## Avaliação e entrega

| Item | Link ou status |
| --- | --- |
| GitHub | [Monorepo Espelho Meu](https://github.com/Dev-Ulrich/espelho-meu) |
| Vercel | Pendente de publicação |
| API Java | Pendente de implementação/publicação |
| Vídeo no YouTube | Pendente de publicação |
| Contato do grupo | Pendente de preenchimento |

O ZIP do Portal deve ter até 50 MB. Inclua código, configurações, recursos, README e identificação do grupo; exclua `node_modules`, `.git` e `dist`. Os assets originais são grandes: conferir o tamanho do ZIP final. Cada integrante registra suas próprias cinco contribuições, após revisão, com pelo menos quinze commits no total conforme os critérios da disciplina. Esta preparação deixa as mudanças locais, **sem commit, push, branch nova ou PR**.

[Voltar ao índice](../README.md)
