# Issue47 — GitHub API access diagnosis, 2026-11-05

The owner explicitly requested one new standard PR-creation attempt instead of
creating the PR manually. Codex retried once; no PR was created. This is a
network capability blocker, not evidence of a GitHub authorization decision.

## Observed facts

- Prepared branch: `codex/issue-47-m2-release`.
- Exact head at the retry: `a758ae583b3985c916b807877cd70cd4cd08e9af`.
- Actual fetched main: `1b73c2c62d9f5c0dd7cbcc43cfc4398efa8b996e` (PR77).
- A fresh public open-PR read returned only draft/HOLD PR31. It is not related
  to this handoff and must not be merged for it.
- Standard `gh pr create --repo tom161819/Newgame --base main --head
  codex/issue-47-m2-release ... --body-file ...` exited 1:
  `Post "https://api.github.com/graphql": Forbidden`.
- A separate unauthenticated HTTPS transport check against the normal public
  `https://api.github.com/` endpoint exited 56:

  ```text
  HTTP/1.1 403 Forbidden
  server: envoy
  curl: (56) CONNECT tunnel failed, response 403
  proxy_connect_status=403
  http_status=000
  ```

  The response was observed at 05:34 UTC (06:34 Europe/Prague). The proxy denied
  the CONNECT before an HTTPS request reached GitHub; this does not establish
  whether GitHub would accept or reject authenticated PR creation.
- Git fetch using the existing platform connection succeeded. Git access and
  API access have different destinations and do not prove one another.
- The local supported policy snapshot is restricted; it includes `github.com`
  but excludes `api.github.com` and `tom161819.github.io`.
- Current provider observations are current, with observed/desired spec revision
  3. They also exclude both required custom hosts; network enforcement state is
  `unknown`. The actual failed transport check establishes the observed denial.
- The existing saved configuration draft revision 8 already lists both
  `api.github.com` and `tom161819.github.io`. Saving that draft did not activate
  its rules in this running instance.
- Provider retained diagnostics returned `history_status: not_found` and no
  records. No historical trace is available to establish when access changed or
  to diagnose the earlier environment Publish failure itself.

## Recovery boundary

Apply the existing intended network configuration through the supported Codex
environment settings/runtime flow. Recheck actual runtime policy and retry the
affected operation after a meaningful access change. A draft save alone is not
runtime activation. If environment publication still fails, the product/runtime
failure requires platform recovery; no repository setting grants network access.

No GitHub branch-protection changes, replacement token, proxy bypass, alternative
API transport, write-enabled CI proxy or repeated unchanged retry was used.
The current tools can inspect the runtime and save a draft, but do not expose an
operation to publish/restart this environment. The draft already contains the
required domains, so no duplicate configuration update was made.

Once access is restored: recheck live main/open PRs, preserve Claude changes,
resolve any relevant coordination-document conflict in the Codex branch, create
one normal PR, wait for its exact head's required CI/reviews and merge normally.
Then complete actual published-release verification before closing47/unlocking48.
No successful PR/merge/Issue update or final release verification is claimed.
The owner does not need to create a PR manually; an authorized agent with working
access can resume from this pushed branch. Any such assistance must be reported
as pending until actually performed, not as a sent MERGE-HELP request.
