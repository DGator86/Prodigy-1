@AGENTS.md

# Always-on monitoring

After every push to any branch:
1. **Vercel**: Check the latest deployment status using `mcp__Vercel__list_deployments` (projectId: `prodigy-1`, teamId: `team_pod8vRPWZlU9n48TC9CCePAb`). If the build fails, fetch logs with `mcp__Vercel__get_deployment_build_logs` and fix the error.
2. **GitHub**: Subscribe to every open PR with `mcp__github__subscribe_pr_activity` (owner: `DGator86`, repo: `Prodigy-1`). Respond to CI failures, review comments, and merge conflicts automatically.

When a PR is created, subscribe to it immediately without being asked.
