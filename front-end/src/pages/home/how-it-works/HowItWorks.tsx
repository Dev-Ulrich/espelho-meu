import { Camera } from 'lucide-react';
import listIcon from '../../../assets/figma/home-IconeList.svg';
import sparklesIcon from '../../../assets/figma/home-IconeSparkles1.svg';
import eyeIcon from '../../../assets/figma/home-IconeEye.svg';
import arrowIcon from '../../../assets/figma/home-IconeArrow.svg';
import './how-it-works.css';

const steps = [
  { title: 'Envie sua foto', description: 'Use uma foto atual, com boa iluminação.' },
  { title: 'Responda o questionário', description: 'Conte sobre seu estilo, rotina e preferências.' },
  { title: 'Receba recomendações', description: 'Veja sugestões personalizadas de cortes, cores e maquiagens.' },
  { title: 'Teste visuais', description: 'Simule os resultados e experimente novos looks antes de decidir.' },
];

const icons = [null, listIcon, sparklesIcon, eyeIcon];

export function HowItWorks() {
  return (
    <section className="how-it-works" aria-labelledby="how-title">
      <h2 id="how-title">Como funciona</h2>
      <p>Uma experiência simples, inteligente e personalizada.</p>
      <ol className="how-it-works__steps">
        {steps.map((step, index) => (
          <li key={step.title}>
            <span className="how-it-works__number" aria-hidden="true">{index + 1}</span>
            <span className="how-it-works__icon" aria-hidden="true">
              {index === 0
                ? <Camera size={36} />
                : <img src={icons[index] ?? undefined} alt="" />}
            </span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            {index < steps.length - 1 && (
              <img className="how-it-works__arrow" src={arrowIcon} alt="" />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
