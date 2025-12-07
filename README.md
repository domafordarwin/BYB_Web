# Spike Recorder Web Service Scaffold

This repository sets up a web-ready workspace for migrating the [BackyardBrains/Spike-Recorder](https://github.com/BackyardBrains/Spike-Recorder) project. It provides a TypeScript backend, a React/Vite frontend, and shared domain typings.

## Project Structure
- `shared/`: Type-safe domain models shared by both frontend and backend.
- `backend/`: Express-based API scaffold with a health endpoint.
- `frontend/`: React + Vite UI that consumes the health endpoint and links to the upstream repository.

## Getting Started
1. Install dependencies (Node.js 18+):
   ```bash
   npm install
   ```
2. Run the backend (http://localhost:4000):
   ```bash
   npm run dev:backend
   ```
3. Run the frontend (http://localhost:5173):
   ```bash
   npm run dev:frontend
   ```

Set `APP_PORT` in a `.env` file at the repo root to change the backend port.

## Notes
- TypeScript strict mode is enabled across packages.
- Shared types ensure alignment between backend responses and frontend expectations.

## Publishing to GitHub
Follow these steps to publish the current workspace to your GitHub repository:

1. Create the remote repository on GitHub (e.g., `BackyardBrains/Spike-Recorder-Web`).
2. Add the remote to this local repo:
   ```bash
   git remote add origin git@github.com:<your-username>/<your-repo>.git
   ```
   Use the SSH URL if you have keys configured; otherwise, swap for the HTTPS URL.
3. Push the existing history (including the scaffold) to GitHub:
   ```bash
   git push -u origin work
   ```
   Replace `work` with your current branch name if different.
4. Open a pull request on GitHub targeting your default branch (e.g., `main`).
5. Enable branch protection and CI as desired once the PR is open.

### About pushing from this environment
- This workspace cannot directly push to GitHub because credentials and network access are not available in the execution environment.
- To publish your changes, run the above commands locally with your GitHub authentication (SSH keys or a Personal Access Token).
- If you forked the upstream repository, confirm the remote URL points to your fork before pushing: `git remote -v`.
