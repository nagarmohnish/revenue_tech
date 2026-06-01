# agentmint-go

One credit wallet across your whole AI-agent suite. Two calls: `Authorize` before the agent runs, `Debit` after success.

## Install

```bash
go get github.com/nagarmohnish/agentmint-go
```

## Use

```go
package main

import (
    "context"
    "log"

    am "github.com/nagarmohnish/agentmint-go"
)

func main() {
    c, _ := am.New("am_live_...")
    ctx := context.Background()

    d, err := c.Authorize(ctx, am.AuthorizeArgs{
        WorkspaceID: "ws_ac82",
        Product:     "writer",
        Action:      "generate_doc",
        Cost:        25,
    })
    if err != nil { log.Fatal(err) }
    if !d.Allow  { log.Fatalf("denied: %s", d.Reason) }

    // run your agent...

    _, err = c.Debit(ctx, am.DebitArgs{
        AuthorizeArgs: am.AuthorizeArgs{WorkspaceID: "ws_ac82", Product: "writer", Action: "generate_doc", Cost: 25},
        ResourceID:    "doc_91a",
    })
    if err != nil { log.Fatal(err) }
}
```

Idempotency: pass the same `ResourceID` twice and the second call is a no-op.
