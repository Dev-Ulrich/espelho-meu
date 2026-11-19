import { ActionLink } from '../../components/ui/ActionLink';
import styles from '../authenticated/workspace.module.css';

export function ConsultationStartPage() {
  return <section className={styles.page}>
    <h1 className={styles.title}>Escolha sua consultoria</h1>
    <div className={styles.grid}>
      <section className={styles.item}>
        <h2>Cabelo</h2>
        <p>Receba sugestões de cortes, penteados e cuidados para o seu perfil capilar.</p>
        <ActionLink to="/consultoria/cabelo/perfil">Começar cabelo</ActionLink>
      </section>
      <section className={styles.item}>
        <h2>Maquiagem</h2>
        <p>Compare acabamentos e produtos para seu tipo de pele, ocasião e orçamento.</p>
        <ActionLink to="/consultoria/maquiagem/perfil">Começar maquiagem</ActionLink>
      </section>
    </div>
  </section>;
}
