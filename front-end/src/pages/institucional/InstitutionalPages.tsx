import { Link, useParams } from 'react-router';
import { paths } from '../../app/paths';
import { ActionLink } from '../../components/ui/ActionLink';
import { ConsultationLinks } from '../home/HomePage';
import { editorialPhotos } from '../home/editorialContent';
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
  return <div className="editorial-page">
    <section className="editorial-feature" aria-labelledby="about-title">
      <div className="editorial-container editorial-feature__grid">
        <div>
          <p className="editorial-kicker">Sobre o Espelho Meu</p>
          <h1 id="about-title">Mais escolhas para o seu visual.</h1>
          <p>Escolher um corte ou um acabamento fica mais fácil quando você consegue comparar referências e entender como cada opção se encaixa na sua rotina.</p>
        </div>
        <img src={editorialPhotos.coils} alt="Retrato de uma pessoa com cabelo crespo natural" fetchPriority="high" />
      </div>
    </section>
    <section className="editorial-container editorial-section editorial-about">
      <div>
        <h2>O que a consultoria considera</h2>
        <p>Em <Link className="text-link" to={paths.cabelo}>Cabelo</Link>, suas respostas sobre curvatura, preferências e manutenção orientam as opções de cortes, penteados e cores.</p>
        <p>Em <Link className="text-link" to={paths.maquiagem}>Maquiagem</Link>, você compara opções a partir do seu tipo de pele, da ocasião e do acabamento que prefere.</p>
        <p>A foto é opcional para receber recomendações. Se quiser testar uma sugestão na sua própria imagem, acesse a simulação pelo resultado da consultoria.</p>
      </div>
      <img src={editorialPhotos.waves} alt="Retrato com cabelo ondulado, franja e camadas" loading="lazy" />
    </section>
    <section className="editorial-invite">
      <div className="editorial-container">
        <h2>Um projeto da FIAP</h2>
        <p>O Espelho Meu foi desenvolvido pela turma 1TDSPW de ADS para a Global Solution 2026/2, com o tema CitizenTech.</p>
        <Link className="editorial-text-link" to={paths.integrantes}>Conheça a equipe</Link>
        <ConsultationLinks />
      </div>
    </section>
  </div>;
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
