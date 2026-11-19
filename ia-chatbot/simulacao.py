from base64 import b64decode
from binascii import Error as Base64Error
from io import BytesIO
from logging import getLogger

import requests
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_FOTO = 5 * 1024 * 1024
MODELO_PADRAO = "gpt-image-2.6-sunburst"
URL_EDICAO = "https://api.openai.com/v1/images/edits"


def preparar_foto(arquivo):
    dados = arquivo.read(MAX_FOTO + 1)
    if len(dados) > MAX_FOTO:
        raise ValueError("A foto deve ter até 5 MB.")

    try:
        with Image.open(BytesIO(dados), formats=("JPEG", "PNG", "WEBP")) as original:
            if max(original.size) > 4096 or getattr(original, "is_animated", False):
                raise ValueError("Use uma foto estática de até 4096 px por lado.")
            foto = ImageOps.exif_transpose(original).convert("RGB")
            foto.thumbnail((1536, 1536))
            conteudo = BytesIO()
            foto.save(conteudo, format="JPEG", quality=90)
            if foto.height > foto.width * 1.2:
                tamanho = "1024x1536"
            elif foto.width > foto.height * 1.2:
                tamanho = "1536x1024"
            else:
                tamanho = "1024x1024"
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as erro:
        raise ValueError("Selecione uma foto JPG, PNG ou WebP válida.") from erro
    return conteudo.getvalue(), tamanho


def editar_foto(foto, tamanho, area, estilo, chave, modelo):
    regiao = (
        "Altere somente o cabelo. Preserve a cor original do cabelo."
        if area == "cabelo"
        else "Altere somente a maquiagem. Preserve o cabelo e o tom natural da pele."
    )
    prompt = (
        f"Edite esta foto para mostrar uma simulação realista de {estilo}. {regiao} "
        "Preserve a identidade, o formato e os traços do rosto, a expressão, a idade aparente, "
        "as roupas, o enquadramento, a iluminação e o fundo. Aplique a edição diretamente "
        "sobre a foto de referência de modo natural. Gere uma única versão, sem texto nem molduras."
    )
    resposta = requests.post(
        URL_EDICAO,
        headers={"Authorization": f"Bearer {chave}"},
        files={"image[]": ("foto.jpg", foto, "image/jpeg")},
        data={"model": modelo, "prompt": prompt, "size": tamanho, "quality": "low",
              "output_format": "jpeg", "output_compression": 85, "n": 1},
        allow_redirects=False,
        timeout=(10, 150),
    )
    resposta.raise_for_status()
    try:
        dados = resposta.json()
        imagem = b64decode(dados["data"][0]["b64_json"], validate=True)
    except (ValueError, TypeError, KeyError, IndexError, Base64Error) as erro:
        raise ValueError("Resposta inválida da API de imagens.") from erro
    if not imagem.startswith(b"\xff\xd8"):
        raise ValueError("A API de imagens não retornou um JPEG válido.")
    uso = dados.get("usage")
    if isinstance(uso, dict) and isinstance(uso.get("input_tokens_details"), dict):
        entrada = uso["input_tokens_details"]
        contagens = (entrada.get("image_tokens"), entrada.get("text_tokens"), uso.get("output_tokens"))
        if all(type(valor) is int and valor >= 0 for valor in contagens):
            getLogger("gunicorn.error").info("Uso de imagem: entrada_foto=%d entrada_texto=%d saida=%d", *contagens)
    return imagem
