import { useEffect, useState } from 'react';
import { Columns3, X } from 'lucide-react';
import { Link } from 'react-router';
import { Modal, useToast } from '../../components/ui/Feedback';
import type { ConsultationArea } from '../../services/api/questionnaire';
import { CardPreview, PhotoSimulation, useSimulationProgress } from './PhotoSimulation';
import './experience.css';

export type ComparisonStyle = { id: string; name: string; image: string; details: Partial<Record<string, string>> };
export function addComparison(selected: string[], id: string) {
  if (selected.includes(id)) return selected.filter(value => value !== id);
  if (selected.length >= 3) throw new Error('Remova um dos 3 estilos para adicionar outro.');
  return [...selected, id];
}
export function CompareStyles({ items, area, resultId }: { items: ComparisonStyle[]; area: ConsultationArea; resultId?: string }) {
  const limit = Math.min(3, items.length);
  const storageKey = resultId && `espelho-meu:comparacao:${resultId}`;
  const endpoint = resultId && `/consultoria/${area}/resultados/${resultId}/simulacoes`;
  const [selected, setSelected] = useState<string[]>(() => {
    if (!storageKey) return [];
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]');
      if (Array.isArray(saved)) return [...new Set(saved.filter(id => items.some(item => item.id === id)))].slice(0, 3);
    } catch { /* Selection still works without browser storage. */ }
    return [];
  });
  useEffect(() => {
    if (!storageKey) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(selected)); }
    catch { /* The server still retains the previews and quota. */ }
  }, [storageKey, selected]);
  const [open, setOpen] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const { progress, error, apply } = useSimulationProgress(open && endpoint ? endpoint : undefined);
  const previewStates = new Map(progress?.cards.map(card => [card.cardId, card.state]));
  const toast = useToast();
  const chosen = items.filter(item => selected.includes(item.id));
  const fields = [...new Set(chosen.flatMap(item => Object.keys(item.details)))];
  function toggle(id: string) {
    try { setSelected(addComparison(selected, id)); }
    catch { toast({ title: 'Limite atingido!', message: 'Remova um dos 3 estilos para adicionar outro.', action: { label: 'Ver comparação', run: () => setOpen(true) } }); }
  }
  return <section className="style-comparison" aria-label={`Comparar estilos de ${area}`}>
    <div className="experience-section-heading">    <div><p className="experience-eyebrow"><Columns3 size={16} /> Compare estilos na pós consultoria</p>
      <h2>Qual combina mais com você?</h2><p>Selecione até três estilos e veja os detalhes lado a lado.</p></div>
      <button type="button" className="action-link action-link--primary" disabled={!chosen.length} onClick={() => setOpen(true)}>Comparar ({chosen.length}/{limit})</button>
    </div>
    <div className="comparison-options">{items.map(item => <button type="button" key={item.id} className="comparison-option" aria-pressed={selected.includes(item.id)} onClick={() => toggle(item.id)}>
      <img src={item.image} alt="" loading="lazy" /><strong>{item.name}</strong><span>{selected.includes(item.id) ? 'Selecionado · remover' : 'Adicionar à comparação'}</span>
    </button>)}</div>
    {open && <Modal title="Compare seus estilos" wide onClose={() => setOpen(false)}>
      <p className="experience-eyebrow">{area === 'cabelo' ? 'Consultoria capilar' : 'Consultoria de maquiagem'} · {chosen.length} de {limit}</p>
      {open && endpoint && <div className="comparison-simulation">
        {progress && <p>Prévias usadas ou reservadas nesta consulta · {progress.used}/{progress.limit}</p>}
        {error && <p role="alert">{error}</p>}
        {showSimulation && chosen.length ? <PhotoSimulation endpoint={endpoint} selected={selected}
          progress={progress} onAccepted={apply} />
          : <button type="button" className="action-link action-link--primary" disabled={!chosen.length}
              onClick={() => setShowSimulation(true)}>Simular na minha foto</button>}
      </div>}
      {chosen.length ? <div className="comparison-scroll" tabIndex={0} role="region" aria-label="Tabela de comparação; deslize horizontalmente em telas pequenas">
        <table className="comparison-table"><caption>Referências ilustrativas para comparar suas opções</caption>
          <thead><tr><th scope="col">Características</th>{chosen.map(item => <th scope="col" key={item.id}><img src={item.image} alt="" /><span>{item.name}</span></th>)}</tr></thead>
          <tbody>{endpoint && (showSimulation || chosen.some(item => previewStates.has(item.id))) && <tr>
            <th scope="row">Na minha foto</th>{chosen.map(item => <td key={item.id}>
              <CardPreview endpoint={endpoint} id={item.id} name={item.name} state={previewStates.get(item.id)} />
            </td>)}
          </tr>}{fields.map(field => <tr key={field}><th scope="row">{field}</th>{chosen.map(item => <td key={item.id}>{item.details[field] || 'Não informado'}</td>)}</tr>)}</tbody>
          <tfoot><tr><th scope="row">Seleção</th>{chosen.map(item => <td key={item.id}><button type="button" className="text-link" onClick={() => toggle(item.id)} aria-label={`Remover ${item.name} da comparação`}><X size={14} /> Remover</button></td>)}</tr></tfoot>
        </table></div> : <p className="experience-empty">Nenhum estilo selecionado. Volte à galeria para escolher.</p>}
      <div className="modal-actions"><button type="button" className="action-link action-link--primary" onClick={() => setOpen(false)}>Voltar</button>
        <Link className="action-link action-link--outline" to={`/consultoria/${area}`} onClick={() => setOpen(false)}>Fazer consultoria</Link></div>
    </Modal>}
  </section>;
}
