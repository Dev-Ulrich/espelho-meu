# Domain Driven Design Using Java

Projeto Spring Boot da API do Espelho Meu. Mantenha o código, o arquivo de build e o Dockerfile nesta pasta.

## Entrega no Portal

Monte um ZIP com o projeto completo sem `target/`, o script de criação de tabelas e sequences, o PDF técnico e as instruções na raiz. Inclua os links da API no Render e do vídeo no YouTube. Use o arquivo de identificação do grupo na entrega oficial.

[Voltar ao índice](../README.md)



## Autenticação e consultoria capilar

1. Em uma instalação existente, aplique somente a migração [001-credenciais.sql](src/main/resources/migrations/001-credenciais.sql) ao esquema Oracle. Em uma instalação nova, crie primeiro o esquema base. O script base recria tabelas e deve ficar restrito a um banco descartável.
2. Configure `DATABASE_URL`, `DATABASE_USERNAME` e `DATABASE_PASSWORD`. Configure a mesma chave aleatória de pelo menos 32 caracteres em `ESPELHO_IA_INTERNAL_KEY` no Java e no Flask. Localmente, use `ESPELHO_IA_URL=http://127.0.0.1:5000`. Em produção, configure `ESPELHO_COOKIE_SECURE=true`.
3. O cadastro pelo site cria uma conta `USER`. Para provisionar uma conta administrativa, cadastre-a e atualize a role do ID correspondente em `T_EM_CREDENCIAL` por meio do acesso administrativo ao Oracle. As contas legadas sem credencial permanecem no banco sem acesso por senha.
4. Use `GET /auth/csrf` antes dos POSTs, PUTs e DELETEs. O fluxo público usa `POST /auth/cadastro` e `POST /auth/login`. A sessão é consultada em `GET /auth/sessao` e encerrada por `POST /auth/logout`.
5. A consultoria usa `GET /consultoria/cabelo/questionario` e `POST /consultoria/cabelo` com sessão válida. Os CRUDs administrativos exigem `ADMIN`.

Publique Java e Flask com a chave compartilhada e a migração aplicada antes de promover o novo front ao domínio público. Mantenha `ESPELHO_DEMO_LOCAL` desativada nos ambientes publicados.
