# Common Mistakes — Feature Implement

| Mistake                              | Fix                                       |
| ------------------------------------ | ----------------------------------------- |
| Skip Wave 0                          | Data-first is non-negotiable              |
| Waves 8+ slices                      | Max 5 (3 if ceremony "light"). Split.     |
| Slices not vertical                  | DB→backend→UI per journey                 |
| Skip rabbit hole pass                | Found in code costs 3x                    |
| Ignore No-Gos from pitch             | Must not reappear in the plan             |
| No comparison tool                   | Operator needs to know what to compare    |
| Two slices on same file without flag | Ownership map mandatory                   |
| No regression set waves 1+           | Re-run prior wave tests                   |
| Hardcoded paths                      | All paths come from project.yaml manifest |
