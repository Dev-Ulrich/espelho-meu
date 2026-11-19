import { useState } from 'react';
import type { Journey, Recommendation } from '../../services/api/consultation';
import { PhotoSimulation } from './PhotoSimulation';
import { saveRecommendation } from './savedRecommendations';

export function RecommendationResults({ area, results }: { area: Journey; results: Recommendation[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  function save(result: Recommendation, favorite: boolean) {
    try {
      saveRecommendation(area, result, favorite);
      setFeedback(`${result.estilo} ${favorite ? 'adicionada às favoritas' : 'salva no histórico'} deste navegador.`);
    } catch {
      setFeedback('Não foi possível salvar neste navegador.');
    }
  }

  return <section className="recommendation-results" aria-label="Sugestões">
    <h3>Sugestões para você</h3>
    <ol>
      {results.map(result => <li className="notice" key={result.estilo}>
        <h4>{result.estilo}</h4>
        {result.justificativa && <p>{result.justificativa}</p>}
        {result.cuidados && <p>{result.cuidados}</p>}
        <div className="recommendation-actions">
          <button className="text-link" type="button" onClick={() => save(result, false)}>Salvar no histórico</button>
          <button className="text-link" type="button" onClick={() => save(result, true)}>Favoritar</button>
          <button className="text-link" type="button" aria-pressed={selected === result.estilo}
            onClick={() => setSelected(selected === result.estilo ? null : result.estilo)}>Simular na foto</button>
        </div>
      </li>)}
    </ol>
    <p role="status">{feedback}</p>
    {selected && <PhotoSimulation key={selected} area={area} style={selected} />}
  </section>;
}
