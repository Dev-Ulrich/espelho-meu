"""Detecção local de pontos e medidas usadas pelo classificador facial."""
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

ASSET = Path(__file__).resolve().parent / "modelos" / "face_landmarker.task"
FEATURES = (
    "comprimento_sobre_macas", "superior_sobre_macas", "mandibula_sobre_macas",
    "angulo_mandibula_medio", "angulo_queixo", "arco_inferior_sobre_corda",
)
CONTOUR = (10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,
           148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109)
LOWER = (234,93,132,58,172,136,150,149,176,148,152,377,400,378,379,365,397,288,361,323,454)
LABELS = {
    "oval": "Oval", "redondo": "Redondo", "quadrado": "Quadrado",
    "oblongo": "Alongado / retangular", "coracao": "Coração / triângulo invertido",
    "diamante": "Diamante", "triangular": "Triangular / pera",
}
MAX_FOTO = 5 * 1024 * 1024


def angle(points, a, b, c):
    u, v = points[a] - points[b], points[c] - points[b]
    denominator = np.linalg.norm(u) * np.linalg.norm(v)
    if denominator <= 0:
        raise ValueError("Não foi possível medir o contorno. Tente outra foto.")
    cosine = np.clip(np.dot(u, v) / denominator, -1, 1)
    return float(np.degrees(np.arccos(cosine)))


def medir(pontos, largura, altura):
    """Recebe coordenadas normalizadas e calcula proporções em pixels."""
    raw = np.asarray(pontos, dtype=float)
    if raw.ndim != 2 or raw.shape[0] <= max(CONTOUR) or raw.shape[1] != 2 or not np.isfinite(raw).all():
        raise ValueError("O contorno detectado ficou incompleto. Tente outra foto.")
    pontos_px = raw * (largura, altura)
    length, upper, cheeks, jaw = (
        np.linalg.norm(pontos_px[a] - pontos_px[b])
        for a, b in ((10, 152), (54, 284), (234, 454), (172, 397))
    )
    if cheeks <= 0:
        raise ValueError("Não foi possível medir o contorno. Tente outra foto.")
    jaw_angle = (angle(pontos_px, 234, 172, 152) + angle(pontos_px, 454, 397, 152)) / 2
    lower_arc = np.linalg.norm(np.diff(pontos_px[list(LOWER)], axis=0), axis=1).sum()
    medidas = dict(zip(FEATURES, map(float, (
        length / cheeks, upper / cheeks, jaw / cheeks, jaw_angle,
        angle(pontos_px, 172, 152, 397), lower_arc / cheeks,
    )), strict=True))
    dx, dy = pontos_px[263] - pontos_px[33]
    avisos = []
    if cheeks / largura < 0.14 or cheeks < 70:
        avisos.append("O rosto está pequeno na imagem. Tente aproximar a câmera.")
    if abs(np.degrees(np.arctan2(dy, dx))) > 10:
        avisos.append("A cabeça parece inclinada. Para comparar, fotografe de frente.")
    if np.any((raw[list(CONTOUR)] < 0) | (raw[list(CONTOUR)] > 1)):
        avisos.append("Parte do contorno saiu da imagem.")
    return medidas, raw[list(CONTOUR)].tolist(), avisos


def extrair(arquivo):
    conteudo = arquivo.read(MAX_FOTO + 1)
    if len(conteudo) > MAX_FOTO:
        raise ValueError("A foto precisa ter até 5 MB.")
    try:
        with Image.open(BytesIO(conteudo), formats=("JPEG", "PNG", "WEBP")) as original:
            if max(original.size) > 4096 or getattr(original, "is_animated", False):
                raise ValueError("Use uma foto estática de até 4096 px por lado.")
            foto = ImageOps.exif_transpose(original).convert("RGB")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as erro:
        raise ValueError("Use uma foto JPG, PNG ou WebP válida.") from erro
    foto.thumbnail((1536, 1536))
    if not ASSET.is_file():
        raise RuntimeError("Rode python preparar_facial.py para baixar o modelo de pontos.")
    try:
        from mediapipe import Image as MpImage, ImageFormat, tasks
    except (ImportError, OSError) as erro:
        raise RuntimeError("Não foi possível carregar o MediaPipe/OpenCV. Verifique requirements.txt e as bibliotecas nativas do servidor.") from erro
    opcoes = tasks.vision.FaceLandmarkerOptions(
        base_options=tasks.BaseOptions(model_asset_path=str(ASSET)), num_faces=2,
    )
    try:
        with tasks.vision.FaceLandmarker.create_from_options(opcoes) as detector:
            resultado = detector.detect(MpImage(image_format=ImageFormat.SRGB, data=np.asarray(foto)))
    except (RuntimeError, ValueError, OSError) as erro:
        raise RuntimeError("O MediaPipe não conseguiu iniciar ou processar a foto. Confira o modelo e a instalação.") from erro
    if not resultado.face_landmarks:
        raise ValueError("Nenhum rosto detectado. Use uma foto frontal e com boa iluminação.")
    if len(resultado.face_landmarks) > 1:
        raise ValueError("Mais de um rosto detectado. Envie uma foto com uma única pessoa.")
    return medir([(p.x, p.y) for p in resultado.face_landmarks[0]], *foto.size)
