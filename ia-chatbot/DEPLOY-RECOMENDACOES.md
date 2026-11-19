# Recomendações por questionário no Render

O `render.yaml` na raiz prepara um Web Service Python separado da API Java.
Antes de criar, confira na conta Render se já existe um serviço Flask deste projeto.
Reutilize-o se houver. O plano configurado no Blueprint é gratuito.

Configuração equivalente no painel:

- Repositório: `Dev-Ulrich/espelho-meu`
- Root Directory: `ia-chatbot`
- Runtime: Python; `PYTHON_VERSION=3.12.3`
- Build: `pip install -r requirements.txt && python verificar_demo.py`
- Start: `gunicorn --bind "0.0.0.0:$PORT" "app:create_app()"`
- Health check: `/api/saude`

Os modelos `modelos/cabelo.joblib` e `modelos/maquiagem.joblib` já estão versionados.
O build verifica ambos, todos os perfis aceitos e os resultados de demonstração.
Não é necessário treinar novamente, enviar fotos nem configurar chave da OpenAI.

Após o deploy, use o domínio realmente atribuído pelo Render e confirme:

1. `GET /api/saude`: HTTP 200 e `{"modelos":{"cabelo":true,"maquiagem":true}}`.
2. `POST /api/recomendacoes/cabelo` com `{"textura":"cacheado","comprimento":"longo","manutencao":"media"}`:
   HTTP 200 e `{"area":"cabelo","recomendacao":"camadas longas"}`.
3. `POST /api/recomendacoes/maquiagem` com `{"tipo_pele":"mista","ocasiao":"trabalho","acabamento":"natural"}`:
   HTTP 200 e `{"area":"maquiagem","recomendacao":"maquiagem natural"}`.

Somente depois, adicione em `front-end/vercel.json` um rewrite com source
`/api/recomendacoes/:area` e destination igual à URL HTTPS real do Flask seguida
de `/api/recomendacoes/:area`, antes da regra genérica de `index.html`.
Não publique um host fictício. Preserve o proxy local em `vite.config.ts`, as
chamadas relativas do React e `VITE_API_BASE_URL` da API Java.

Republique o front e valide as duas jornadas pela origem pública da Vercel, além
do GET Java em `/cabelo`. O rewrite é servidor-servidor; o navegador continua
enviando as recomendações à mesma origem da página.
