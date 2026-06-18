---
name: warehouse-server
kind: mcp                 # mcp | openapi | api
url: https://mcp.internal.example.com/sse
auth:
  type: bearer            # bearer | api_key | oauth | none
  token_env: WAREHOUSE_MCP_TOKEN   # env var holding the secret — NEVER the secret itself
scopes:
  - read:warehouse
---

Internal data warehouse over MCP. Read-only access to the `orders`, `customers`, and
`events` tables. Composed by the `sql` and `data-science` agents for live queries.

The harness brokers auth from `$WAREHOUSE_MCP_TOKEN`; the model is handed the remote
tools and never sees the URL or the credential.
