import { ActionLink } from '../../components/ui/ActionLink';
import { paths } from '../../app/paths';
import './help.css';

const questions = [
  {
    question: 'Preciso enviar uma foto?',
    answer: 'Você pode usar os questionários de cabelo e maquiagem sem foto. Uma foto só é necessária para simular uma sugestão sobre a sua imagem.',
  },
  {
    question: 'Para que serve o questionário?',
    answer: 'Ele usa suas respostas para orientar sugestões. Cabelo considera textura, comprimento e manutenção. Maquiagem considera tipo de pele, ocasião e acabamento.',
  },
  {
    question: 'As recomendações já são personalizadas?',
    answer: 'As sugestões dos questionários usam o perfil informado. Os modelos foram treinados com perfis sintéticos e a adequação das sugestões ainda precisa ser validada com pessoas reais.',
  },
  {
    question: 'Como posso encontrar inspirações de cabelo e maquiagem?',
    answer: 'Use o catálogo para escolher cortes, maquiagens ou colorações. Você pode abrir os detalhes das referências disponíveis e comparar opções antes de decidir.',
  },
  {
    question: 'A simulação mostra meu resultado real?',
    answer: 'A simulação é uma aproximação visual. As comparações do catálogo usam imagens ilustrativas de referência.',
  },
];

export function HelpPage({ faq = false }: { faq?: boolean }) {
  return (
    <section className="help-page" aria-labelledby="help-title">
      <h1 id="help-title">{faq ? 'Perguntas frequentes' : 'Central de ajuda'}</h1>
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
          <li><strong>Formatos:</strong> a simulação aceita JPG, PNG ou WebP de até 5 MB.</li>
          <li><strong>Envio:</strong> a consultoria informa quando a edição de fotos está disponível.</li>
        </ul>
        <a className="help-page__back-link" href="#perguntas">Voltar às dúvidas frequentes</a>
      </section>
      <ActionLink to={paths.catalogo}>Explorar catálogo</ActionLink>
    </section>
  );
}
