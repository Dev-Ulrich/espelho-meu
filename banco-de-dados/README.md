# Building Relational Database

Scripts Oracle, modelos do Data Modeler e documentação do banco do Espelho Meu.

## Instalar a estrutura no Oracle

Use [instalar-esquema.sql](instalar-esquema.sql) para iniciar o projeto em um esquema Oracle vazio. Conecte-se com o mesmo usuário configurado no Render e execute o arquivo como script (F5 no SQL Developer para VS Code). O script verifica o esquema antes de criar as tabelas, sequências e constraints de `criar.sql` e acrescenta a tabela de credenciais exigida pela API Java.

- Se o esquema já contém as tabelas do projeto, confira `T_EM_USUARIO` e `T_EM_CREDENCIAL`. Quando só a tabela de credenciais estiver faltando, use a [migração 001-credenciais.sql](../java/src/main/resources/migrations/001-credenciais.sql).
- O script de instalação cria a estrutura sem carregar os registros fictícios. `criar.sql` contém instruções de remoção e exemplos da disciplina.
- O Oracle confirma cada comando DDL bem-sucedido. Se a instalação parar por um erro, anote o código ORA e verifique os objetos já criados antes de continuar.
- Depois da instalação ou migração, confira o [status do banco pelo Java no Render](https://espelho-meu-java.onrender.com/saude/banco). O resultado esperado é HTTP 200.

## Entrega no Portal

O enunciado da disciplina pede um ZIP com o PDF e o arquivo `.sql`. Reúna os modelos, o dicionário, os enunciados das consultas e as evidências no PDF. Organize o SQL na ordem indicada no enunciado.

A seção geral pede um `.txt` de identificação em cada ZIP e a seção de Banco indica somente PDF e SQL. Confira a descrição da atividade no Portal para resolver essa divergência antes do envio.

[Voltar ao índice](../README.md)
