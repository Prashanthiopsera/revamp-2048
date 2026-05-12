# Recommended Security Headers

This document lists the HTTP response headers that should be configured at the hosting/CDN layer for a production deployment of revamp-2048. They complement the `<meta http-equiv="Content-Security-Policy">` tag in `index.html` (which covers static-hosting environments where server headers are not configurable).

---

## Required Headers

### Content-Security-Policy

Set at the server level in addition to the meta tag. Server-sent CSP takes precedence over the meta tag on supporting browsers.

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  img-src 'self' data: blob:;
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests
```

**Notes:**
- `style-src 'unsafe-inline'` is required for React Three Fiber, which injects inline canvas styles at runtime.
- `blob:` in `img-src` is required by the WebGL renderer for texture uploads.
- `upgrade-insecure-requests` automatically upgrades any HTTP sub-resource requests to HTTPS.

### Strict-Transport-Security (HSTS)

Instructs browsers to only connect via HTTPS for the specified duration.

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

> **Warning**: Submit to the [HSTS preload list](https://hstspreload.org/) only when you are certain all sub-domains are served over HTTPS.

### X-Content-Type-Options

Prevents MIME-type sniffing. Every response must declare the correct `Content-Type`.

```http
X-Content-Type-Options: nosniff
```

### X-Frame-Options

Prevents the app from being embedded in an iframe (clickjacking protection). Redundant with `frame-ancestors 'none'` in CSP but included for older browsers.

```http
X-Frame-Options: DENY
```

### Referrer-Policy

Controls how much referrer information is sent with outbound requests.

```http
Referrer-Policy: strict-origin-when-cross-origin
```

### Permissions-Policy

Disables browser features the app does not use.

```http
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

---

## Hosting-Specific Configuration

### GitHub Pages

Add a `_headers` file in the `public/` directory (requires Pages to use Netlify-style headers, or use a GitHub Actions step to configure Cloudflare/other CDN):

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

### Netlify

Add a `netlify.toml` at the repository root:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=()"
```

### Vercel

Add a `vercel.json` at the repository root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; upgrade-insecure-requests" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" }
      ]
    }
  ]
}
```

---

## Verifying Headers

Use [securityheaders.com](https://securityheaders.com/) or the browser DevTools **Network** tab to verify the headers are being sent correctly after deployment.
