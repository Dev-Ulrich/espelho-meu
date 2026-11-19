# Espelho Meu · Artificial Intelligence & Chatbot

Projeto da Global Solution 2026/2 da FIAP. Dois classificadores treinados sugerem um corte de cabelo ou um estilo de maquiagem com base nas respostas do questionário.

## Arquivos da entrega

| Item | Arquivos |
| --- | --- |
| Dados de treinamento | `dados/cabelo.csv` e `dados/maquiagem.csv` |
| Análise, treinamento e avaliação | `notebooks/cabelo.ipynb` e `notebooks/maquiagem.ipynb` |
| Modelos treinados | `modelos/cabelo.joblib` e `modelos/maquiagem.joblib` |
| API Flask e dependências | `app.py`, módulos auxiliares e `requirements.txt` |
| Identificação do grupo | `IDENTIFICACAO.txt` |

## Executar a API

Use Python 3.12. Crie o ambiente com `python3.12 -m venv .venv` no Linux/macOS ou `py -3.12 -m venv .venv` no Windows. Ative com `source .venv/bin/activate` no Linux/macOS ou `.venv\Scripts\Activate.ps1` no PowerShell.

```sh
python -m pip install -r requirements.txt
python verificar_demo.py
python -m flask --app app run
```

A API fica em `http://127.0.0.1:5000`. As recomendações de texto podem ser testadas sem chave da OpenAI.

| Rota | Entrada de exemplo | Resultado esperado |
| --- | --- | --- |
| `GET /api/saude` | Sem corpo | Ambos os modelos carregados |
| `POST /api/recomendacoes/cabelo` | `{"textura":"cacheado","comprimento":"longo","manutencao":"media"}` | `camadas longas` |
| `POST /api/recomendacoes/maquiagem` | `{"tipo_pele":"mista","ocasiao":"trabalho","acabamento":"natural"}` | `maquiagem natural` |

Para os POSTs, use `Content-Type: application/json`. A interface local abre em `/demo`. No Windows, os atalhos são `Instalar.cmd` e `Abrir-Espelho-Meu.cmd`. No Linux, execute `bash iniciar_demo.sh`.

## Dados e avaliação

Os dados de treino contêm 36 perfis sintéticos de cabelo e 27 de maquiagem rotulados por regras. A acurácia em teste foi de 88,89% em 9 perfis de cabelo e 71,43% em 7 perfis de maquiagem. As métricas medem a reprodução dos rótulos sintéticos. A adequação das sugestões para pessoas reais ainda precisa de validação.

Os notebooks incluem as métricas por classe e as matrizes de confusão. Para reproduzir o treinamento, execute os notebooks ou rode `python treinar.py` e reinicie a API.


## Consultoria capilar autenticada

A API Java chama `/api/privado/cabelo/questionario` e `/api/privado/cabelo/analisar` com a mesma `ESPELHO_IA_INTERNAL_KEY` configurada nos dois serviços. Para executar a demo antiga somente em desenvolvimento local, inicie o Flask com `ESPELHO_DEMO_LOCAL=1`.

Para análise de formato facial em Linux, o MediaPipe precisa de EGL e GLES, e o OpenCV precisa de GL e GLib. A imagem do [Dockerfile](Dockerfile) inclui `libegl1`, `libgles2`, `libgl1` e `libglib2.0-0` e executa o verificador com o detector real durante o build.
