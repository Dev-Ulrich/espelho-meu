import sparkles from '../../../assets/figma/home-IconeSparkles3.svg';
import users from '../../../assets/figma/home-IconeUsers.svg';
import bolt from '../../../assets/figma/home-IconeBolt.svg';
import heart from '../../../assets/figma/home-IconeHeart.svg';
import './benefits.css';

const benefits = [
  { title: 'Personalização', description: 'Recomendações sob medida para o seu estilo, traços e objetivos.', icon: sparkles },
  { title: 'Inclusão', description: 'Beleza para todas as identidades, gêneros, tipos de cabelo e tons de pele.', icon: users },
  { title: 'Praticidade', description: 'Descubra, simule e compare looks de forma rápida e intuitiva.', icon: bolt },
  { title: 'Autonomia', description: 'Inspiração e recomendações para você escolher o que te faz bem.', icon: heart },
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