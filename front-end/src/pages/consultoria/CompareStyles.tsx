import { useState } from 'react';
import { Columns3, X } from 'lucide-react';
import { Link } from 'react-router';
import { Modal, useToast } from '../../components/ui/Feedback';
import type { ConsultationArea } from '../../services/api/questionnaire';
import './experience.css';

export type ComparisonStyle = { id: string; name: string; image: string; details: Partial<Record<string, string>> };
export function addComparison(selected: string[], id: string) {
  if (selected.includes(id)) return selected.filter(value => value !== id);
  if (selected.length >= 3) throw new Error('Remova um dos 3 estilos para adicionar outro.');
  return [...selected, id];
}
export function CompareStyles({ items, area }: { items: ComparisonStyle[]; area: ConsultationArea }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const chosen = items.filter(item => selected.includes(item.id));
  const fields = [...new Set(chosen.flatMap(item => Object.keys(item.details)))];
  function toggle(id: string) {
    try { setSelected(addComparison(selected, id)); }
    catch { toast({ title: 'Limite atingido!', message: 'Remova um dos 3 estilos para adicionar outro.', action: { label: 'Ver comparação', run: () => setOpen(true) } }); }
  }
  return <section className="style-comparison" aria-label={`Comparar estilos de ${area}`}>
    <div className="experience-section-heading"><div><p className="experience-eyebrow"><Columns3 size={16} /> Compare possibilidades</p>
      <h2>Qual combina mais com você?</h2><p>Selecione até três estilos e veja os detalhes lado a lado.</p></div>
      <button type="button" className="action-link action-link--primary" disabled={!chosen.length} onClick={() => setOpen(true)}>Comparar ({chosen.length}/3)</button>
    </div>
    <div className="comparison-options">{items.map(item => <button type="button" key={item.id} className="comparison-option" aria-pressed={selected.includes(item.id)} onClick={() => toggle(item.id)}>
      <img src={item.image} alt="" loading="lazy" /><strong>{item.name}</strong><span>{selected.includes(item.id) ? 'Selecionado · remover' : 'Adicionar à comparação'}</span>
    </button>)}</div>
    {open && <Modal title="Compare seus estilos" wide onClose={() => setOpen(false)}>
      <p className="experience-eyebrow">{area === 'cabelo' ? 'Consultoria capilar' : 'Consultoria de maquiagem'} · {chosen.length} de 3</p>
      {chosen.length ? <div className="comparison-scroll" tabIndex={0} role="region" aria-label="Tabela de comparação; deslize horizontalmente em telas pequenas">
        <table className="comparison-table"><caption>Referências ilustrativas para comparar suas opções</caption>
          <thead><tr><th scope="col">Características</th>{chosen.map(item => <th scope="col" key={item.id}><img src={item.image} alt="" /><span>{item.name}</span></th>)}</tr></thead>
          <tbody>{fields.map(field => <tr key={field}><th scope="row">{field}</th>{chosen.map(item => <td key={item.id}>{item.details[field] || 'Não informado'}</td>)}</tr>)}</tbody>
          <tfoot><tr><th scope="row">Seleção</th>{chosen.map(item => <td key={item.id}><button type="button" className="text-link" onClick={() => toggle(item.id)} aria-label={`Remover ${item.name} da comparação`}><X size={14} /> Remover</button></td>)}</tr></tfoot>
        </table></div> : <p className="experience-empty">Nenhum estilo selecionado. Volte à galeria para escolher.</p>}
      <div className="modal-actions"><button type="button" className="action-link action-link--primary" onClick={() => setOpen(false)}>Voltar</button>
        <Link className="action-link action-link--outline" to={`/consultoria/${area}`} onClick={() => setOpen(false)}>Fazer consultoria</Link></div>
    </Modal>}
  </section>;
}
