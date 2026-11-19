FROM python:3.12-slim-bookworm
WORKDIR /app

# MediaPipe usa EGL/GLES; o OpenCV também precisa de GL e GLib.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libegl1 libgles2 libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python verificar_demo.py

CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-10000} 'app:create_app()'"]
