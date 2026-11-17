# Yasmin — Benefícios, convite final e rodapé

Referência: [homepage, frame 20:363](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=20-363). Preserve os quatro benefícios do frame: **Personalização**, **Inclusão**, **Praticidade** e **Autonomia**. Assets originais já estão em `src/assets/figma/`.

Os exemplos abaixo são para você implementar; seus componentes ainda não existem em `src/`. Combine a montagem com Victor e registre as entregas com sua própria conta após a revisão. Não implemente a vitrine de simulação do Matheus L.

## 1. Benefícios

Criar `src/pages/home/benefits/Benefits.tsx`:

```tsx
import sparkles from '../../../assets/figma/home-IconeSparkles3.svg';
import users from '../../../assets/figma/home-IconeUsers.svg';
import bolt from '../../../assets/figma/home-IconeBolt.svg';
import heart from '../../../assets/figma/home-IconeHeart.svg';
import './benefits.css';

const benefits = [
  { title: 'Personalização', description: 'Recomendações sob medida para o seu estilo, traços e objetivos.', icon: sparkles },
  { title: 'Inclusão', description: 'Beleza para todas as identidades, gêneros, tipos de cabelo e tons de pele.', icon: users },
  { title: 'Praticidade', description: 'Descubra, simule e compare looks de forma rápida e intuitiva.', icon: bolt },
  { title: 'Autonomia', description: 'Inspiração, simulação e tecnologia para você escolher o que te faz bem.', icon: heart },
];

export function Benefits() {
  return (
    <section className="benefits" aria-labelledby="benefits-title">
      <h2 id="benefits-title">Por que escolher o Espelho Meu?</h2>
      <ul className="benefits__grid">
        {benefits.map(({ title, description, icon }) => (
          <li key={title}>
            <span className="benefits__icon"><img src={icon} alt="" /></span>
            <div><h3>{title}</h3><p>{description}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

Criar `src/pages/home/benefits/benefits.css`:

```css
.benefits { width: min(100% - 40px, 1150px); margin: 48px auto; }
.benefits h2 { color: var(--petrol); font: 600 2.3rem/1.3 var(--heading-font); }
.benefits h2::after { content: ''; display: inline-block; width: 56px; height: 2px; margin: 0 0 8px 22px; background: var(--rose); }
.benefits__grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 20px; list-style: none; }
.benefits__grid li { display: flex; align-items: flex-start; gap: 16px; padding: 15px; border: 1px solid var(--line); border-radius: 14px; }
.benefits__icon { display: grid; place-items: center; width: 44px; height: 44px; flex: none; border-radius: 50%; background: #f2e4dd; }
.benefits h3 { color: var(--petrol); font: 700 1rem/1.3 'Lato', sans-serif; }
.benefits p { font: .75rem/1.5 'Lato', sans-serif; margin-top: 6px; }
```

Montagem: Victor importa `Benefits` de `./benefits/Benefits` em `src/pages/home/HomePage.tsx` e renderiza `<Benefits />` após a vitrine da home do Matheus L. Enquanto ela não existir, colocar após `HowItWorks` (se já entregue), sem importar arquivos ausentes. Preservar a ordem final capa → passos → vitrine → benefícios → convite.

Commit sugerido: `feat: cria seção de benefícios da home`.

Conferir: textos, quatro ícones e ordem batem com o frame; imagens decorativas usam `alt=""`; títulos não pulam de `h1` para `h3`; `npm run build` passa.

## 2. Grade responsiva

Acrescentar a `benefits.css`:

```css
@media (max-width: 1100px) {
  .benefits__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .benefits__grid { grid-template-columns: 1fr; }
  .benefits h2 { font-size: 2rem; }
  .benefits h2::after { display: none; }
}
```

Commit sugerido: `style: ajusta grade responsiva dos benefícios`.

Conferir: quatro colunas em 1280 px, duas em 768 px e uma em 360 px. Sem altura fixa, corte de texto, transbordamento ou reordenação do HTML. Conferir zoom de 200%.

## 3. Convite final

Criar `src/pages/home/final-cta/FinalCta.tsx`:

```tsx
import { ArrowRight } from 'lucide-react';
import { ActionLink } from '../../../components/ui/ActionLink';
import { paths } from '../../../app/paths';
import curves from '../../../assets/figma/home-CourbesDecorativesRose.svg';
import './final-cta.css';

export function FinalCta() {
  return (
    <section className="final-cta" aria-labelledby="final-cta-title">
      <div className="final-cta__decoration" aria-hidden="true"><img src={curves} alt="" /></div>
      <h2 id="final-cta-title">Pronto para descobrir novas possibilidades?</h2>
      <ActionLink to={paths.consultoria} variant="outline">Começar agora <ArrowRight size={16} aria-hidden="true" /></ActionLink>
    </section>
  );
}
```

Criar `src/pages/home/final-cta/final-cta.css`:

```css
.final-cta { position: relative; isolation: isolate; overflow: hidden; width: min(100% - 40px, 1190px); margin: 48px auto; padding: 20px 48px; display: flex; align-items: center; justify-content: space-between; gap: 24px; background: var(--purple); color: var(--paper); border-radius: 20px; }
.final-cta h2 { font: 700 2rem/1.2 var(--heading-font); }
.final-cta .action-link { flex-shrink: 0; }
.final-cta__decoration { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.final-cta__decoration img { max-width: none; }
@media (max-width: 700px) {
  .final-cta { flex-direction: column; align-items: flex-start; padding: 24px; }
}
```

Montagem: importar `FinalCta` de `./final-cta/FinalCta` e inserir `<FinalCta />` após `<Benefits />` em `HomePage.tsx`. As páginas de cabelo/maquiagem também têm convite no protótipo, com texto “Sua próxima mudança começa com uma ideia.”; combinar uma variante com Victor em entrega posterior, sem copiar o componente em cada página. Os vetores locais `cabelo-Vector1.svg` e `maquiagem-Vector1.svg` ficam disponíveis para essa variação.

Commit sugerido: `feat: cria convite final com acesso à consultoria`.

Conferir: CTA recebe foco, funciona com Enter e leva a `/consultoria`; mantém a exigência de autenticação. A decoração não intercepta cliques. Em celular, texto e CTA ficam legíveis e o foco não é cortado.

## 4. Rodapé com destinos reais

Criar `src/components/layout/footer/SiteFooter.tsx`:

```tsx
import { Link } from 'react-router';
import { paths } from '../../../app/paths';
import logo from '../../../assets/figma/home-FotoFooterLogo.png';
import './footer.css';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__columns">
        <div className="site-footer__brand">
          <Link to={paths.home} aria-label="Espelho Meu, início"><img src={logo} alt="Espelho Meu" width={138} height={109} /></Link>
          <p>Uma plataforma de beleza e tecnologia que usa IA para conectar você aos melhores estilos de cabelo e maquiagem.</p>
        </div>
        <nav aria-label="Suporte">
          <h2>Suporte</h2>
          <Link to={paths.ajuda}>Central de ajuda</Link>
          <p>Contato, privacidade e termos: em preparação.</p>
        </nav>
        <div>
          <h2>Siga o Espelho Meu</h2>
          <p>Perfis oficiais em preparação.</p>
        </div>
      </div>
      <div className="site-footer__bottom">
        <p>© 2026 Espelho Meu. Todos os direitos reservados.</p>
        <p>Cuidado, beleza e tecnologia em um só lugar.</p>
      </div>
    </footer>
  );
}
```

Após Arthur entregar os IDs da ajuda e Victor integrar a navegação por fragmentos, acrescentar dentro de `nav`:

```tsx
<Link to={`${paths.ajuda}#perguntas`}>Dúvidas frequentes</Link>
<Link to={`${paths.ajuda}#preparar-foto`}>Prepare sua foto</Link>
```

Não adicionar esses links antes dos destinos. Não inventar contatos ou URLs de redes sociais. Os ícones sociais do frame só viram links após a confirmação dos perfis; até lá, manter a pendência em texto.

Criar `src/components/layout/footer/footer.css`:

```css
.site-footer { max-width: 1280px; margin: 48px auto 0; padding: 24px 48px; color: var(--petrol); font: .8125rem/1.5 'Lato', sans-serif; }
.site-footer__columns { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px; align-items: start; }
.site-footer__brand { display: flex; align-items: center; gap: 32px; }
.site-footer__brand > a { flex-shrink: 0; }
.site-footer__brand img { width: 138px; height: auto; }
.site-footer__brand p { max-width: 328px; }
.site-footer h2 { font-weight: 700; margin-bottom: 12px; }
.site-footer nav { display: grid; gap: 8px; padding-left: 32px; border-left: 1px solid var(--line); }
.site-footer nav a { text-decoration: underline; text-underline-offset: 3px; }
.site-footer__bottom { display: flex; justify-content: space-between; gap: 24px; border-top: 1px solid var(--rose); margin-top: 28px; padding-top: 16px; font-size: .75rem; }
```

Montagem no `src/components/layout/SiteLayout.tsx`, com Victor:

```tsx
import { SiteFooter } from './footer/SiteFooter';
// No fragmento, imediatamente após </main>:
{withHeader && <SiteFooter />}
```

A condição mantém o rodapé fora das telas de acesso/conta, que têm layout próprio. Nunca duplicar o footer na home e no layout.

Commit sugerido: `feat: estrutura rodapé com marca e links de suporte`.

Conferir: marca retorna a `/`; Central de ajuda abre `/ajuda` (página provisória até Arthur entregá-la); navegação tem rótulo; sem links falsos. Conferir proporção da logo vertical original, distinta da marca horizontal do cabeçalho.

## 5. Rodapé no celular e teclado

Acrescentar ao final de `footer.css`:

```css
@media (max-width: 900px) {
  .site-footer { padding-inline: 24px; }
  .site-footer__columns { grid-template-columns: 1fr 1fr; }
  .site-footer__brand { grid-column: 1 / -1; }
  .site-footer nav { padding-left: 0; border: 0; }
}
@media (max-width: 600px) {
  .site-footer__columns { grid-template-columns: 1fr; gap: 24px; }
  .site-footer__brand { flex-direction: column; align-items: flex-start; gap: 16px; }
  .site-footer__bottom { flex-direction: column; gap: 12px; }
  .site-footer nav a { display: flex; align-items: center; min-height: 44px; }
}
```

Commit sugerido: `fix: adapta rodapé e ordem de foco em telas pequenas`.

Conferir em 360, 768 e 1280 px: Tab da última ação do conteúdo → marca do rodapé → Central de ajuda → demais links confirmados, sempre na ordem do HTML. Shift+Tab retorna na ordem inversa. Foco visível, sem `tabIndex` positivo, cortes ou rolagem lateral. Com zoom de 200%, todos os textos continuam acessíveis. Rodar `npm run build` e conferir que o rodapé aparece uma única vez nas páginas públicas.
