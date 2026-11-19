import { Link } from 'react-router';
import { paths } from '../../app/paths';
import { useSession } from '../../app/session';
import { ActionLink } from '../../components/ui/ActionLink';
import hairPortrait from '../../assets/figma/consultoria-cabelo.webp';
import makeupPortrait from '../../assets/figma/consultoria-maquiagem.webp';
import stylePortrait from '../../assets/figma/cabelo-MiniaturaDeEstilo3.jpg';
import './home.css';

const portraits = [
  [hairPortrait, 'Seu cabelo.'],
  [makeupPortrait, 'Sua beleza.'],
  [stylePortrait, 'Suas possibilidades.'],
];
const steps = [
  ['Conte sobre você', 'Entre, escolha sua consultoria e responda uma pergunta por tela.'],
  ['Compare possibilidades', 'Use exemplos e orientações para entender suas características e preferências.'],
  ['Escolha com confiança', 'Revise suas respostas e conheça recomendações com explicações claras.'],
];
const recommendations = [
  ['Cortes e finalização', 'Referências de comprimento, textura e manutenção para conversar com um profissional.'],
  ['Tons e acabamento', 'Possibilidades de maquiagem e cor, com orientação para comparar na sua pele.'],
  ['Produtos e rotina', 'Critérios de preço e características para ajudar na sua escolha.'],
];
const values = [
  ['Inclusão', 'Diferentes identidades, tons de pele e texturas de cabelo.'],
  ['Autonomia', 'Você decide o que quer experimentar e o que quer manter.'],
  ['Clareza', 'As perguntas têm orientações simples. A análise por foto é uma estimativa.'],
];
const faq = [
  ['Preciso saber tudo sobre cabelo e pele?', 'As perguntas trazem orientações e exemplos. Quando disponível, escolha “Não sei”.'],
  ['Preciso enviar uma foto?', 'A análise facial é opcional. Você também pode escolher o formato do rosto manualmente. A simulação de um visual na sua própria imagem exige uma foto.'],
  ['O resultado é uma regra?', 'Use as recomendações como referências para explorar. Para mudanças químicas e reações a cosméticos, procure um profissional.'],
];

export function HomePage() {
  const { state } = useSession();
  const signedIn = state.status === 'signed-in';
  const entry = signedIn ? paths.consultoria : paths.entrar;
  const routeState = signedIn ? undefined : { from: paths.consultoria };

  return <div className="landing-page">
    <section className="landing-hero" aria-labelledby="home-title">
      <div className="landing-hero__copy">
        <p className="landing-eyebrow">Consultoria de cabelo e maquiagem</p>
        <h1 id="home-title">Seu estilo,<br />suas regras.</h1>
        <p>Explore cortes, cores e maquiagem com recomendações que respeitam seus traços, sua rotina e o que faz sentido para você.</p>
        <div className="landing-hero__actions">
          <Link className="action-link action-link--primary" to={entry} state={routeState}>Começar consultoria</Link>
          {!signedIn && <Link className="action-link action-link--outline" to={paths.cadastro} state={routeState}>Criar minha conta</Link>}
        </div>
        <a className="landing-discover" href="#como-funciona">Conheça como funciona</a>
        {!signedIn && <small>Entre para começar. Ainda não tem conta? O cadastro está na próxima tela.</small>}
      </div>
      <figure>
        <div className="landing-portraits">
          {portraits.map(([src, label], index) => <div key={label}>
            <img src={src} alt="" fetchPriority={index === 0 ? 'high' : undefined} />
            <span>{label}</span>
          </div>)}
        </div>
        <figcaption>Retratos ilustrativos. A beleza tem muitos rostos, tons e texturas.</figcaption>
      </figure>
    </section>
    <section id="como-funciona" className="landing-section" aria-labelledby="landing-steps">
      <h2 id="landing-steps">Uma descoberta de cada vez.</h2>
      <ol className="landing-columns landing-steps">
        {steps.map(([title, description], index) => <li key={title}>
          <span aria-hidden="true">0{index + 1}</span><h3>{title}</h3><p>{description}</p>
        </li>)}
      </ol>
    </section>
    <section className="landing-editorial" aria-labelledby="landing-reason">
      <figure><img src={hairPortrait} alt="Retrato ilustrativo de uma pessoa com cabelo cacheado" loading="lazy" />
        <figcaption>Referência ilustrativa.</figcaption></figure>
      <div>
        <h2 id="landing-reason">Mais do que uma sugestão.<br />O porquê de cada escolha.</h2>
        {recommendations.map(([title, description]) => <div key={title}><h3>{title}</h3><p>{description}</p></div>)}
      </div>
    </section>
    <section className="landing-section" aria-labelledby="landing-values">
      <h2 id="landing-values">Beleza que conversa com você.</h2>
      <div className="landing-columns">{values.map(([title, description]) => <div key={title}><h3>{title}</h3><p>{description}</p></div>)}</div>
    </section>
    <section className="landing-section" aria-labelledby="landing-faq">
      <h2 id="landing-faq">Antes de começar</h2>
      <div className="landing-faq">{faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      <Link className="text-link" to={paths.faq}>Ver todas as perguntas frequentes</Link>
    </section>
    <section className="landing-banner" aria-labelledby="landing-banner-title">
      <h2 id="landing-banner-title">Pronto para descobrir novas possibilidades?</h2>
      {signedIn ? <ActionLink to={entry}>Começar consultoria</ActionLink> :
        <Link className="action-link action-link--primary" to={entry} state={routeState}>Começar consultoria</Link>}
    </section>
  </div>;
}
