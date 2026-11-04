# M2: frozen release and actual deployed archive proof

The M2 release source remains `02a3a43ace8adc993aea7a392424d7cdf4e7dec9`
(tree `49b1e79b6bf90152c2e69e9fbc01ad74221208d2`, version0.3.0, Save14).
Do not repeatedly retag or rebuild this archive as Claude's accepted graphics
advance on main. Its immutable snapshot keeps its original459-test/build/browser
proof. The72 older snapshots and their storage namespaces remain unchanged.

## What is checked

Preflight `release:gate` still requires the reviewed live source/build paths to
match the actual successful Pages source, and still runs all nine commands.
It has no bypass for newer live development.

Final `release:verify` now distinguishes that live build from the frozen release:

- Read a real successful Pages run and its full deployed commit SHA.
- Require the release source to be an ancestor of that deployed commit and HEAD;
  require the actual public tag target and the tagged package version to agree.
- Require the released changelog entry to match the tag, while allowing newer
  work in Unreleased. Verify the local snapshot and actual tagged source tree.
- Read the archived directory from the **deployed Git commit**, using `ls-tree`
  and binary-safe `cat-file --batch`. Reject missing/extra files, symlinks,
  non-blob entries and any differing SHA-256, including the raw manifest bytes.
- Require that deployed commit's version index to advertise the exact source
  tree and canonical archive URL. Keep the matching playable official catalog
  entry check. A tag-aware Pages build remains required after tag publication.

A successful old deployment plus an archive present only in the local branch
cannot pass. Newer approved live graphics need not be copied into an old release.
This replaces the final live-source equality requirement with a stronger proof
of the actual frozen payload; it does not skip preflight or deployment evidence.

## Actual verification so far

The real Git fixtures cover binary PNG bytes, newer live development, an old
deployment missing the archive, a corrupted deployed image hidden by a restored
local copy, missing/extra files, symlinks, incorrect published metadata, a false
source tree and a mismatched package version. Together with existing gate tests:
12/12 pass. The complete current suite passes473/473,0failed/0skipped.

Direct verification against integration commit
`3d5ac80ebb389f3be810a440634a66950ae19506` hashes all71 actual Git files in the
02a archive and passes. Verification refuses main14071b1, which has not merged
that release source/archive. This local integration commit is **not** claimed
to be deployed. Full current-game/Studio integration results are recorded in
[the publication checkpoint](M2-release-publication.md).

## Environment limitation

An actual HTTPS request to `https://api.github.com/` fails at CONNECT with403
from the environment gateway, before reaching GitHub. The current runtime's
restricted destination list omits `api.github.com`; the saved environment draft
is not the running policy. The user's screenshot shows unrestricted access
selected but `Couldn't publish environment`, so changing repository rights or
adding the same domain again cannot activate that draft. Internal publish logs
are not available to this agent. Keep using the supported configuration workflow
and preserve the recoverable PR; do not bypass the proxy or push directly to main.
