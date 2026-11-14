# Plano de contribuições de Front-End

Cinco entregas de Front-End para cada colega. Cada linha deve virar um commit após a implementação e a conferência indicada.

## Arthur — Como funciona e ajuda

Trabalhe em `src/pages/home/how-it-works/` e `src/pages/ajuda/`. Combine a ligação dessas áreas com Victor.

| # | Commit sugerido | Como conferir |
| --- | --- | --- |
| 1 | `feat: adiciona sequência de quatro passos da consultoria` | Texto e ordem seguem o frame da home. |
| 2 | `feat: incorpora os ícones e a numeração dos passos` | Cada ícone acompanha a etapa correta e é ignorado pelo leitor de tela quando decorativo. |
| 3 | `style: adapta os passos para telas menores` | Os cartões mantêm a ordem de leitura em 360 px, 768 px e 1280 px. |
| 4 | `feat: cria as perguntas frequentes da consultoria` | As respostas explicam foto, questionário, recomendações e simulação. |
| 5 | `feat: adiciona orientações para preparar a foto` | A central de ajuda cobre iluminação, enquadramento e validação de arquivo. |

## Yasmin — Benefícios, convite e rodapé

Trabalhe em `src/pages/home/benefits/`, `src/pages/home/final-cta/` e `src/components/layout/footer/`.

| # | Commit sugerido | Como conferir |
| --- | --- | --- |
| 1 | `feat: cria seção de benefícios da home` | Títulos, textos e imagens correspondem ao frame. |
| 2 | `style: ajusta grade responsiva dos benefícios` | Os cartões ficam legíveis em celular e desktop. |
| 3 | `feat: cria convite final com acesso à consultoria` | O CTA funciona por teclado e abre a rota de consultoria. |
| 4 | `feat: estrutura rodapé com marca e links de suporte` | Os links disponíveis chegam ao destino correto e os grupos de navegação têm rótulo. |
| 5 | `fix: adapta rodapé e ordem de foco em telas pequenas` | As colunas se reorganizam e a navegação por Tab segue a ordem visual. |

## Matheus P. — Integração HTTP no navegador

Trabalhe em `src/services/api/`. Combine o contrato da API Java com a equipe antes de escrever código de endpoint.

| # | Commit sugerido | Como conferir |
| --- | --- | --- |
| 1 | `feat: configura URL da API Java por ambiente` | `.env.example` indica a variável pública e a ausência de URL produz diagnóstico claro. |
| 2 | `feat: adiciona cliente HTTP tipado com Fetch API` | Requisições montam a URL corretamente e respostas sem corpo são tratadas. |
| 3 | `feat: normaliza erros HTTP e respostas inválidas` | Status 400, 401, 500 e falha de conexão chegam ao Front-End com distinção. |
| 4 | `feat: cria serviço de login e cadastro no frontend` | O serviço usa os contratos combinados de requisição e resposta. |
| 5 | `feat: cria serviço de consulta do perfil no frontend` | A chamada autenticada usa o contrato Java e trata sessão ausente ou expirada. |

## Matheus L. — Upload e demonstração de resultados

Trabalhe em `src/pages/consultoria/foto/` e `src/pages/home/simulation-preview/`. Use os exemplos do protótipo na vitrine.

| # | Commit sugerido | Como conferir |
| --- | --- | --- |
| 1 | `feat: implementa seleção acessível de foto` | O arquivo pode ser selecionado pelo teclado e o campo tem um rótulo. |
| 2 | `feat: valida tipos e tamanho das imagens da consultoria` | Formatos e limites combinados com a API retornam mensagens acionáveis. |
| 3 | `feat: mostra prévia da foto e permite trocar o arquivo` | Trocar e remover a imagem atualiza a tela e libera a URL local. |
| 4 | `feat: cria vitrine de comparação antes e depois` | As duas imagens do protótipo têm rótulos claros e a comparação é legível em celular. |
| 5 | `feat: permite alternar entre exemplos da simulação` | Os controles funcionam por teclado e mostram qual exemplo está ativo. |

## Integração na main

Victor cuida da composição da home, rotas, estilos globais, páginas e integrações restantes. Quando uma tarefa precisar de uma rota ou de um ponto de montagem, combine com Victor antes de editar os arquivos compartilhados. Cada integrante registra suas próprias mudanças com a conta GitHub correta. Commits em outras disciplinas continuam no monorepo, mas deixem as cinco contribuições de Front-End visíveis sob `front-end/` para facilitar a avaliação.
