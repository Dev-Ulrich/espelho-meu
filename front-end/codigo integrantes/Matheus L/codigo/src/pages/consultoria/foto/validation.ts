export async function validatePhoto(file: File, maxBytes: number): Promise<string | null> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) return 'O limite de tamanho ainda precisa ser configurado.';
  if (!file.size) return 'O arquivo está vazio. Escolha outra foto.';
  if (file.size > maxBytes) return `Escolha uma foto de até ${(maxBytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} MB.`;
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Escolha uma imagem JPG ou PNG.';
  if (!/\.(jpe?g|png)$/i.test(file.name)) return 'O nome do arquivo deve terminar em .jpg, .jpeg ou .png.';
  let bytes: Uint8Array;
  try { bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer()); }
  catch { return 'Não foi possível ler o arquivo. Selecione a foto novamente.'; }
  const isPng = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte);
  const isJpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if ((file.type === 'image/png' && !isPng) || (file.type === 'image/jpeg' && !isJpeg)) {
    return 'O conteúdo não corresponde ao formato informado. Escolha outra imagem JPG ou PNG.';
  }
  return null;
}
