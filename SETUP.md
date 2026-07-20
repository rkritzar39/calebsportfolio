# README Automation Setup

Place these files in the root of your GitHub repository while preserving their folders:

- `README.md`
- `website-metadata.json`
- `scripts/update-readme.mjs`
- `.github/workflows/update-readme.yml`

## Enable workflow write access

In the GitHub repository, open **Settings > Actions > General > Workflow permissions**, select **Read and write permissions**, and save.

## Run manually

Open **Actions > Update README > Run workflow** and run it on the `main` branch.

## Update a release

Edit only `website-metadata.json`, commit the change, and the workflow will update the generated README sections.

## Test locally

With Node.js 22 or later installed, run:

```bash
node scripts/update-readme.mjs
```

Outside GitHub Actions, the script keeps the existing language data because the GitHub token and repository name are unavailable.
