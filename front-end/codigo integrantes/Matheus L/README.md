# Matheus L. — Seleção de foto e demonstração de resultados

Responsável por `src/pages/consultoria/foto/` e `src/pages/home/simulation-preview/`, conforme [PLANO-DE-COMMITS.md](../../PLANO-DE-COMMITS.md). Os arquivos aqui são **código para implementar e revisar**, sem montagem no site e sem upload ao servidor.

Referências: [abertura da consultoria](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=3-1739), [homepage](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=20-363), [comparação de cabelo](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=54-104) e [comparação de maquiagem](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=74-464).

## Arquivos completos para copiar

Os destinos são relativos a `front-end/`. Os arquivos representam a versão final de referência; as cinco etapas abaixo explicam a evolução das entregas.

| Código preparado | Destino |
| --- | --- |
| [`PhotoPicker.tsx`](codigo/src/pages/consultoria/foto/PhotoPicker.tsx) | `src/pages/consultoria/foto/PhotoPicker.tsx` |
| [`validation.ts`](codigo/src/pages/consultoria/foto/validation.ts) | `src/pages/consultoria/foto/validation.ts` |
| [`photo.css`](codigo/src/pages/consultoria/foto/photo.css) | `src/pages/consultoria/foto/photo.css` |
| [`examples.ts`](codigo/src/pages/home/simulation-preview/examples.ts) | `src/pages/home/simulation-preview/examples.ts` |
| [`SimulationPreview.tsx`](codigo/src/pages/home/simulation-preview/SimulationPreview.tsx) | `src/pages/home/simulation-preview/SimulationPreview.tsx` |
| [`simulation-preview.css`](codigo/src/pages/home/simulation-preview/simulation-preview.css) | `src/pages/home/simulation-preview/simulation-preview.css` |

JPG/PNG vêm do protótipo. **O limite de tamanho ainda não está documentado pela API.** O componente final recebe `maxBytes`, não inventa um limite de produção. Recebe também `enabled`, que deve vir da autenticação real. Enquanto essas dependências não existirem, permanece bloqueado. A seleção é local; nenhum arquivo é enviado ou armazenado permanentemente.

## 1. Seleção acessível de foto

Criar uma primeira versão de `src/pages/consultoria/foto/PhotoPicker.tsx`:

```tsx
import { useId } from 'react';
import './photo.css';

export function PhotoPicker({ enabled, onFileChange }: {
  enabled: boolean;
  onFileChange: (file: File | null) => void;
}) {
  const id = useId();
  return <div className="photo-picker">
    <label htmlFor={id}>Sua foto para a consultoria</label>
    <p id={`${id}-hint`}>JPG ou PNG • rosto visível e boa iluminação.</p>
    <input id={id} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png"
      disabled={!enabled} aria-describedby={`${id}-hint`}
      onChange={event => {
        const file = event.currentTarget.files?.[0];
        if (file && enabled) onFileChange(file);
        event.currentTarget.value = '';
      }} />
    {!enabled && <p>Entre na sua conta para selecionar uma foto.</p>}
  </div>;
}
```

Copiar o CSS preparado. Trecho real:

```css
.photo-picker { display: grid; gap: 12px; padding: 20px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper); color: var(--petrol); font: .875rem/1.5 'Lato', sans-serif; }
.photo-picker > label { font-weight: 700; }
.photo-picker input { min-width: 0; width: 100%; padding: 6px; }
```

A interface inicial não valida conteúdo/tamanho: usar somente na revisão local, sem enviar a foto. Não esconder o input com `display: none`, pois o campo nativo deve continuar acessível por teclado.

Commit sugerido: `feat: implementa seleção acessível de foto`.

Conferir: label associado; Tab chega ao input habilitado; Enter/Espaço abre o seletor; cancelar mantém o estado anterior; selecionar o mesmo arquivo novamente dispara mudança. No site sem autenticação, o input permanece desabilitado.

## 2. Validar formato e tamanho

Copiar `validation.ts`. Trecho real:

```ts
if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) return 'O limite de tamanho ainda precisa ser configurado.';
if (!file.size) return 'O arquivo está vazio. Escolha outra foto.';
if (file.size > maxBytes) return `Escolha uma foto de até ${(maxBytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} MB.`;
if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Escolha uma imagem JPG ou PNG.';
```

O arquivo completo confere também extensão e assinatura inicial JPEG/PNG. `accept` é apenas uma orientação do seletor; não é validação. A leitura do cabeçalho não garante que o arquivo inteiro seja decodificável, então a prévia também trata erro de imagem na terceira etapa. O servidor precisará revalidar conteúdo e tamanho quando houver upload.

Na primeira versão, adicionar `maxBytes: number | null` às props, `useState` para a mensagem e um handler assíncrono. Núcleo da seleção (importar `validatePhoto` de `./validation`):

```tsx
const [error, setError] = useState('');
const sequence = useRef(0);
// Dentro do onChange assíncrono, após capturar file e limpar o input:
const request = ++sequence.current;
onFileChange(null);
const message = await validatePhoto(file, maxBytes);
if (request !== sequence.current) return;
setError(message ?? '');
if (!message) onFileChange(file);
```

Só entrar nesse núcleo se `enabled` e `maxBytes` for inteiro positivo. Incrementar `sequence.current` ao desmontar, bloquear ou alterar o limite, conforme os efeitos do arquivo final. Isso impede uma leitura antiga de substituir uma foto mais recente. Exibir `<p role="status">{error}</p>` e associá-lo ao input por `aria-describedby`. Na próxima etapa, copiar o componente consolidado para obter todos esses controles e a prévia.

Commit sugerido: `feat: valida tipos e tamanho das imagens da consultoria`.

Conferir em teste controlado: JPG/PNG válidos; arquivo vazio; tipo inválido; extensão errada; arquivo renomeado com assinatura incompatível; arquivo exatamente no limite (aceito) e um byte acima (rejeitado); duas seleções rápidas (vence a última). Usar limites pequenos apenas nos testes, sem tratá-los como contrato da API. `maxBytes={null}` bloqueia a seleção.

## 3. Prévia, troca e remoção

Substituir `PhotoPicker.tsx` pela versão completa preparada. Ela usa `file` e `onFileChange` controlados pelo pai, libera cada URL local na troca/remoção/desmontagem e não persiste fotos. Trecho real:

```tsx
useEffect(() => {
  if (!file || !available) { setPreview(null); return; }
  const url = URL.createObjectURL(file);
  setPreview({ file, url });
  return () => URL.revokeObjectURL(url);
}, [file, available]);
```

Montagem coordenada em `src/pages/consultoria/ConsultationPage.tsx`: substituir apenas o bloco `.photo-pending` quando a seleção puder ser habilitada; preservar escolha de jornada e requisito de autenticação. Preparação segura enquanto a API não existe:

```tsx
import { useState } from 'react';
import { PhotoPicker } from './foto/PhotoPicker';
// Dentro de ConsultationPage:
const [photo, setPhoto] = useState<File | null>(null);
// No JSX, no lugar do bloco .photo-pending:
<PhotoPicker enabled={false} maxBytes={null} file={photo} onFileChange={setPhoto} />
```

Não trocar `false` por `true` na aplicação para simular login. Victor ligará `enabled` à sessão real após Matheus P. concluir a autenticação e passará o limite documentado. O pai deve limpar `photo` quando a sessão terminar, quando o limite mudar e ao reiniciar a jornada. Remover o import `Camera` se deixar de ser usado.

CSS adicional já incluído no arquivo preparado:

```css
.photo-picker figure img { width: 100%; max-height: 320px; object-fit: contain; border-radius: 12px; }
.photo-picker figcaption { margin-top: 8px; text-align: center; }
.photo-picker__actions { display: flex; flex-wrap: wrap; gap: 12px; }
```

Commit sugerido: `feat: mostra prévia da foto e permite trocar o arquivo`.

Conferir em uma montagem de teste isolada, com `enabled` e limite de teste explícitos: selecionar → trocar → remover → selecionar o mesmo arquivo; prévia usa a foto atual; remoção devolve foco ao input; erro de decodificação limpa a seleção; desmontagem revoga URL. Na aplicação pública, nada de upload sem sessão. `PhotoPicker` não envia Fetch: essa integração dependerá do contrato de envio, fora destes exemplos.

## 4. Vitrine antes e depois

Copiar `examples.ts` e `simulation-preview.css`. Os imports usam **assets locais já existentes**, exportados dos frames de cabelo e maquiagem. A dupla masculina específica da homepage ainda não está nos assets locais; sua exportação e correspondência visual ficam pendentes. Não renomear outro casal de imagens como se fosse a comparação masculina, nem apresentar esta base como réplica completa da home.

Criar inicialmente `src/pages/home/simulation-preview/SimulationPreview.tsx` com uma comparação estática:

```tsx
import { useId } from 'react';
import { ActionLink } from '../../../components/ui/ActionLink';
import { paths } from '../../../app/paths';
import { examples } from './examples';
import './simulation-preview.css';

export function SimulationPreview() {
  const id = useId();
  const example = examples[0];
  return <section className="simulation-preview" aria-labelledby={`${id}-title`}>
    <div>
      <h2 id={`${id}-title`}>Veja antes de decidir</h2>
      <p>Explore possibilidades de cabelo e maquiagem com referências ilustrativas.</p>
      <p>Esta demonstração não processa sua foto nem gera recomendações personalizadas.</p>
      <ActionLink to={paths.consultoria}>Começar consultoria</ActionLink>
    </div>
    <div className="simulation-preview__panel">
      <h3>{example.title}</h3>
      <div className="simulation-preview__pair">
        <figure><img src={example.before} alt={example.beforeAlt} loading="lazy" /><figcaption>Antes • foto de demonstração</figcaption></figure>
        <figure><img src={example.after} alt={example.afterAlt} loading="lazy" /><figcaption>Depois • prévia ilustrativa</figcaption></figure>
      </div>
    </div>
  </section>;
}
```

CSS real da grade:

```css
.simulation-preview__pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
.simulation-preview figure img { width: 100%; height: 240px; object-fit: contain; background: var(--ivory); border-radius: 12px; }
@media (max-width: 900px) { .simulation-preview { grid-template-columns: 1fr; gap: 24px; } }
@media (max-width: 480px) { .simulation-preview__panel { padding: 12px; } .simulation-preview__pair { grid-template-columns: 1fr; } .simulation-preview h2 { font-size: 2.125rem; } }
```

Montagem em `src/pages/home/HomePage.tsx`: importar `SimulationPreview` de `./simulation-preview/SimulationPreview` e inserir `<SimulationPreview />` **após o `<HowItWorks />` já presente**, antes dos benefícios da Yasmin quando montados. Não duplicar capa, cabeçalho ou passos; não alterar os comparadores já existentes de cabelo/maquiagem.

Commit sugerido: `feat: cria vitrine de comparação antes e depois`.

Conferir: antes/depois identificados como demonstração, pessoas correspondentes em cada par, imagens sem distorção, CTA leva à consultoria. Conferir 360, 768 e 1280 px e comparar com os frames; registrar a pendência da dupla específica da home. Não escrever “simulação disponível” como se a foto do visitante fosse processada.

## 5. Alternar exemplos por teclado

Substituir `SimulationPreview.tsx` pela versão completa preparada. Ela acrescenta `useState`, controles Anterior/Próximo, seleção direta e indicação com `aria-pressed`.

Trechos reais:

```tsx
const [activeIndex, setActiveIndex] = useState(0);
const example = examples[activeIndex];
function move(offset: number) {
  setActiveIndex(index => (index + offset + examples.length) % examples.length);
}
```

```tsx
{examples.map((item, index) => <button key={item.id} type="button"
  aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)}>
  {item.title}
</button>)}
```

```css
.simulation-preview__controls button[aria-pressed='true'] { background: var(--purple); color: var(--paper); }
```

Commit sugerido: `feat: permite alternar entre exemplos da simulação`.

Conferir: Próximo no último retorna ao primeiro; Anterior no primeiro vai ao último; seleção direta atualiza título, dois assets e dois textos alternativos juntos. Tab segue a ordem do HTML, Enter/Espaço acionam os botões, o foco fica no acionador e o título com `aria-live="polite"` anuncia a mudança. Sem reprodução automática. Não são abas: os controles são botões em um grupo.

## Antes de entregar

Após instalar os arquivos: `npm run typecheck`, `npm test` e `npm run build`. A pasta de exemplos não faz parte do build atual. Validar seleção/remoção, URLs locais, teclado e responsividade em navegador quando disponível; os testes atuais da aplicação não substituem esses cenários. Revalidar arquivos no servidor quando o upload real for implementado.

Revisar com Victor antes de integrar. Cada integrante executa seus próprios commits após implementar e conferir as respectivas entregas. Esta preparação não realizou commit ou push.
