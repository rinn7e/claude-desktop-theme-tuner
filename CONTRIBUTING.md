# Contributing

Bug reports and ideas are welcome as
[GitHub issues](https://github.com/rinn7e/claude-desktop-theme-tuner/issues).
How to build and check the project is in
[doc/development.md](doc/development.md), and the code follows
[doc/code-convention.md](doc/code-convention.md).

## Picking up an issue

Planned work lives in [GitHub issues](https://github.com/rinn7e/claude-desktop-theme-tuner/issues).
The labels say what an issue is and what state it is in, and the same rules
apply whether a person or an AI agent does the work. Each label starts with a
number for its kind, so they always show in the same order: `1-` type, `2-`
status, `3-` area.

| Label             | Meaning                                                     |
| ----------------- | ----------------------------------------------------------- |
| `1-...`           | Type: bug, enhancement or tech debt                         |
| `2-open`          | Fully specified with "Done when" criteria, ready to pick up |
| `2-investigation` | Feasibility unclear: research and write it up before coding |
| `2-block`         | Parked until the condition in the issue is met              |
| `2-in-progress`   | Someone is working on it (see the assignee)                 |
| `2-review`        | A pull request is open and waiting for review               |
| `2-duplicate`     | Same as another issue, closed with a link to it             |
| `3-...`           | Area: which parts of the project it touches                 |

An issue has exactly one type and one status label, and one or more areas.

To work on one:

1. Pick an open issue labelled `2-open` that has no assignee.
2. Assign yourself and switch the label to `2-in-progress` before you
   start, so nobody else picks it up.
3. Open a pull request that says `Closes #<number>` and meets every "Done
   when" item, and switch the label to `2-review` once it is ready for
   review and its checks pass.
