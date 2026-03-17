# Essay Engine

Motor de correção de redação em Python para o Start 5.

## Estrutura

- `constants.py`: listas de marcadores linguísticos e definições das competências.
- `utils.py`: funções de normalização, tokenização e apoio às heurísticas.
- `evaluator.py`: avaliação principal da redação, com leitura por competência.
- `cli.py`: ponto de entrada usado pelo `server.js`.

## Integração

O backend Node pode usar este motor quando:

- `START5_ESSAY_LOCAL_ENGINE=python`
- `START5_PYTHON_COMMAND` aponta para um interpretador Python válido

Se o Python não estiver disponível, o `server.js` volta para o corretor local em JavaScript sem quebrar o fluxo.
