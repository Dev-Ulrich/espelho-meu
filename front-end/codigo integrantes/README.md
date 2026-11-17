# Guias de implementação — Arthur e Yasmin

Os exemplos são código para os integrantes implementarem e revisarem. As seções **não foram instaladas** em `src/`. Cada pessoa registra suas cinco entregas na própria conta, depois da revisão do Victor. Esta preparação não cria commits, branches nem PRs.

- [Arthur — Como funciona e Central de ajuda](Arthur/README.md)
- [Yasmin — Benefícios, convite e rodapé](Yasmin/README.md)
- [Divisão completa da equipe](../PLANO-DE-COMMITS.md): as tarefas do Matheus P. e do Matheus L. continuam intactas.
- [Frame da homepage](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=20-363), consultado em 14/11/2026.

## Base disponível

Os caminhos dos exemplos são relativos a `front-end/`. O código usa React, TypeScript, CSS local, `Link` de `react-router`, `ActionLink` de `src/components/ui/ActionLink.tsx` e `paths` de `src/app/paths.ts`. As variáveis `--ivory`, `--paper`, `--petrol`, `--ink`, `--rose`, `--line`, `--purple`, `--heading-font` e `--body-font` já existem em `src/styles/global.css`. Lato foi instalada localmente para os textos de interface do protótipo.

Assets exportados estão em `src/assets/figma/`, com a origem registrada no README dessa pasta. Os SVGs mantêm seus tamanhos originais: ajuste o contêiner, sem sobrescrever largura/altura do SVG. Não use screenshots como assets nem URLs temporárias do Figma no aplicativo.

## Montagem coordenada pelo Victor

| Componente futuro | Arquivo | Ponto de montagem |
| --- | --- | --- |
| `HowItWorks` | `src/pages/home/how-it-works/HowItWorks.tsx` | Após `.home-hero`, em `src/pages/home/HomePage.tsx` |
| `SimulationPreview` (Matheus L.) | `src/pages/home/simulation-preview/` | Entre `HowItWorks` e `Benefits`; aguardar a entrega dele |
| `Benefits` | `src/pages/home/benefits/Benefits.tsx` | Após a vitrine do Matheus L. |
| `FinalCta` | `src/pages/home/final-cta/FinalCta.tsx` | Após `Benefits` |
| `SiteFooter` | `src/components/layout/footer/SiteFooter.tsx` | Após `</main>` em `src/components/layout/SiteLayout.tsx`, apenas quando `withHeader` for verdadeiro |
| `HelpPage` | `src/pages/ajuda/HelpPage.tsx` | Substitui o `StarterPage` de `paths.ajuda` em `src/app/App.tsx` |

A rota `/ajuda` já existe como página em preparação. Arthur implementa o conteúdo e mantém `id="perguntas"` e `id="preparar-foto"` para os links do rodapé. Yasmin pode usar `/ajuda` agora; os links para fragmentos devem entrar junto com a Central de ajuda. Para suportar links entre rotas com fragmentos, Victor deve acrescentar navegação até o elemento após a montagem no `SiteLayout` (o efeito atual só rola para o início).

Não importe componentes antes que os arquivos existam. Ao integrar a home, envolva a capa atual e as novas seções em `<>...</>`; preserve o cabeçalho e a capa. Não monte o rodapé dentro de cada página.

## Destinos confirmados

`/`, `/cabelo`, `/maquiagem`, `/catalogo`, `/consultoria`, `/entrar`, `/cadastro`, `/recuperar-senha`, `/minha-conta` e `/ajuda` existem. Não há URLs confirmadas de contato, redes sociais, privacidade e termos. Apresente a pendência em texto, sem `href="#"`, contatos inventados ou links externos presumidos.

## Conferência de cada entrega

Dentro de `front-end/`, execute `npm run build` e `npm run dev`. Confira 360, 768 e 1280 px, zoom de 200%, leitura sem corte, ordem de Tab, foco visível e acionamento com Enter (e Espaço nos botões). Os grids não devem mudar a ordem semântica. Compare textos e assets ao frame. Nenhum serviço de conta, IA, envio de foto ou e-mail está integrado; os guias não podem prometer sucesso dessas operações.

As mensagens de commit nos guias são sugestões para uso posterior pelos autores; não são comandos executados nesta preparação.
