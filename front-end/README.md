# Espelho Meu — Front-End

Projeto da turma **1TDSPW de ADS da FIAP**, Global Solution 2026/2. Interface em React, Vite, TypeScript e Tailwind CSS, com integração às APIs Java e Flask. Esta pasta contém código, lockfile, assets originais e guias de contribuição.

## Executar e validar

Use Node.js **22.12+**. Na raiz do repositório:

```bash
cd front-end
cp .env.example .env.local
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

## Funcionalidades e integração

| Área | Comportamento |
| --- | --- |
| Páginas públicas | Início, Sobre, Integrantes, detalhe de integrante, FAQ, Contato, Cabelo, Maquiagem e Catálogo. |
| Java | `GET /produto` exibe os produtos capilares na seção Cabelo. O cadastro remoto de teste depende da configuração de demonstração no servidor. |
| Consultoria | Questionários separados para cabelo e maquiagem. O Flask retorna a sugestão principal do modelo e alternativas com justificativas e cuidados. |
| Fotos | Simulação opcional por sugestão. Disponível quando o Flask informa que o serviço de imagens está ativo. |
| Histórico e favoritas | As sugestões salvas ficam no armazenamento do navegador e podem ser removidas em Minha conta. |
| Conta | Cadastro com senha, login, recuperação e sincronização dependem da implementação de autenticação na API Java. |

Em desenvolvimento, execute `flask --app app run` na pasta `ia-chatbot` após instalar suas dependências. O Vite encaminha as rotas de IA ao Flask na porta 5000. Em produção, o build usa a URL `VITE_IA_BASE_URL` ou, por padrão, a API de IA do Render. O servidor aceita por padrão a origem `https://espelho-meu-two.vercel.app`. Para outro domínio ou um preview, configure a lista `ESPELHO_FRONT_ORIGINS` no Render.

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
| [codigo integrantes/](<codigo integrantes/README.md>) | Guias de Arthur, Yasmin, Matheus P. e Matheus L., com código, montagem e cinco entregas cada |

Os guias dos integrantes e o plano de commits registram a divisão original do trabalho. O rodapé faz parte do layout das páginas públicas.

## Referências e limites desta revisão

[Protótipo completo](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=0-1).

Foram consultados os frames [home](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=20-363), [cabelo](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=54-104), [maquiagem](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=74-464), [cadastro](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=35-379), [conta](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=150-1400) e [consultoria](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=3-1739), com código e screenshots de referência.

O limite do plano Figma impediu a leitura de [catálogo](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=3-1783), [login](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=27-98) e [recuperação](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=74-169). Essas telas receberam navegação/formulários com os componentes existentes; a fidelidade aos respectivos frames permanece pendente. O cadastro usa o layout disponível; conta e consultoria foram adaptadas para deixar explícito o estado sem autenticação.

O ZIP `espelho-meu-frontend-v2.zip` da biblioteca ChatGPT não estava acessível nesta sessão nem anexado localmente. A versão exata **não foi incorporada**; o trabalho partiu do código local e dos frames disponíveis.

## Conferência manual pendente

Revise a geometria, o foco e as interações em celular, tablet e desktop em **390, 768 e 1440 px**:

1. Home: seguir todos os links do cabeçalho e os dois CTAs, depois voltar pelo histórico.
2. Catálogo: abrir cada atalho; colorações deve mostrar sua pendência, nunca os cortes como se fossem colorações.
3. Cabelo: combinar Lisa + Curto (estado vazio), limpar filtros, abrir Bob reto; fechar por botão e Escape, conferindo retorno do foco ao acionador. Testar histórico dos filtros.
4. Maquiagem: selecionar Pele, Olhos e Lábios, abrir detalhes e chegar à consultoria com a jornada correta.
5. Formulários: enviar vazio, e-mail inválido, senha curta e confirmação diferente; conferir mensagens e foco no primeiro campo inválido. Com campos válidos, confirmar aviso de indisponibilidade, senhas limpas e ausência de requisições/sessão.
6. Conta: percorrer as cinco opções e conferir que nenhuma apresenta usuário ou dados fictícios.
7. Consultoria: testar as jornadas de cabelo e maquiagem, conferir as alternativas, salvar uma sugestão, abrir Minha conta e verificar a permanência após recarregar. Se a simulação estiver ativa, usar somente uma foto autorizada.
8. Verificar Tab/Shift+Tab, foco visível, Escape no diálogo, zoom 200%, textos sem cortes e ausência de scroll horizontal.

## Avaliação e entrega

| Item | Link ou status |
| --- | --- |
| GitHub | [Monorepo Espelho Meu](https://github.com/Dev-Ulrich/espelho-meu) |
| Vercel | [Site publicado](https://espelho-meu-two.vercel.app/) |
| API Java | [Consulta de produtos](https://espelhomeu-api.onrender.com/produto) |
| Vídeo no YouTube | Pendente de publicação |
| Contato do grupo | Pendente de preenchimento |

O ZIP do Portal deve ter até 50 MB. Inclua código, configurações, recursos, README e identificação do grupo; exclua `node_modules`, `.git` e `dist`. Os assets originais são grandes: conferir o tamanho do ZIP final. Cada integrante registra suas próprias cinco contribuições, após revisão, com pelo menos quinze commits no total conforme os critérios da disciplina. Esta preparação deixa as mudanças locais, **sem commit, push, branch nova ou PR**.

[Voltar ao índice](../README.md)
