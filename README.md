# nginx njs CSP nonce example

Small example showing how to generate a per-request Content Security Policy
nonce with nginx and njs.

## What this does

- Generates 16 cryptographically random bytes per request, then Base64-encodes
  them without padding for use as a CSP nonce.
- Exposes the value through an nginx variable using `js_set`.
- Adds a demo `Content-Security-Policy` header.
- Optionally substitutes `__CSP_NONCE__` placeholders in served HTML so inline
  `<script>` or `<style>` tags can use the same nonce.

The generated value has 128 bits of entropy before encoding. That is the
commonly documented minimum for CSP nonce values. Base64 padding is stripped by
default, so a 16-byte nonce is emitted as 22 characters instead of 24 characters
ending in `==`.

## Files

- `getnonce.js`: njs module imported by nginx.
- `noncetest.conf`: example nginx `conf.d` server configuration.
- `generate_nonce.js`: standalone njs helper that prints sample nonces for
  manual inspection.

## nginx setup

Install nginx with the HTTP njs module and the HTTP Substitution module
(`ngx_http_sub_module`, built with `--with-http_sub_module`). The latter is
needed for the HTML placeholder replacement. In the main `nginx.conf`, load the
njs module before the `http` block:

```nginx
load_module modules/ngx_http_js_module.so;
```

The example works with njs's default engine. That engine is deprecated in njs
1.0.0, so use QuickJS for new configurations when your installed module
supports it. QuickJS works with this example in njs 0.8.10 and newer; that is
the first QuickJS version with the `crypto` module used here. Select it in the
`http` block only when it is available in your installed module:

```nginx
http {
  js_engine qjs;
  include /etc/nginx/conf.d/*.conf;
}
```

Copy the example files:

```sh
sudo install -D -m 0644 getnonce.js /etc/nginx/njs/getnonce.js
sudo install -m 0644 noncetest.conf /etc/nginx/conf.d/noncetest.conf
sudo nginx -t
sudo systemctl reload nginx
```

Test the header and replacement together. The example's diagnostic header is
used only for this check:

```sh
curl -sS -D /tmp/nonce-headers -o /tmp/nonce-body.html http://localhost:8080/
nonce=$(awk -F ': ' 'tolower($1) == "x-csp-nonce" { print $2 }' /tmp/nonce-headers | tr -d '\r')
test -n "$nonce"
grep -F "nonce=\"$nonce\"" /tmp/nonce-body.html
! grep -Fq '__CSP_NONCE__' /tmp/nonce-body.html
```

## HTML usage

For static HTML, use a placeholder in nonce attributes:

```html
<script nonce="__CSP_NONCE__">
  console.log('allowed by the per-request CSP nonce');
</script>
```

The example config uses `sub_filter` to replace that placeholder with the same
request-local value that appears in the CSP header.

Only use this replacement with fully trusted static templates. Do not run a
whole-response replacement over a page containing user-controlled HTML or text:
an attacker could include the public `__CSP_NONCE__` marker in an injected
`<script>` or `<style>` element and receive a valid nonce. Applications should
instead render nonce attributes only on trusted elements, while escaping
untrusted content normally.

## Security notes

The nonce generator is suitable for CSP use when the surrounding nginx and
application behavior preserves the per-request value correctly:

- It uses cryptographically secure randomness through `crypto.getRandomValues()`.
- It generates 16 random bytes, giving 128 bits of entropy before encoding.
- It emits a fresh value per request through `js_set`.
- Removing Base64 padding does not weaken the nonce.

The remaining risks are operational:

- Generate a fresh nonce for every HTTP response that uses nonce-based CSP.
- Do not use a fixed nonce, a timestamp, a counter, or a value generated at
  build time.
- Do not add `nocache` to the `js_set` directive in this example. The header and
  HTML body must use one identical nonce value for the request.
- Do not cache HTML after nonce substitution unless the cache varies per
  generated nonce, which usually defeats the point. Cache templates before
  substitution instead. This example sends `Cache-Control: no-store` so its
  substituted responses are not reused by browsers or shared caches.
- Do not serve pre-compressed HTML through the replacement location. Do not
  enable `gzip_static` for this HTML; if an upstream sends compressed HTML,
  arrange for nginx to receive an uncompressed body before substitution.
- Remove the demo `X-CSP-Nonce` response header in production. Browsers do not
  need it; it is only useful while testing with tools such as `curl`.
- Avoid broad bypasses such as `'unsafe-inline'` for scripts. They weaken the
  practical value of a nonce-based CSP.
- Ensure every inline `<script>` or `<style>` element that is intended to run has
  the matching nonce attribute for that response.
- A nonce does not authorize inline event-handler attributes such as `onclick`,
  `style` attributes, or `javascript:` URLs. It applies only to `<script>` and
  `<style>` elements.
- Do not rely on Shannon entropy over the encoded text as the sole safety check.
  Base64 text has a theoretical maximum of 6 bits per character; values near
  that are expected for random bytes, but the important property is fresh
  cryptographically secure randomness before encoding.
- Unpadded Base64 is fine for this example because CSP nonce checks are strict
  string matches between the policy and the element attribute. Browsers do not
  need to decode the nonce value; they only need both strings to be identical.
- Protect njs files like nginx configuration. njs code is trusted server-side
  code loaded through `js_import`.
- Start with `Content-Security-Policy-Report-Only` when adapting this to an
  existing site, then move to enforcing mode after reviewing violations.

## Sampling nonces

Print 1000 sample nonces:

```sh
njs generate_nonce.js
```

Print a different count:

```sh
njs generate_nonce.js 10000
```
