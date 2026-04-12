# https://mcr.microsoft.com/en-us/product/devcontainers/typescript-node/about
FROM mcr.microsoft.com/devcontainers/typescript-node:4.0-24-trixie

ARG SUPABASE_CLI_VERSION=2.84.2

RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt \
    apt-get update && \
    apt-get install -y \
        sudo \
        locales \
        net-tools \
        iputils-ping \
        dnsutils \
        bash-completion \
        less \
        curl \
        wget \
        tar \
        xz-utils \
        unzip \
        make \
        gcc \
        git \
        vim \
        tmux \
        jq \
        fzf \
        groff \
        procps \
        default-mysql-client \
        postgresql-client \
        bubblewrap

RUN echo 'ja_JP.UTF-8 UTF-8' >> /etc/locale.gen && \
    locale-gen && \
    update-locale LANG=ja_JP.UTF-8
RUN ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime

# https://github.com/supabase/cli/releases
RUN arch="$(dpkg --print-architecture)" && \
    case "$arch" in \
        amd64) supabase_arch='amd64' ;; \
        arm64) supabase_arch='arm64' ;; \
        *) echo "Unsupported architecture: $arch" >&2; exit 1 ;; \
    esac && \
    curl -fsSL "https://github.com/supabase/cli/releases/download/v${SUPABASE_CLI_VERSION}/supabase_linux_${supabase_arch}.tar.gz" \
        -o /tmp/supabase.tar.gz && \
    tar -xzf /tmp/supabase.tar.gz -C /tmp && \
    install -m 0755 /tmp/supabase /usr/local/bin/supabase && \
    rm -f /tmp/supabase.tar.gz /tmp/supabase

RUN npm i -g @openai/codex
