import { ActionLink } from '../../components/ui/ActionLink';
import { paths } from '../../app/paths';
import './help.css';

const questions = [
  {
    question: 'Preciso enviar uma foto?',
    answer: 'A consultoria personalizada prevê o uso de uma foto com o rosto visível. O envio ainda está em preparação. Enquanto isso, você pode explorar referências de cabelo e maquiagem no catálogo.',
  },
  {
    question: 'Para que serve o questionário?',
    answer: 'Ele deverá reunir informações sobre seu estilo, rotina e preferências para orientar sugestões. Essa etapa ainda não está disponível nesta versão.',
  },
  {
    question: 'As recomendações já são personalizadas?',
    answer: 'Ainda não. As páginas atuais mostram referências do protótipo. A personalização dependerá de autenticação e dos serviços de análise que serão integrados posteriormente.',
  },
  {
    question: 'Como posso encontrar inspirações de cabelo e maquiagem?',
    answer: 'Use o catálogo para escolher cortes, maquiagens ou colorações. Você pode abrir os detalhes das referências disponíveis e comparar opções antes de decidir.',
  },
  {
    question: 'A simulação mostra meu resultado real?',
    answer: 'As comparações atuais são demonstrações com imagens de referência. Elas não processam sua foto nem garantem um resultado. A decisão final continua sendo sua.',
  },
];

export function HelpPage() {
  return (
    <section className="help-page" aria-labelledby="help-title">
      <h1 id="help-title">Central de ajuda</h1>
      <p>Entenda cada etapa da sua consultoria.</p>
      <nav className="help-page__nav" aria-label="Seções da central de ajuda">
        <a href="#perguntas">Dúvidas frequentes</a>
      </nav>
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
