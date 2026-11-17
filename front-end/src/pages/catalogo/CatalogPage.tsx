import { paths } from '../../app/paths';
import { ActionLink } from '../../components/ui/ActionLink';
import './catalog.css';

export function CatalogPage() {
  return <section className="catalog-page" aria-labelledby="catalog-title">
    <h1 id="catalog-title">Explore o catálogo</h1><p>Encontre sua próxima inspiração.</p>
    <div className="catalog-grid">
      <article><h2>Cortes</h2><p>Explore texturas, comprimentos e possibilidades para seu cabelo.</p><ActionLink to={`${paths.cabelo}?categoria=cortes`}>Explorar cortes</ActionLink></article>
      <article><h2>Colorações</h2><p>As referências de colorações estão em preparação.</p><ActionLink to={`${paths.cabelo}?categoria=coloracoes`} variant="outline">Ver categoria de colorações</ActionLink></article>
      <article><h2>Maquiagem</h2><p>Inspirações para pele, olhos e lábios.</p><ActionLink to={`${paths.maquiagem}?categoria=Todos`}>Explorar maquiagem</ActionLink></article>
    </div>
  </section>;
}
