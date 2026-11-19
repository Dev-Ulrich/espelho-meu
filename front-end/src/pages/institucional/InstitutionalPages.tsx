import { Link, useParams } from 'react-router';
import { paths } from '../../app/paths';
import { ActionLink } from '../../components/ui/ActionLink';
import { StarterPage } from '../initial/StarterPage';
import '../ajuda/help.css';
import './institutional.css';

const project = 'https://github.com/Dev-Ulrich/espelho-meu';
const team = [
  { id: 'victor', name: 'Victor Ulrich', contribution: 'Coordenação técnica e integração do front-end.' },
  { id: 'matheus-p', name: 'Matheus P.', contribution: 'API Java e integração HTTP do front-end.' },
  { id: 'matheus-l', name: 'Matheus L.', contribution: 'Aplicação Python, seleção de foto e vitrine de demonstração.' },
  { id: 'arthur', name: 'Arthur', contribution: 'Central de ajuda e explicação da jornada na homepage.' },
  { id: 'yasmin', name: 'Yasmin', contribution: 'Benefícios, chamada para a consultoria e rodapé.' },
];

export function AboutPage() {
  return <section className="help-page institutional-page" aria-labelledby="about-title">
    <h1 id="about-title">Sobre o Espelho Meu</h1>
    <p>O Espelho Meu ajuda pessoas a explorar opções de cabelo e maquiagem antes de mudar o visual. É um projeto da turma 1TDSPW de ADS da FIAP para a Global Solution 2026/2, com o tema CitizenTech.</p>
    <section>
      <h2>Cabelo e maquiagem</h2>
      <p>Explore as referências do catálogo ou responda a um questionário para receber sugestões considerando suas preferências e sua rotina.</p>
    </section>
    <ActionLink to={paths.consultoria}>Começar consultoria</ActionLink>
  </section>;
}

export function TeamPage() {
  return <section className="help-page institutional-page" aria-labelledby="team-title">
    <h1 id="team-title">Integrantes</h1>
    <p>Equipe do Espelho Meu na Global Solution da FIAP.</p>
    <ul className="institutional-team">
      {team.map(member => <li key={member.id}>
        <Link className="text-link" to={`${paths.integrantes}/${member.id}`}>{member.name}</Link>
        <p>{member.contribution}</p>
      </li>)}
    </ul>
  </section>;
}

export function MemberPage() {
  const { id } = useParams();
  const member = team.find(person => person.id === id);
  if (!member) return <StarterPage title="Integrante não encontrado" />;
  return <section className="help-page institutional-page" aria-labelledby="member-title">
    <h1 id="member-title">{member.name}</h1>
    <p>{member.contribution}</p>
    <ActionLink to={paths.integrantes} variant="outline">Ver todos os integrantes</ActionLink>
  </section>;
}

export function ContactPage() {
  return <section className="help-page institutional-page" aria-labelledby="contact-title">
    <h1 id="contact-title">Contato</h1>
    <p>Use o GitHub do projeto para relatar problemas técnicos ou enviar sugestões sobre a plataforma.</p>
    <a className="action-link action-link--primary" href={`${project}/issues`}>Acessar o GitHub do projeto</a>
    <section><h2>Precisa de ajuda com a consultoria?</h2><ActionLink to={paths.faq} variant="outline">Consultar perguntas frequentes</ActionLink></section>
  </section>;
}
