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

## Fluxo autenticado

As entradas públicas são `/`, `/entrar` e `/cadastro`. A conta fica em `/minha-conta` e a consultoria capilar em `/consultoria/cabelo/:etapa`. O painel `/admin` exige a role `ADMIN` e oferece os cadastros de produtos, usuários e cortes. Maquiagem, edição de imagens e recuperação de senha ficam para etapas posteriores.

O front acessa o Java no mesmo domínio pela rota `/api/java`. O proxy do Vite aponta para `127.0.0.1:8080` e o da Vercel para o serviço Java. A sessão usa cookie HttpOnly, e as requisições de escrita incluem o token obtido em `GET /auth/csrf`. O Flask recebe as chamadas de consultoria somente pelo Java. A [configuração da API Java](../java/README.md) descreve a migração e as variáveis necessárias.

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

## Conferência manual

1. Como visitante, abra diretamente a conta, a consultoria e o painel e confirme o redirecionamento para Entrar.
2. Cadastre uma conta, entre, recarregue a página e confirme que ela continua autenticada.
3. Preencha a consultoria capilar com e sem coloração e penteados, revise as respostas e gere o resultado. Para análise facial, use uma foto autorizada.
4. Como usuário comum, tente abrir o painel. Como administrador, teste criar, listar, editar e excluir um registro em cada entidade usando dados fictícios.
5. Confira o layout em 390, 768 e 1440 px e navegue usando Tab, Shift+Tab e Enter.

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
