# Domain Driven Design Using Java — Espelho Meu

API Spring Boot do Espelho Meu. O front-end publicado chama a API por meio do proxy `/api/java`.

- API no Render: https://espelho-meu-java.onrender.com/saude
- Conexão com o Oracle: https://espelho-meu-java.onrender.com/saude/banco
- Front-end: https://espelho-meu-two.vercel.app/
- Pitch do projeto: https://youtu.be/KKLf9JBMcbI

## Executar e testar

Use JDK 21. A partir de `java/`, configure `DATABASE_URL`, `DATABASE_USERNAME` e
`DATABASE_PASSWORD` para seu próprio esquema Oracle. Em um esquema novo,
aplique `src/main/resources/criar.sql` e as migrações `001` e `002`, nessa ordem.
Em um esquema existente, aplique apenas as migrações que faltam. O script base
recria objetos, por isso deve ser executado somente em um esquema descartável.

```sh
./mvnw spring-boot:run
./mvnw test
```

No Windows, use `mvnw.cmd`. Os testes automatizados usam H2 em modo Oracle.
O Dockerfile separa a compilação Maven da imagem final com o JRE 21.
Entradas de configuração são fornecidas pelo ambiente, sem credenciais no artefato.

## Contrato REST da relação 1:N

Uma consultoria capilar pode conter várias recomendações de corte. As rotas
administrativas exigem sessão com role `ADMIN`. Envie o token retornado por
`GET /auth/csrf` em requisições que alteram dados.

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/consultoriacapilar/{id}/recomendacoes` | 200 com as recomendações de corte da consultoria; 404 se ela não existir |
| POST | `/consultoriacapilar/{id}/recomendacoes` | 201 e `Location: /recomendacaocorte/{id}` (URL absoluta); 400 para entrada inválida; 404 para vínculo inexistente; 409 para recomendação repetida |
| GET | `/recomendacaocorte/{id}` | 200 com a recomendação cadastrada; 404 se ela não existir |
| DELETE | `/consultoriacapilar/{id}` | 204 após remover; 404 se inexistente; 409 se houver registros dependentes |

Exemplo de POST, para um corte que já existe no catálogo:

```json
{"corteId":7,"justificativa":"Compatível com as preferências da consulta"}
```

Exemplo de resposta 201:

```json
{"id":100,"consultoriaCapilarId":1,"corteId":7,"justificativa":"Compatível com as preferências da consulta","data":"2026-11-19T20:00:00"}
```

`RegraDeNegocioException` representa conflitos como e-mail duplicado e limite de
pré-visualizações. O handler responde com JSON no formato `erro` e `detalhe`.
O Oracle existente usa os identificadores `T_EM_*`, `ID_*` e `SQ_*` do modelo
relacional do grupo. Os scripts preservam esses nomes para uso com a API e a
base existente.

## Entrega no Portal

Monte um ZIP com o projeto Java completo sem `target/`, os scripts Oracle, o
PDF técnico e este README na raiz. Na cópia entregue, inclua a identificação
oficial com os RMs e o link do vídeo de até 5 minutos exigido pela rubrica de Java.

[Voltar ao índice](../README.md)

## Autenticação e consultoria

1. Em uma instalação existente, aplique as migrações ainda pendentes, [001-credenciais.sql](src/main/resources/migrations/001-credenciais.sql) e [002-simulacao-comparacao.sql](src/main/resources/migrations/002-simulacao-comparacao.sql) ao esquema Oracle. Em uma instalação nova, crie primeiro o esquema base. O script base recria tabelas e deve ficar restrito a um banco descartável.
2. Configure `DATABASE_URL`, `DATABASE_USERNAME` e `DATABASE_PASSWORD`. Configure a mesma chave aleatória de pelo menos 32 caracteres em `ESPELHO_IA_INTERNAL_KEY` no Java e no Flask. Localmente, use `ESPELHO_IA_URL=http://127.0.0.1:5000`. Em produção, configure `ESPELHO_COOKIE_SECURE=true`.
3. O cadastro pelo site cria uma conta `USER`. Para provisionar uma conta administrativa, cadastre-a e atualize a role do ID correspondente em `T_EM_CREDENCIAL` por meio do acesso administrativo ao Oracle. As contas legadas sem credencial permanecem no banco sem acesso por senha.
4. Use `GET /auth/csrf` antes dos POSTs, PUTs e DELETEs. O fluxo público usa `POST /auth/cadastro` e `POST /auth/login`. A sessão é consultada em `GET /auth/sessao` e encerrada por `POST /auth/logout`.
5. A consultoria usa `GET /consultoria/{area}/questionario` e `POST /consultoria/{area}` com sessão válida. As áreas aceitas são `cabelo` e `maquiagem`. O resultado persistido vem com `consulta_id` e pode ser reaberto por `GET /consultoria/{area}/resultados/{id}`. A geração usa `POST /consultoria/{area}/resultados/{id}/simulacoes` com `cards`, `autoriza=true` e `foto` no primeiro envio. A mesma rota em `GET` retorna o progresso e `GET …/simulacoes/imagem?card={id}` entrega o JPEG privado. Os CRUDs administrativos exigem `ADMIN`.

Publique Java e Flask com a chave compartilhada e a migração aplicada antes de promover o novo front ao domínio público. Mantenha `ESPELHO_DEMO_LOCAL` desativada nos ambientes publicados.


## Serviço Java do monorepo no Render

O serviço [espelho-meu-java](https://dashboard.render.com/web/srv-dbv7qu6tlv9c73831ig0) usa o repositório `Dev-Ulrich/espelho-meu`, a branch `codex/autenticacao-consultoria-admin` e o Dockerfile `java/Dockerfile` com contexto `java`.

O endpoint [`/saude`](https://espelho-meu-java.onrender.com/saude) verifica o processo Java. O endpoint [`/saude/banco`](https://espelho-meu-java.onrender.com/saude/banco) retorna HTTP 200 quando o serviço encontra a tabela de credenciais no Oracle. Antes de publicar a troca de origem no front, verifique também cadastro, login, permissão de administrador e uma consulta capilar completa.

## Publicar e medir a simulação

1. Abra uma conexão de administração com o mesmo esquema Oracle de `espelho-meu-java`. No SQL Developer, abra a [migração 002](src/main/resources/migrations/002-simulacao-comparacao.sql), selecione a conexão do projeto e use **Executar script (F5)**. Devem ser criadas as tabelas `T_EM_CONSULTA_GUIADA` e `T_EM_PREVIA_CONSULTA` e seus índices. Se a migração 001 já foi aplicada, siga diretamente com a 002.
2. Em [Billing](https://platform.openai.com/settings/organization/billing/overview), selecione a organização em que os créditos foram comprados e confira o saldo. Na mesma organização, abra [API keys](https://platform.openai.com/api-keys), selecione o projeto que vai aparecer no Usage e use **Create new secret key** se precisar criar uma chave. A chave deve permitir chamadas à Images API. Copie-a diretamente para o Render.
3. No [Render](https://dashboard.render.com/), selecione **espelho-meu-ia** → **Environment**. Use **Edit** ou **Add Environment Variable** para definir `OPENAI_API_KEY` com a chave. `OPENAI_IMAGE_MODEL` pode ficar ausente ou conter `gpt-image-2.6-sunburst`. Preserve o valor compartilhado de `ESPELHO_IA_INTERNAL_KEY`, de pelo menos 32 caracteres, neste serviço e no Java. Use **Save only** para combinar a alteração com o deploy do commit da funcionalidade. Guarde a chave da OpenAI somente no Flask.
4. No Flask, abra **Manual Deploy** → **Deploy a specific commit** e informe o SHA da branch da funcionalidade. Aguarde **Live** e confira [a saúde do Flask](https://espelho-meu-ia.onrender.com/api/saude). Para testar num Preview da Vercel, copie a origem exata do Preview (por exemplo, `https://nome-do-preview.vercel.app`, sem barra final) e adicione `ESPELHO_JAVA_PREVIEW_ORIGIN` em **espelho-meu-java** → **Environment** → **Save only**. O domínio público já está autorizado. Faça o deploy do mesmo SHA em **espelho-meu-java** só após aplicar a migração. Aguarde **Live** e confira [a saúde do Java](https://espelho-meu-java.onrender.com/saude) e [a conexão ao banco](https://espelho-meu-java.onrender.com/saude/banco). O deploy por SHA no Render desativa o auto-deploy. Se a branch de publicação incorporar a mudança, use essa branch nas configurações dos serviços e reative o auto-deploy se desejar.
5. Na Vercel, abra o projeto do Espelho Meu em **Deployments** e abra o **Preview** do commit. Verifique em **Settings** que **Root Directory** aponta para `front-end`. Quando o fluxo for validado, publique o mesmo código pela branch de produção do projeto ou pelo botão **Promote** do Preview. A configuração do front usa o proxy existente para o Java.
6. Entre no Preview, faça uma nova consultoria capilar e selecione um corte em **Qual combina mais com você?**. Clique em **Comparar** → **Simular na minha foto**. Escolha uma foto autorizada, marque a autorização e clique em **Gerar prévia**. O card deve passar por **Na fila**, **Gerando prévia** e mostrar o JPEG na coluna do estilo. Recarregue o endereço do resultado, abra a comparação e confira a mesma prévia. Se a qualidade estiver adequada, teste outros dois cards em cabelo e uma consulta de maquiagem. Confira visualmente as áreas que a edição deve preservar.
7. Antes do primeiro clique pago, abra [Usage](https://platform.openai.com/usage), escolha o mesmo projeto, filtre o modelo e registre o valor inicial e o horário em UTC. Depois do teste, aguarde o painel atualizar e confira o acréscimo de solicitações e custo no mesmo intervalo. Em **Logs** do Flask, procure `Uso de imagem` para obter as contagens de foto, texto e saída quando fornecidas pela API. Só os números são registrados. Use o custo exibido em Usage como medida da cobrança real.

### Custo inicial em dólares

O modelo custa US$ 8 por milhão de tokens de imagem de entrada, US$ 5 por milhão de tokens de texto de entrada e US$ 30 por milhão de tokens de saída. O [calculador oficial de saída](https://developers.openai.com/api/docs/guides/image-generation#calculating-costs) estima, em `low`, US$ 0,01992 para 1024×1536 ou 1536×1024 e US$ 0,02469 para 1024×1024. O exemplo abaixo supõe 1.500 tokens de entrada da foto e 200 de texto em cada edição. A foto e a instrução são enviadas uma vez por estilo.

| Edições | Saída | Entrada da foto | Entrada de texto | Total ilustrativo | Reserva inicial |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | US$ 0,01992–0,02469 | US$ 0,012 | US$ 0,001 | US$ 0,03292–0,03769 | US$ 0,05 |
| 3 | US$ 0,05976–0,07407 | US$ 0,036 | US$ 0,003 | US$ 0,09876–0,11307 | US$ 0,15 |
| 30 (10 consultas) | US$ 0,59760–0,74070 | US$ 0,36 | US$ 0,03 | US$ 0,98760–1,13070 | US$ 1,50 |
| 90 (30 consultas) | US$ 1,79280–2,22210 | US$ 1,08 | US$ 0,09 | US$ 2,96280–3,39210 | US$ 4,50 |

### Processamento

O Java reserva cada card em uma transação que bloqueia a linha da consulta no Oracle. O clique retorna HTTP 202 e o front consulta o progresso. Um processo agendado no Java assume um card por vez por instância e chama o Flask. O Gunicorn mantém as duas threads da branch anterior. Flask aguarda a OpenAI por até 150 segundos sem dados e o Java usa 175 segundos de timeout para a edição. O proxy de reescrita da Vercel só transporta o envio, o progresso e as prévias salvas.

Uma rejeição comprovada libera espaço e pode ser repetida manualmente. Uma edição iniciada cujo resultado ficou incerto conserva o espaço. Trabalhos abandonados em andamento tornam-se incertos depois de seis minutos. As prévias concluídas continuam disponíveis pelo endereço do resultado e pelo atalho no histórico local. A foto original é guardada no Oracle para reaproveitamento na mesma consulta enquanto houver espaço e pelo menos uma prévia usada ou em processamento. Ao terminar todas as opções disponíveis ou quando todas as tentativas forem rejeitadas, a foto original é liberada. As prévias persistem vinculadas à consulta e só são entregues à conta proprietária.

Verificação local sem cobrança com `./mvnw verify` em `java`, `python verificar_demo.py` em `ia-chatbot` e `npm test && npm run build` em `front-end`.
