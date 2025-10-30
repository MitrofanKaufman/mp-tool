---
trigger: always_on
---

Record all edits and improvements in `CHANGELOG.md ` with a brief description of the changes and the date.

For files that have a version specified in the context of the documentation inside the file itself, 
When changing, change the version according to SemVer logic (main format).

MAJOR:
Changes with global, incompatible changes
MINOR and PATCH → 0

MINOR:
It changes when adding features or refactoring without breaking
PATCH → 0
The MAJOR does not change

PATCH:
Changes with minor fixes
MAJOR and MINOR remain the same

PRERELEASE.NUMBER:
It changes with each new debug/beta build.
MAJOR.MINOR.PATCH remain unchanged until the stabilization
For builds that are not intended for stable release

Main format:
MAJOR.MINOR.PATCH[-PRERELEASE.NUMBER]