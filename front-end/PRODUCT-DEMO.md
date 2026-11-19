# Cadastro de produto capilar para demonstração

Em `.env.local`, mantenha `VITE_API_BASE_URL` para a listagem normal e configure
explicitamente `VITE_PRODUCT_DEMO_API_URL` com a URL de uma API ligada ao banco
de desenvolvimento autorizado. Não coloque credenciais Oracle em variáveis `VITE_`.

```dotenv
VITE_API_BASE_URL=https://espelhomeu-api.onrender.com/
# Exemplo: somente se esta API local estiver ligada ao banco de teste autorizado.
VITE_PRODUCT_DEMO_API_URL=http://localhost:8080/
```

Nesta revisão, o responsável indicou `https://espelhomeu-api.onrender.com/`
como API autorizada para dados fictícios. Essa URL foi configurada apenas no
`.env.local` ignorado pelo Git.

Execute `npm run dev` (reinicie se alterar o ambiente), abra `/cabelo` e expanda
**Cadastrar produto de teste**. O exemplo Shampoo Demo já preenche os seis campos
obrigatórios. Cor e data são opcionais. O Java calcula `faixaPreco` e devolve o ID.

O cadastro exige HTTP 201; em seguida, a página consulta `/produto` na mesma base
de teste e procura o ID retornado. Confira POST 201, GET 200 e o card na aba Network
e na página. Recarregue para confirmar que o item continua no GET. Após um sucesso,
o formulário fica bloqueado para evitar o reenvio acidental do mesmo produto.
Se apenas o GET falhar, **Tentar novamente** repete somente a leitura.

Sem URL de demonstração, o GET continua usando `VITE_API_BASE_URL`. Em builds de produção, a variável local é ignorada. A versão publicada consulta a disponibilidade do cadastro remoto no servidor.
Remova ou esvazie `VITE_PRODUCT_DEMO_API_URL` para voltar ao modo normal local.

Se houver falha no POST, confira o payload e a resposta para 400/422, o preflight
OPTIONS/CORS e a conexão para falhas de rede, e os logs do controller/Oracle para
500. Um erro de rede não prova que a gravação falhou: consulte a lista antes de
reenviar. Não há retry automático de escrita. O cancelamento no navegador não
desfaz uma gravação já recebida pelo servidor.

Verificações: `npm test` e `npm run build`.


## Demonstração publicada

Configure no Flask do Render a variável `PRODUTO_DEMO_API_URL` com o endereço HTTPS da API Java autorizada para o teste e `PRODUTO_DEMO_CODIGO` com um código aleatório de pelo menos 24 caracteres. Guarde o código somente no servidor e informe-o ao avaliador pelo canal autorizado.

Em Cabelo, abra **Cadastrar produto de teste**, informe o código e use um produto fictício. O front encaminha a solicitação ao Flask, que confirma a autorização, chama o `POST /produto` do Java e verifica o ID no `GET /produto/{id}`. O resultado informa separadamente o sucesso do cadastro e o da leitura.
