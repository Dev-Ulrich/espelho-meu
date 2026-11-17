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
        {steps.map((step) => (
          <li key={step.title}>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
