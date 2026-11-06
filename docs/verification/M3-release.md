# M3 release gate – 0.4.0 (v0.04.00)

`npm run release:gate -- M3 --pages-run=42205526143 --pages-commit=d5e99313bea035ab2550af83edff833256f29090` passed on 2026-11-06 in a clean worktree at that exact commit (successful Pages run 42205526143, read from the GitHub API). Full browser smoke: 72 PASS. Report:

```json
{
  "mode": "check",
  "head": "d5e99313bea035ab2550af83edff833256f29090",
  "version": "0.3.0",
  "pages": {
    "run": "42205526143",
    "commit": "d5e99313bea035ab2550af83edff833256f29090",
    "url": "https://tom161819.github.io/Newgame/",
    "status": "Success",
    "attempt": 1
  },
  "checks": [
    {
      "command": "npm ci",
      "status": "passed"
    },
    {
      "command": "npm run changelog:validate",
      "status": "passed"
    },
    {
      "command": "npm run versions:validate",
      "status": "passed"
    },
    {
      "command": "npm test",
      "status": "passed"
    },
    {
      "command": "npm run archive:verify",
      "status": "passed"
    },
    {
      "command": "npm run build -- --base=/Newgame/",
      "status": "passed"
    },
    {
      "command": "npm run archive:stage",
      "status": "passed"
    },
    {
      "command": "npm run archive:verify-site",
      "status": "passed"
    },
    {
      "command": "npm run smoke -- --base=/Newgame/ --full",
      "status": "passed"
    }
  ],
  "recordedAt": "2026-11-06T10:52:02.915Z",
  "milestone": "M3",
  "stages": [
    {
      "stage": "01",
      "commit": "fcdb80f2ab1ded774a76f3928fd6fdfe9c3bf265"
    },
    {
      "stage": "02",
      "commit": "5074450fe57321ac71b7ded1cedcaf2281d2f216"
    },
    {
      "stage": "03",
      "commit": "1d9dd4610a5690db8348b2743ec376b668266fcf"
    },
    {
      "stage": "04",
      "commit": "0024c16c803a91b151cff08300665076f8b67b35"
    },
    {
      "stage": "05",
      "commit": "ead4d006a39685c53e3de79f7ad33e991e34acbe"
    },
    {
      "stage": "06",
      "commit": "7a5a6662c7d619c7e86960d6f71cf5c68b035483"
    },
    {
      "stage": "07",
      "commit": "0596b517e38919c672c0856f9fd7f3d927cc848b"
    },
    {
      "stage": "08",
      "commit": "c106cc4f4b0d1afb73a444500d0d1adabc92fb05"
    },
    {
      "stage": "09",
      "commit": "f3310a105223654a595f5bff205c56f5668c15cc"
    },
    {
      "stage": "10",
      "commit": "0f4ebce931d912c18ff33a6148697b9514bb9249"
    },
    {
      "stage": "11",
      "commit": "3c08916272b6271fa377f06ed52c22ad51b2b899"
    },
    {
      "stage": "12",
      "commit": "a9aa16f0ee4bfb58911b55254d60d4e9b3b11b2a"
    }
  ]
}
```
