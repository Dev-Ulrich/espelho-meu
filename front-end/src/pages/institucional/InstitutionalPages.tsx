import { Link, useParams } from 'react-router';
import { paths } from '../../app/paths';
import { ActionLink } from '../../components/ui/ActionLink';
import { ConsultationLinks } from '../home/HomePage';
import { editorialPhotos } from '../home/editorialContent';
import { StarterPage } from '../initial/StarterPage';
import '../ajuda/help.css';
import './institutional.css';

const project = 'https://github.com/Dev-Ulrich/espelho-meu';
import photo0 from '../../assets/team/Victor-Ulrich.png';
import photo1 from '../../assets/team/Matheus-Pereira.jpeg';
import photo2 from '../../assets/team/Matheus-Luca.png';
import photo3 from '../../assets/team/Arthur-da-Silva.jpg';
import photo4 from '../../assets/team/Yasmin-Capi.jpeg';

const team = [
  {"id": "victor", "name": "Victor Ulrich Costa Alves da Silva", "rm": "568634", "className": "1TDSPW", "contribution": "Desenvolvimento (Front-end e Chatbot), banco de dados e documentação.", "github": "https://github.com/Dev-Ulrich", "linkedin": "https://www.linkedin.com/in/victorulrichcosta/", "photo": photo0},
  {"id": "matheus-p", "name": "Matheus Pereira da Silva Franco", "rm": "569315", "className": "1TDSPW", "contribution": "Desenvolvimento (Java e Front-end), banco de dados e documentação.", "github": "https://github.com/MatheusPSFranco", "linkedin": "https://www.linkedin.com/in/matheus-pereira-da-silva-franco-b7a7b03b7/", "photo": photo1},
  {"id": "matheus-l", "name": "Matheus Luca Fouad Barragão", "rm": "572228", "className": "1TDSPW", "contribution": "Desenvolvimento (Python e Front-end) e documentação.", "github": "https://github.com/MatheusLuca", "linkedin": "https://www.linkedin.com/in/matheusbarragao/", "photo": photo2},
  {"id": "arthur", "name": "Arthur da Silva Santana", "rm": "571075", "className": "1TDSPW", "contribution": "Desenvolvimento (Front-end), edição e roteirização.", "github": "https://github.com/arthursantana1521", "linkedin": "https://www.linkedin.com/in/arthur-da-silva-santana-a6061a310", "photo": photo3},
  {"id": "yasmin", "name": "Yasmin Capi", "rm": "571926", "className": "1TDSPW", "contribution": "Desenvolvimento (Front-end), prototipação, edição e roteirização.", "github": "https://github.com/yasmincappi", "linkedin": "https://www.linkedin.com/in/yasmincappi/", "photo": photo4}
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
    <section className="editorial-container editorial-section project-pitch" aria-labelledby="pitch-title">
      <div><p className="editorial-kicker">A ideia por trás do espelho</p>
        <h2 id="pitch-title">Conheça o projeto em quatro minutos.</h2>
        <p>Assista ao nosso vídeo pitch e descubra a proposta do Espelho Meu, a experiência de consultoria e o trabalho da equipe.</p>
      </div>
      <figure><video controls playsInline preload="none" poster={editorialPhotos.cover} aria-label="Vídeo pitch do projeto Espelho Meu">
        <source src="/media/espelho-meu-pitch.mp4" type="video/mp4" />
        Seu navegador não suporta este vídeo. <a href="/media/espelho-meu-pitch.mp4">Abrir o vídeo pitch</a>
      </video><figcaption>Espelho Meu · Vídeo pitch completo · 4 min</figcaption></figure>
    </section>
    <section className="editorial-invite editorial-invite--rose">
      <div className="editorial-container">
        <h2>Um projeto da FIAP</h2>
        <p>O Espelho Meu foi desenvolvido pela turma 1TDSPW de ADS para a Global Solution 2026/2, com o tema CitizenTech.</p>
        <Link className="editorial-text-link" to={paths.integrantes}>Conheça a equipe</Link>
        <ConsultationLinks />
      </div>
    </section>
  </div>;
}

function MemberInfo({ member }: { member: typeof team[number] }) {
  return <div className="member-info">
    <p><strong>RM:</strong> {member.rm} · <strong>Turma:</strong> {member.className}</p>
    <p>{member.contribution}</p>
    <div className="member-links">
      <a href={member.github} aria-label={`GitHub de ${member.name}`} target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href={member.linkedin} aria-label={`LinkedIn de ${member.name}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
    </div>
  </div>;
}

export function TeamPage() {
  return <section className="help-page institutional-page" aria-labelledby="team-title">
    <h1 id="team-title">Integrantes</h1>
    <p>Equipe do Espelho Meu na Global Solution da FIAP.</p>
    <ul className="institutional-team">
      {team.map(member => <li key={member.id}>
        <img className="member-photo" src={member.photo} alt={`Foto de ${member.name}`} width={240} height={240} loading="lazy" />
        <h2><Link className="text-link" to={`${paths.integrantes}/${member.id}`}>{member.name}</Link></h2>
        <MemberInfo member={member} />
      </li>)}
    </ul>
  </section>;
}

export function MemberPage() {
  const { id } = useParams();
  const member = team.find(person => person.id === id);
  if (!member) return <StarterPage title="Integrante não encontrado" />;
  return <section className="help-page institutional-page" aria-labelledby="member-title">
    <img className="member-photo member-photo--detail" src={member.photo} alt={`Foto de ${member.name}`} width={240} height={240} />
    <h1 id="member-title">{member.name}</h1>
    <MemberInfo member={member} />
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
