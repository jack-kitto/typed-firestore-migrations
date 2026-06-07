# Publishing

Releases are fully automated once GitHub secrets are configured. You should not need to run `npm publish` by hand after the initial setup.

## One-time setup

### 1. Create the GitHub repository

Push this repo to `jack-kitto/typed-firestore-migrations` on GitHub.

### 2. Enable GitHub Pages

In the repository **Settings → Pages**:

- **Source:** GitHub Actions

The [`pages.yml`](.github/workflows/pages.yml) workflow deploys the static site from `docs/` on every push to `main`.

### 3. GitHub Actions permissions

In the repository **Settings → Actions → General → Workflow permissions**:

- Select **Read and write permissions**
- Enable **Allow GitHub Actions to create and approve pull requests** (optional; needed for some release plugins)

The Release workflow also declares `contents: write` so semantic-release can push version tags and `@semantic-release/git` commits.

### 4. npm access token

1. Log in at [npmjs.com](https://www.npmjs.com/) as the account that will own both packages.
2. Create an **Automation**-type access token (recommended for CI).
3. In GitHub **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|--------|-------|
| `NPM_TOKEN` | Your npm automation token |

`GITHUB_TOKEN` is provided automatically by Actions for GitHub Releases.

### 5. First release

Merge (or push) to `main` with a conventional commit subject, e.g.:

```
feat: add typed Firestore migrations CLI and library
```

The [`release.yml`](.github/workflows/release.yml) workflow will:

1. Run tests and build
2. Bump both package versions (starting at **1.0.0** for a `feat:` commit)
3. Publish `typed-firestore-migrations` and `create-typed-migration-app` to npm
4. Create a GitHub Release with generated notes
5. Commit version bumps back to `main` via `@semantic-release/git`

## Manual publish (fallback)

Only if automation is broken:

```bash
npm run build
npm publish --workspace typed-firestore-migrations
npm publish --workspace create-typed-migration-app
```

Both packages must share the same version number.

## Package scope

| Package | npm name | Published? |
|---------|----------|------------|
| Main library + CLI | `typed-firestore-migrations` | Yes |
| Example scaffolder | `create-typed-migration-app` | Yes |
| In-repo example | `examples/orders` | No (`private: true`) |
