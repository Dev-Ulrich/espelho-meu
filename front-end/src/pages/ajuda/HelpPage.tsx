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
        <a href="#preparar-foto">Prepare sua foto</a>
      </nav>
      <section id="perguntas" aria-labelledby="faq-title">
        <h2 id="faq-title">Dúvidas frequentes</h2>
        {questions.map(({ question, answer }) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
        <a className="help-page__back-link" href="#preparar-foto">Ver orientações para preparar a foto</a>
      </section>
      <section id="preparar-foto" aria-labelledby="photo-help-title">
        <h2 id="photo-help-title">Prepare sua foto</h2>
        <ul className="photo-guidance">
          <li><strong>Iluminação:</strong> prefira luz uniforme de frente e evite sombras fortes no rosto.</li>
          <li><strong>Enquadramento:</strong> mantenha o rosto visível e de frente, sem cortes na cabeça.</li>
          <li><strong>Posicionamento:</strong> centralize o rosto e mantenha uma distância que permita visualizar o cabelo e os traços claramente.</li>
          <li><strong>Obstruções:</strong> evite acessórios ou objetos que escondam olhos, boca, cabelo ou contorno do rosto.</li>
          <li><strong>Formatos:</strong> o protótipo prevê imagens em JPG ou PNG. Validações de tamanho e envio serão definidas quando a API estiver disponível.</li>
          <li><strong>Envio:</strong> o upload ainda não está disponível nesta versão.</li>
        </ul>
        <a className="help-page__back-link" href="#perguntas">Voltar às dúvidas frequentes</a>
      </section>
      <ActionLink to={paths.catalogo}>Explorar catálogo</ActionLink>
    </section>
  );
}
