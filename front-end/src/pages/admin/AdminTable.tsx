import type { ReactNode } from 'react';
import styles from '../authenticated/workspace.module.css';

export type Column<Row> = { label: string; cell: (row: Row) => ReactNode; heading?: boolean };

export function AdminTable<Row extends { id: string | number }>({
  label, columns, rows,
}: { label: string; columns: readonly Column<Row>[]; rows: readonly Row[] }) {
  return <div className={styles.tableScroll} role="region" aria-label={label} tabIndex={0}>
    <table className={styles.adminTable}>
      <thead><tr>{columns.map(column => <th key={column.label} scope="col">{column.label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.id}>
        {columns.map(column => column.heading
          ? <th key={column.label} scope="row">{column.cell(row)}</th>
          : <td key={column.label}>{column.cell(row)}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}
