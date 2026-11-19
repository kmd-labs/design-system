/**
 * Generates optional `--docker` production Nginx SPA Dockerfile and VS Code Dev Container files.
 */
export function createDockerFiles({ appSlug, appTitle }) {
  return [
    [
      '.dockerignore',
      `node_modules
dist
.git
.angular
`
    ],
    [
      'nginx.conf',
      `server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \\.(js|css|svg|png|jpg|woff2|bin|gz)$ {
    expires 7d;
    add_header Cache-Control "public, immutable";
  }
}
`
    ],
    [
      'Dockerfile',
      `# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NG_CLI_ANALYTICS=false

COPY package*.json .npmrc ./
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; else npm install --legacy-peer-deps; fi

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/${appSlug}/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`
    ],
    [
      '.devcontainer/Dockerfile',
      `# syntax=docker/dockerfile:1
FROM node:22-bookworm

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \\
    git curl ca-certificates build-essential jq procps sudo chromium \\
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium

RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/node \\
    && chmod 0440 /etc/sudoers.d/node

RUN npm install -g @angular/cli

USER node
WORKDIR /workspace
EXPOSE 4200 9876
CMD ["/bin/bash"]
`
    ],
    [
      '.devcontainer/devcontainer.json',
      JSON.stringify(
        {
          name: `${appTitle} (Dev Container)`,
          build: { dockerfile: 'Dockerfile', context: '..' },
          workspaceFolder: '/workspace',
          forwardPorts: [4200, 9876],
          remoteUser: 'node',
          postCreateCommand:
            'git submodule update --init --recursive 2>/dev/null || true; [ -f package.json ] && npm install --legacy-peer-deps || true'
        },
        null,
        2
      ) + '\n'
    ]
  ];
}
