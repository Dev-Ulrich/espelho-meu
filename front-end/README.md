# Front-End Design Engineering

Interface web do Espelho Meu em React, Vite e TypeScript, com integração à API Java. O código e o `package.json` ficam nesta pasta.

## Avaliação

| Item | Link ou status |
| --- | --- |
| GitHub | [Repositório do Espelho Meu](https://github.com/Dev-Ulrich/espelho-meu) |
| Vercel | Pendente de publicação |
| API Java | Pendente de publicação |
| Vídeo no YouTube | Pendente de publicação |
| Contato do grupo | Pendente de preenchimento |

## Executar

Use Node.js 22.12+ e rode os comandos dentro de `front-end/`.

```bash
npm ci
npm run dev
```

Use `npm run build` para validar TypeScript e gerar `dist/` e `npm run preview` para conferir o build. No Vercel, selecione `front-end` como Root Directory.

## Organização

| Caminho | Conteúdo |
| --- | --- |
| `src/app/` | Definição de rotas e composição do aplicativo |
| `src/components/layout/` | Cabeçalho e estrutura das páginas |
| `src/components/ui/` | Componentes reaproveitáveis |
| `src/pages/` | Páginas e seus estilos ou componentes específicos |
| `src/styles/` | Estilos globais e variáveis de tema |
| `src/assets/` | Imagens e vetores usados pela interface |

O cabeçalho, a capa da home e a navegação entre as rotas estão implementados. As telas internas estão em preparação. Consulte o [plano de commits da equipe](PLANO-DE-COMMITS.md) para os próximos componentes e integrações.

[Protótipo da homepage no Figma](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=20-363)

## Entrega no Portal

O ZIP do Portal deve ter até 50 MB, com código, configurações, recursos e README. Exclua `node_modules`. Inclua o arquivo de identificação do grupo na entrega do Portal. O histórico deve registrar cinco commits por integrante e pelo menos quinze no total.

[Voltar ao índice](../README.md)
