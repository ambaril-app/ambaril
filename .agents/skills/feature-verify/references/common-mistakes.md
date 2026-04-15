# Common Mistakes - Feature Verify

| Mistake                                                     | Fix                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| Declaring "ready for PR" without running fresh checks       | Evidence first: run checks in the same session as the decision           |
| Using only lint/type-check and ignoring build/test/security | Execute the full required suite defined in project.yaml checks           |
| Ignoring release-safety on medium+ changes                  | No minimum release package = no pass                                     |
| Marking `green` with an open blocker                        | Open blocker implies `red`                                               |
| Escalating everything to operator without trying auto-fix   | Apply auto-fix loop for unambiguous technical issues                     |
| Trying to auto-fix ambiguous product/scope problems         | Escalate to human decision, do not force implementation                  |
| Forgetting DS validation on UI changes                      | Validate design system / responsiveness / accessibility before approving |
| Skipping null-check on manifest entries                     | Always check if a docs/checks key exists before using it                 |
