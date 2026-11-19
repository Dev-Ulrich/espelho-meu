# Revisão humana das 35 fotos

O Arthur da Silva Santana registrou a revisão visual entre 12 e 13 de novembro de 2026 e declarou que não usou IA para preenchê-la. O campo sobre acesso prévio às classificações ficou em branco. A revisão é uma opinião humana individual, com justificativas por foto. Os campos de confirmação da equipe ficaram vazios no CSV.

## Resultado das fichas

| Formato proposto | Fotos |
| --- | ---: |
| Alongado / retangular | 9 |
| Coração / triângulo invertido | 8 |
| Oval | 6 |
| Redondo | 3 |
| Diamante | 2 |
| Quadrado | 2 |
| Triangular / pera | 0 |
| Pendente | 5 |

O Arthur indicou 24 fotos com qualidade adequada e 11 parciais. Registrou segurança alta em 3 fichas, média em 28 e baixa em 4. O rodapé diz “nenhum” pendente, mas as fichas individuais registram cinco. A consolidação usa as respostas individuais.

| Ação registrada | IDs |
| --- | --- |
| Buscar outra foto | EM-010, EM-030 |
| Discutir casos sem classificação | EM-004, EM-018, EM-024 |
| Começar pelas candidatas propostas pelo Arthur | EM-013, EM-014, EM-022, EM-027, EM-028 |

Abra [revisao-facial-35.csv](revisao-facial-35.csv) no Excel, importando como UTF-8 e selecionando vírgula como separador, ou em outra ferramenta de planilha. A tabela preserva a resposta literal e normaliza os termos usados na análise. “Arredondado” foi mapeado para `redondo`, e “retangular” e “alongado / retangular” para `oblongo`.

## Comparações exploratórias

O hash SHA-256 do pacote de fotos da equipe coincide com o da revisão anterior por IA em 34 IDs. EM-005 usa outra foto e ficou fora desse cruzamento. Das 18 fichas com a mesma foto e uma hipótese única das duas fontes, 4 concordaram e 14 divergiram. As outras 17 fichas ficaram sem comparação direta.

As 35 fotos do pacote da equipe coincidem por hash com as usadas no experimento facial 01, inclusive EM-005. Entre as 30 fichas classificadas pelo Arthur, o rótulo editorial usado no experimento coincidiu com o dele em 6, a previsão da árvore em 6 e a previsão da floresta em 4. Nessas previsões, cada foto estava fora da parte de treino de sua rodada. As contagens medem concordância entre fontes com critérios diferentes. Uma avaliação de acerto exigiria rótulos confirmados e um conjunto independente.

## Antes de integrar formato facial

1. Peça que outra pessoa revise primeiro as fotos sem ver as classificações anteriores. Comece pelas cinco candidatas e pelos casos pendentes.
2. Discutam divergências com base no contorno visível. Preencham as três colunas finais só quando houver decisão justificada. Guardem a versão da foto correspondente ao rótulo. Uma substituição exige nova revisão e extração de medidas.
3. Coletem exemplos adicionais por classe com autorização para uso, incluindo triangular / pera. Separem pessoas entre treino e teste e mantenham casos duvidosos como pendentes.
4. Reavaliem o desempenho por classe e documentem os casos em que a foto deve ser rejeitada. Usem a versão medida da foto e fixem os critérios antes de conferir as previsões.

A API deste pacote usa os classificadores de recomendação por questionário. Para o experimento facial, as fontes foram o questionário do Arthur, a revisão exploratória v5 e a base e as previsões do experimento 01.
