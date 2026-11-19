# Recomendações por questionário no Render

Serviço publicado: https://espelho-meu-ia.onrender.com

Health check e os dois POSTs de demonstração foram validados com HTTP 200.
O `front-end/vercel.json` encaminha `/api/recomendacoes/:area` para este serviço
antes do fallback da SPA. A API Java continua independente.

O `render.yaml` na raiz prepara um Web Service Docker separado da API Java.
Antes de criar, confira na conta Render se já existe um serviço Flask deste projeto.
Reutilize-o se houver. O plano configurado no Blueprint é gratuito.

Configuração equivalente no painel:

- Repositório: `Dev-Ulrich/espelho-meu`
- Root Directory: vazio (raiz do repositório)
- Runtime: Docker
- Dockerfile: `./ia-chatbot/Dockerfile`
- Docker Context: `./ia-chatbot`
- Build e Start: definidos pelo Dockerfile
- Health check: `/api/saude`

Os modelos `modelos/cabelo.joblib` e `modelos/maquiagem.joblib` já estão versionados.
O build verifica ambos, todos os perfis aceitos e os resultados de demonstração.
Não é necessário treinar novamente nem configurar chave da OpenAI para a análise facial.
O build também envia uma imagem sintética sem rosto à rota privada e exige a
resposta de validação 422. Isso verifica o detector real, seus modelos e bibliotecas
nativas: um 503 deve interromper o build.

O runtime Python nativo não executa o Dockerfile nem instala `libegl1` e
`libgles2`. A consulta manual pode funcionar enquanto a análise de foto retorna 503.
Para o serviço existente, aplique a mudança para Docker e os caminhos acima no
Render antes de republicar. Apenas enviar o código não altera a configuração de
um serviço criado fora de um Blueprint. Preserve a `ESPELHO_IA_INTERNAL_KEY` e a
URL usada pela API Java. Não crie um serviço duplicado.

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
