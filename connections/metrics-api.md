---
name: metrics-api
kind: openapi             # described by an OpenAPI document the harness turns into tools
url: https://metrics.internal.example.com
spec: https://metrics.internal.example.com/openapi.json
auth:
  type: api_key
  token_env: METRICS_API_KEY
scopes:
  - read:metrics
---

Internal metrics service (OpenAPI). Read-only timeseries for product and revenue
metrics. Composed by the `data-science` agent. As with every connection, only the
name of the env var lives here; the secret stays in the environment.
