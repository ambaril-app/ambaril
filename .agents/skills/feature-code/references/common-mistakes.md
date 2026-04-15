# Common Mistakes — Feature Code

| Mistake                             | Fix                                                |
| ----------------------------------- | -------------------------------------------------- |
| Wave 1 sem dados Wave 0             | Wave 0 obrigatoria                                 |
| Todos testes de vez, depois codigo  | TDD interleaved: 1 teste → 1 impl → verificar      |
| Continuar alem saturacao            | Hard stop. Qualidade degrada exponencialmente      |
| Commit sem tsc                      | Auto-check obrigatorio                             |
| Pular INSIGHTS.md                   | Logar tudo. Operador decide importancia            |
| Sem comparar ferramenta atual       | Operador precisa verificar paridade                |
| Ignorar scope hammer quando travado | 3 tentativas = scope hammer                        |
| Pular regression slices anteriores  | Re-rodar. Regressao silenciosa e pior bug          |
| Sair sem handoff                    | Handoff obrigatorio (docs/dev/HANDOFF-TEMPLATE.md) |
| Corrigir spec errada in-place       | INSIGHTS + flag + STOP                             |
