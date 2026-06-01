// Package agentmint is the AgentMint SDK — one credit wallet across your whole
// AI-agent suite. Two calls: Authorize before the agent runs, Debit after success.
package agentmint

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const DefaultBaseURL = "https://api.agentmint.com"

type Client struct {
	apiKey  string
	baseURL string
	http    *http.Client
}

type Option func(*Client)

func WithBaseURL(u string) Option         { return func(c *Client) { c.baseURL = strings.TrimRight(u, "/") } }
func WithHTTPClient(h *http.Client) Option { return func(c *Client) { c.http = h } }

func New(apiKey string, opts ...Option) (*Client, error) {
	if apiKey == "" {
		return nil, errors.New("agentmint: apiKey is required")
	}
	c := &Client{apiKey: apiKey, baseURL: DefaultBaseURL, http: &http.Client{Timeout: 10 * time.Second}}
	for _, o := range opts {
		o(c)
	}
	return c, nil
}

type AuthorizeArgs struct {
	WorkspaceID string `json:"workspaceId"`
	Product     string `json:"product"`
	Action      string `json:"action"`
	Cost        int    `json:"cost"`
}

type DebitArgs struct {
	AuthorizeArgs
	ResourceID     string `json:"resourceId"`
	IdempotencyKey string `json:"-"`
}

type AuthorizeResult struct {
	Allow   bool                   `json:"allow"`
	Reason  string                 `json:"reason,omitempty"`
	Balance *int                   `json:"balance,omitempty"`
	Upgrade map[string]interface{} `json:"upgrade,omitempty"`
}

type DebitResult struct {
	OK            bool   `json:"ok"`
	TransactionID string `json:"transactionId"`
	Balance       int    `json:"balance"`
	Idempotent    bool   `json:"idempotent,omitempty"`
}

type Error struct {
	Status  int
	Message string
	Code    string
}

func (e *Error) Error() string { return fmt.Sprintf("agentmint: %d %s", e.Status, e.Message) }

func (c *Client) Authorize(ctx context.Context, a AuthorizeArgs) (*AuthorizeResult, error) {
	var out AuthorizeResult
	if err := c.post(ctx, "/v1/authorize", a, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) Debit(ctx context.Context, a DebitArgs) (*DebitResult, error) {
	headers := map[string]string{}
	if a.IdempotencyKey != "" {
		headers["Idempotency-Key"] = a.IdempotencyKey
	}
	var out DebitResult
	if err := c.post(ctx, "/v1/debit", a, headers, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) post(ctx context.Context, path string, body any, headers map[string]string, out any) error {
	b, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(b))
	if err != nil {
		return err
	}
	req.Header.Set("content-type", "application/json")
	req.Header.Set("authorization", "Bearer "+c.apiKey)
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	res, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	data, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		var apiErr struct {
			Message string `json:"message"`
			Error   string `json:"error"`
			Code    string `json:"code"`
		}
		_ = json.Unmarshal(data, &apiErr)
		msg := apiErr.Message
		if msg == "" {
			msg = apiErr.Error
		}
		if msg == "" {
			msg = res.Status
		}
		return &Error{Status: res.StatusCode, Message: msg, Code: apiErr.Code}
	}
	return json.Unmarshal(data, out)
}
