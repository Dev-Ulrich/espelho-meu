import { useEffect, useState } from 'react';
import { Columns3, X } from 'lucide-react';
import { Link } from 'react-router';
import { Modal, useToast } from '../../components/ui/Feedback';
import type { ConsultationArea } from '../../services/api/questionnaire';
import { CardPreview, PhotoSimulation, useSimulationProgress } from './PhotoSimulation';
import { HaircutReference } from './HaircutReference';
import './experience.css';

export type ComparisonStyle = { id: string; name: string; image?: string; referenceCut?: boolean; details: Partial<Record<string, string>> };
export function addComparison(selected: string[], id: string) {
  if (selected.includes(id)) return selected.filter(value => value !== id);
  if (selected.length >= 3) throw new Error('Remova um dos 3 estilos para adicionar outro.');
  return [...selected, id];
}
export function CompareStyles({ items, area, resultId, photo }: { items: ComparisonStyle[]; area: ConsultationArea; resultId?: string; photo?: File }) {
  const limit = Math.min(3, items.length);
  const storageKey = resultId && `espelho-meu:comparacao:${resultId}`;
  const endpoint = resultId && `/consultoria/${area}/resultados/${encodeURIComponent(resultId)}/simulacoes`;
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
  const [dialog, setDialog] = useState<'comparison' | ComparisonStyle>();
  const [showSimulation, setShowSimulation] = useState(false);
  const { progress, error, apply } = useSimulationProgress(dialog ? endpoint : undefined);
  const previewStates = new Map(progress?.cards.map(card => [card.cardId, card.state]));
  const toast = useToast();
  const colors = items.filter(item => item.details.Tipo === 'Coloração');
  const comparison = dialog === 'comparison';
  const selectedItems = items.filter(item => selected.includes(item.id));
  const chosen = dialog && !comparison ? [dialog] : selectedItems;
  const fields = [...new Set(chosen.flatMap(item => Object.keys(item.details)))];
  function close() {
    setDialog(undefined);
    setShowSimulation(false);
  }

  function toggle(id: string) {
    try { setSelected(addComparison(selected, id)); }
    catch { toast({ title: 'Limite atingido!', message: 'Remova um dos 3 estilos para adicionar outro.', action: { label: 'Ver comparação', run: () => setDialog('comparison') } }); }
  }
  return <section className="style-comparison" aria-label={`Comparar estilos de ${area}`}>
    <div className="experience-section-heading"><div><p className="experience-eyebrow"><Columns3 size={16} /> Compare estilos na pós consultoria</p>
      <h2>Qual combina mais com você?</h2><p>Selecione até três estilos e veja os detalhes lado a lado.</p></div>
      <button type="button" className="action-link action-link--primary" disabled={!selectedItems.length} onClick={() => setDialog('comparison')}>Comparar ({selectedItems.length}/{limit})</button>
    </div>
    {endpoint && colors.length > 0 && <section className="comparison-colors" aria-labelledby="opcoes-coloracao">
      <h3 id="opcoes-coloracao" tabIndex={-1}>Simular uma coloração</h3>
      <div className="comparison-color-actions">{colors.map(color => <button type="button" key={color.id}
        className="action-link action-link--outline" onClick={() => setDialog(color)}>
        Simular {color.name}
      </button>)}</div>
    </section>}
    <div className="comparison-options">{items.map(item => <button type="button" key={item.id} className="comparison-option" aria-pressed={selected.includes(item.id)} onClick={() => toggle(item.id)}>
      {item.referenceCut ? <HaircutReference id={item.id} name={item.name} thumbnail />
        : item.image && <img src={item.image} alt="" loading="lazy" />}
      <span>{item.details.Tipo}</span><strong>{item.name}</strong><span>{selected.includes(item.id) ? 'Selecionado · remover' : 'Adicionar à comparação'}</span>
    </button>)}</div>
    {dialog && <Modal title={comparison ? 'Compare seus estilos' : dialog.name} wide={comparison} onClose={close}>
      {comparison && <p className="experience-eyebrow">{area === 'cabelo' ? 'Consultoria capilar' : 'Consultoria de maquiagem'} · {chosen.length} de {limit}</p>}
      {endpoint && <div className="comparison-simulation">
        {progress && <p>Prévias usadas ou reservadas nesta consulta · {progress.used}/{progress.limit}</p>}
        {error && <p role="alert">{error}</p>}
        {(showSimulation || !comparison) && chosen.length ? <PhotoSimulation endpoint={endpoint} selected={chosen.map(item => item.id)}
          progress={progress} onAccepted={apply} initialPhoto={photo} />
          : <button type="button" className="action-link action-link--primary" disabled={!chosen.length}
              onClick={() => setShowSimulation(true)}>Simular na minha foto</button>}
      </div>}
      {!comparison && endpoint && <div className="comparison-color-preview">
        <p>{dialog.details['Técnica']}</p>
        {progress && <CardPreview endpoint={endpoint} id={dialog.id} name={dialog.name} state={previewStates.get(dialog.id)} />}
      </div>}
      {comparison && (chosen.length ? <div className="comparison-scroll" tabIndex={0} role="region" aria-label="Tabela de comparação; deslize horizontalmente em telas pequenas">
        <table className="comparison-table"><caption>Compare as referências e as simulações de cada opção</caption>
          <thead><tr><th scope="col">Características</th>{chosen.map(item => <th scope="col" key={item.id}>
            <span>{item.name}</span>
            {item.referenceCut ? <HaircutReference id={item.id} name={item.name} />
              : item.image && <img src={item.image} alt="" />}
          </th>)}</tr></thead>
          <tbody>{endpoint && (showSimulation || chosen.some(item => previewStates.has(item.id))) && <tr>
            <th scope="row">Na minha foto</th>{chosen.map(item => <td key={item.id}>
              <CardPreview endpoint={endpoint} id={item.id} name={item.name} state={previewStates.get(item.id)} />
            </td>)}
          </tr>}{fields.map(field => <tr key={field}><th scope="row">{field}</th>{chosen.map(item => <td key={item.id}>{item.details[field] || 'Não informado'}</td>)}</tr>)}</tbody>
          <tfoot><tr><th scope="row">Seleção</th>{chosen.map(item => <td key={item.id}><button type="button" className="text-link" onClick={() => toggle(item.id)} aria-label={`Remover ${item.name} da comparação`}><X size={14} /> Remover</button></td>)}</tr></tfoot>
        </table></div> : <p className="experience-empty">Nenhum estilo selecionado. Volte à galeria para escolher.</p>)}
      <div className="modal-actions"><button type="button" className="action-link action-link--primary" onClick={close}>Voltar</button>
        {comparison && <Link className="action-link action-link--outline" to={`/consultoria/${area}`} onClick={close}>Fazer consultoria</Link>}</div>
    </Modal>}
  </section>;
}
