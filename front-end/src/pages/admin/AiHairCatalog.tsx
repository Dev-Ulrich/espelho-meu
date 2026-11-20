import { useState } from 'react';
import { HaircutReference } from '../consultoria/HaircutReference';
import styles from '../authenticated/workspace.module.css';
import { AdminTable, type Column } from './AdminTable';
import { aiHairCatalog } from './hairCatalog';

const pageSize = 12;
const lengths: Record<string, string> = {
  curtissimo: 'Curtíssimo', curto: 'Curto', medio: 'Médio', longo: 'Longo', extra_longo: 'Extra longo', extralongo: 'Extra longo',
};
const presentationLabels: Record<string, string> = { masculino: 'Masculino', feminino: 'Feminino' };
const normalize = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR');

type Cut = (typeof aiHairCatalog)[number];
const columns: Column<Cut>[] = [
  { label: 'ID', cell: cut => cut.id },
  { label: 'Foto', cell: cut => <div className={styles.catalogPhoto}><HaircutReference id={cut.id} name={cut.name} /></div> },
  { label: 'Nome', cell: cut => cut.name, heading: true },
  { label: 'Apresentação e comprimento', cell: cut => cut.presentations.map(id => {
    const length = id === 'masculino' ? cut.maleLength : cut.femaleLength;
    return lengths[length] ? presentationLabels[id] + ' · ' + lengths[length] : presentationLabels[id];
  }).join(' / ') },
  { label: 'Texturas', cell: cut => cut.textures.join(', ') },
  { label: 'Como pedir', cell: cut => cut.instructions },
];

export function AiHairCatalog() {
  const [search, setSearch] = useState('');
  const [presentation, setPresentation] = useState('');
  const [page, setPage] = useState(1);
  const term = normalize(search.trim());
  const visible = aiHairCatalog.filter(cut =>
    (!presentation || cut.presentations.includes(presentation))
    && normalize([cut.name, cut.id, ...cut.textures].join(' ')).includes(term));
  const pages = Math.ceil(visible.length / pageSize);

  return <section aria-labelledby="ai-cuts-title">
    <h2 id="ai-cuts-title" className={styles.overviewTitle}>Catálogo da IA</h2>
    <p>Estes são os cortes que a IA considera nas recomendações. O catálogo está disponível para consulta.</p>
    <div className={styles.adminToolbar}>
      <label className={styles.field}>Buscar por nome, ID ou textura
        <input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
      </label>
      <label className={styles.field}>Apresentação
        <select value={presentation} onChange={event => { setPresentation(event.target.value); setPage(1); }}>
          <option value="">Todas</option>
          {Object.entries(presentationLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
    </div>
    <p className={styles.adminCount} role="status">{visible.length} de {aiHairCatalog.length} cortes</p>
    {visible.length ? <AdminTable label="Cortes usados nas recomendações" columns={columns}
      rows={visible.slice((page - 1) * pageSize, page * pageSize)} /> : <p>Nenhum corte encontrado.</p>}
    {pages > 1 && <nav className={styles.actions} aria-label="Páginas do catálogo da IA">
      <button type="button" className={styles.link} disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button>
      <span>Página {page} de {pages}</span>
      <button type="button" className={styles.link} disabled={page === pages} onClick={() => setPage(page + 1)}>Próxima</button>
    </nav>}
  </section>;
}
