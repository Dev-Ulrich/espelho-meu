import source from '../../../../ia-chatbot/dados/catalogo_cortes.csv?raw';

function readCsv(source: string) {
  const csv = source.replace(/^\uFEFF/, '').trimEnd() + '\n';
  const field = /(?:"((?:[^"]|"")*)"|([^",\r\n]*))(,|\r\n|\r|\n)/gy;
  const rows: string[][] = [];
  let row: string[] = [];
  while (field.lastIndex < csv.length) {
    const match = field.exec(csv);
    if (!match) throw new Error('CSV do catálogo de cortes inválido.');
    row.push(match[1]?.replaceAll('""', '"') ?? match[2]);
    if (match[3] !== ',') {
      if (row.some(Boolean)) rows.push(row);
      row = [];
    }
  }
  return rows;
}

const [headers, ...records] = readCsv(source);

export const aiHairCatalog = records.map(row => {
  const cut = Object.fromEntries(headers.map((key, index) => [key, row[index]]));
  return {
    id: cut.id,
    name: cut.nome,
    presentations: cut.apresentacoes.split(';'),
    textures: cut.texturas.split(';'),
    maleLength: cut.comprimento_masculino,
    femaleLength: cut.comprimento_feminino,
    instructions: cut.como_pedir,
  };
});
