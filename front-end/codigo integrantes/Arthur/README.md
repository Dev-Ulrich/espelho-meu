# Arthur — Como funciona e Central de ajuda

Referência: [homepage, frame 20:363](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=20-363). As quatro etapas, na ordem do Figma: **Envie sua foto**, **Responda o questionário**, **Receba recomendações**, **Teste visuais**. O texto abaixo da seção é “Uma experiência simples, inteligente e personalizada.”

A Central de ajuda não teve um frame específico fornecido. Use o tema existente; os textos de suporte abaixo refletem o estado real do projeto e devem ser revisados quando a API estiver disponível. Não implemente o upload nem a vitrine da home: pertencem ao Matheus L.

## 1. Estruturar as quatro etapas

Criar `src/pages/home/how-it-works/HowItWorks.tsx`:

```tsx
import './how-it-works.css';

const steps = [
  { title: 'Envie sua foto', description: 'Use uma foto atual, com boa iluminação.' },
  { title: 'Responda o questionário', description: 'Conte sobre seu estilo, rotina e preferências.' },
  { title: 'Receba recomendações', description: 'Veja sugestões personalizadas de cortes, cores e maquiagens.' },
  { title: 'Teste visuais', description: 'Simule os resultados e experimente novos looks antes de decidir.' },
];

export function HowItWorks() {
  return (
    <section className="how-it-works" aria-labelledby="how-title">
      <h2 id="how-title">Como funciona</h2>
      <p>Uma experiência simples, inteligente e personalizada.</p>
      <ol className="how-it-works__steps">
        {steps.map(step => (
          <li key={step.title}>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

Criar `src/pages/home/how-it-works/how-it-works.css`:

```css
.how-it-works { width: min(100% - 40px, 1150px); margin: 48px auto; }
.how-it-works h2 { color: var(--petrol); font: 600 2.5rem/1.1 var(--heading-font); }
.how-it-works > p { margin-top: 8px; }
.how-it-works__steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 48px; margin-top: 24px; list-style: none; }
.how-it-works__steps li { position: relative; padding: 24px 16px; border: 1px solid var(--line); border-radius: 20px; text-align: center; }
.how-it-works__steps h3 { font: 700 1.125rem/1.4 var(--heading-font); color: var(--petrol); }
.how-it-works__steps p { font: .875rem/1.5 'Lato', sans-serif; margin-top: 12px; }
```

Montagem coordenada: em `src/pages/home/HomePage.tsx`, importar `HowItWorks` de `./how-it-works/HowItWorks` e renderizar `<HowItWorks />` logo após `</section>` da capa, com um fragmento envolvendo o retorno. Não reescrever a capa.

Commit sugerido: `feat: adiciona sequência de quatro passos da consultoria`.

Conferir: comparar os quatro títulos, textos e ordem ao frame; verificar um único `h1` na home e a lista ordenada no HTML; rodar `npm run build`.

## 2. Ícones, setas e numeração

No mesmo TSX, adicionar os imports reais:

```tsx
import { Camera } from 'lucide-react';
import listIcon from '../../../assets/figma/home-IconeList.svg';
import sparklesIcon from '../../../assets/figma/home-IconeSparkles1.svg';
import eyeIcon from '../../../assets/figma/home-IconeEye.svg';
import arrowIcon from '../../../assets/figma/home-IconeArrow.svg';
```

O primeiro ícone do frame é o componente `Camera`; os demais são exports originais locais. Antes da função, adicionar:

```tsx
const icons = [null, listIcon, sparklesIcon, eyeIcon];
```

Trocar apenas o `map` da lista pelo trecho abaixo:

```tsx
{steps.map((step, index) => (
  <li key={step.title}>
    <span className="how-it-works__number" aria-hidden="true">{index + 1}</span>
    <span className="how-it-works__icon" aria-hidden="true">
      {index === 0 ? <Camera size={36} /> : <img src={icons[index] ?? undefined} alt="" />}
    </span>
    <h3>{step.title}</h3>
    <p>{step.description}</p>
    {index < steps.length - 1 && <img className="how-it-works__arrow" src={arrowIcon} alt="" />}
  </li>
))}
```

Acrescentar ao CSS:

```css
.how-it-works__number { position: absolute; right: 8px; top: 8px; width: 28px; height: 28px; border-radius: 50%; background: var(--rose); color: var(--paper); font: 700 1rem/28px 'Lato', sans-serif; }
.how-it-works__icon { display: grid; place-items: center; width: 60px; height: 60px; margin: 0 auto 16px; border-radius: 50%; background: #f2e4dd; color: #5b435b; }
.how-it-works__arrow { position: absolute; right: -36px; top: calc(50% - 12px); }
```

Commit sugerido: `feat: incorpora os ícones e a numeração dos passos`.

Conferir: câmera → lista → brilhos → olho; numeração 1–4, setas entre etapas (não após a quarta). Ícones não recebem foco nem texto alternativo redundante. Não alterar as dimensões dos SVGs exportados.

## 3. Responsividade

Acrescentar ao final de `how-it-works.css`:

```css
@media (max-width: 1000px) {
  .how-it-works__steps { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
  .how-it-works__arrow { display: none; }
}
@media (max-width: 600px) {
  .how-it-works__steps { grid-template-columns: 1fr; }
  .how-it-works h2 { font-size: 2.125rem; }
}
```

Commit sugerido: `style: adapta os passos para telas menores`.

Conferir: quatro colunas em 1280 px, duas em 768 px, uma em 360 px. O conteúdo cresce com o texto; sem alturas fixas nos cartões, scroll horizontal ou ordem visual diferente do HTML. Testar zoom de 200%.

## 4. Central de ajuda e perguntas frequentes

Criar `src/pages/ajuda/HelpPage.tsx`:

```tsx
import { ActionLink } from '../../components/ui/ActionLink';
import { paths } from '../../app/paths';
import './help.css';

const questions = [
  { question: 'Preciso enviar uma foto?', answer: 'A consultoria personalizada prevê o uso de uma foto com o rosto visível. O envio ainda está em preparação. Você pode explorar as referências do catálogo sem enviar imagens.' },
  { question: 'Para que serve o questionário?', answer: 'Ele reunirá informações sobre seu estilo, sua rotina e suas preferências para orientar as sugestões. Essa etapa ainda não está disponível.' },
  { question: 'As recomendações já são personalizadas?', answer: 'Ainda não. As páginas atuais mostram referências do protótipo. A personalização dependerá da autenticação e dos serviços de análise.' },
  { question: 'A simulação mostra meu resultado real?', answer: 'As comparações atuais são demonstrações com imagens de referência. Elas não processam sua foto nem garantem um resultado. A decisão final continua sendo sua.' },
];

export function HelpPage() {
  return (
    <section className="help-page" aria-labelledby="help-title">
      <h1 id="help-title">Central de ajuda</h1>
      <p>Entenda cada etapa da sua consultoria.</p>
      <section id="perguntas" aria-labelledby="faq-title">
        <h2 id="faq-title">Dúvidas frequentes</h2>
        {questions.map(({ question, answer }) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>
      <ActionLink to={paths.catalogo}>Explorar catálogo</ActionLink>
    </section>
  );
}
```

Criar `src/pages/ajuda/help.css`:

```css
.help-page { width: min(100% - 40px, 920px); margin: 48px auto; }
.help-page h1 { font: 700 3rem/1.1 var(--heading-font); color: var(--petrol); }
.help-page h2 { font: 600 2rem/1.2 var(--heading-font); color: var(--petrol); margin-bottom: 16px; }
.help-page section { margin-block: 32px; scroll-margin-top: 24px; }
.help-page > p { margin-top: 16px; }
.help-page details { border: 1px solid var(--line); border-radius: 12px; background: var(--paper); margin-bottom: 12px; padding: 16px; }
.help-page summary { cursor: pointer; color: var(--petrol); font-weight: 700; min-height: 44px; align-content: center; }
.help-page details p { margin-top: 12px; font: 1rem/1.6 'Lato', sans-serif; }
```

Montagem em `src/app/App.tsx`, junto com Victor:

```tsx
import { HelpPage } from '../pages/ajuda/HelpPage';
// Substituir a Route existente de paths.ajuda, sem duplicá-la:
<Route path={paths.ajuda} element={<HelpPage />} />
```

Commit sugerido: `feat: cria as perguntas frequentes da consultoria`.

Conferir: `/ajuda` deixa de mostrar “em preparação”; cada `summary` abre e fecha por Enter/Espaço, recebe foco visível, mantém o texto legível em 360 px. Avisar Yasmin que `#perguntas` está disponível. Conferir links diretos após a integração da navegação por fragmentos.

## 5. Preparar a foto

Antes de `ActionLink` no `HelpPage.tsx`, incluir:

```tsx
<section id="preparar-foto" aria-labelledby="photo-help-title">
  <h2 id="photo-help-title">Prepare sua foto</h2>
  <ul className="photo-guidance">
    <li><strong>Iluminação:</strong> prefira luz uniforme de frente e evite sombras fortes no rosto.</li>
    <li><strong>Enquadramento:</strong> mantenha o rosto visível, de frente, sem cortes na cabeça e sem objetos cobrindo os traços.</li>
    <li><strong>Formato:</strong> o protótipo prevê JPG ou PNG. O limite de tamanho e a validação final serão confirmados com a API.</li>
    <li><strong>Envio:</strong> o upload ainda não está disponível. Quando for implementado, a tela indicará como corrigir arquivos inválidos.</li>
  </ul>
</section>
```

CSS adicional:

```css
.photo-guidance { display: grid; gap: 16px; list-style: disc; padding-left: 24px; font: 1rem/1.6 'Lato', sans-serif; }
.photo-guidance strong { color: var(--petrol); }
```

Commit sugerido: `feat: adiciona orientações para preparar a foto`.

Conferir: iluminação, enquadramento e formatos visíveis; nenhum limite de MB inventado, seletor de arquivo ou promessa de processamento. Alinhar os textos com Matheus L. quando ele implementar `src/pages/consultoria/foto/`. Verificar `/ajuda#preparar-foto` após integrar o tratamento de fragmentos.
