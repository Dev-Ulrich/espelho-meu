import { useEffect, useRef, useState } from 'react';
import './photoPicker.css';

export function PhotoPicker({ photo, onChange }: { photo?: File; onChange: (photo?: File) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const [camera, setCamera] = useState(false);
  const [opening, setOpening] = useState(false);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  function stop() {
    generation.current++;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  }
  function close() {
    stop();
    setCamera(false);
    setOpening(false);
    setReady(false);
    setCapturing(false);
  }
  useEffect(() => () => stop(), []);
  useEffect(() => {
    if (!photo) { setPreview(''); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => {
    if (camera && video.current) video.current.srcObject = stream.current;
  }, [camera]);

  function select(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024) {
      setError('Escolha uma foto JPG, PNG ou WebP de até 5 MB.');
      return;
    }
    setError('');
    onChange(file);
    close();
  }
  async function openCamera() {
    if (opening || camera) return;
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('A câmera não está disponível neste navegador. Acesse por HTTPS ou escolha uma foto do dispositivo.');
      return;
    }
    const current = ++generation.current;
    setOpening(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } } });
      if (current !== generation.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      setCamera(true);
    } catch (cause) {
      if (current !== generation.current) return;
      const name = cause instanceof DOMException ? cause.name : '';
      setError(name === 'NotAllowedError' ? 'Permita o acesso à câmera no navegador ou escolha uma foto do dispositivo.'
        : name === 'NotFoundError' ? 'Nenhuma câmera encontrada. Escolha uma foto do dispositivo.'
        : 'Não foi possível abrir a câmera. Verifique se ela está em uso ou escolha uma foto do dispositivo.');
    } finally {
      if (current === generation.current) setOpening(false);
    }
  }
  function capture() {
    const source = video.current;
    if (!source?.videoWidth || !source.videoHeight || capturing) return;
    const current = generation.current;
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1280 / Math.max(source.videoWidth, source.videoHeight));
    canvas.width = Math.round(source.videoWidth * scale);
    canvas.height = Math.round(source.videoHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) { setError('Não foi possível capturar. Escolha uma foto do dispositivo.'); return; }
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    setCapturing(true);
    canvas.toBlob(blob => {
      if (current !== generation.current) return;
      setCapturing(false);
      if (!blob) { setError('Não foi possível capturar. Tente novamente.'); return; }
      select(new File([blob], 'foto-consultoria.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', .9);
  }

  return <div className="photo-picker">
    {!camera && <button type="button" className="action-link action-link--primary" disabled={opening} onClick={openCamera}>{opening ? 'Abrindo câmera…' : 'Tirar foto agora'}</button>}
    <label className="photo-picker__native">Usar câmera do celular
      <input type="file" accept="image/*" capture="user" onChange={event => {
        select(event.currentTarget.files?.[0]);
        event.currentTarget.value = '';
      }} />
    </label>
    <label>Escolher foto do dispositivo (JPG, PNG ou WebP, até 5 MB)
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
        select(event.currentTarget.files?.[0]);
        event.currentTarget.value = '';
      }} />
    </label>
    {(camera || opening) && <div className="photo-picker__camera">
      {camera && <>
        <video ref={video} autoPlay playsInline muted aria-label="Prévia da câmera" onLoadedData={() => setReady(true)} />
        <button type="button" className="action-link action-link--primary" onClick={capture} disabled={!ready || capturing}>{capturing ? 'Capturando…' : 'Capturar foto'}</button>
      </>}
      <button type="button" className="action-link action-link--outline" onClick={close}>Cancelar câmera</button>
    </div>}
    {preview && <figure><img src={preview} alt="Foto selecionada para a consultoria" /><figcaption>Foto selecionada: {photo?.name}</figcaption>
      <button type="button" className="text-link" onClick={() => { onChange(undefined); setError(''); }}>Remover foto</button>
    </figure>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
