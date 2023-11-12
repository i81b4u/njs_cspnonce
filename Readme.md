Just some snippets to test nginx with njs so it generates a nonce that is added as a http response header.

1. Install nginx and njs from nginx repository;
2. Add load_module modules/ngx_http_js_module.so; to nginx.conf;
3. Create /etc/nginx/njs/getnonce.js with contents like in the example;
4. Create /etc/nginx/conf.d/noncetest.conf with contents like in the example;
5. (re)start nginx (sudo systemctl restart nginx.service);
6. test with curl -I http://localhost:8080
