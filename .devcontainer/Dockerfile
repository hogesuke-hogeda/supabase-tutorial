# https://mcr.microsoft.com/en-us/product/devcontainers/typescript-node/about
FROM mcr.microsoft.com/devcontainers/typescript-node:4.0-24-trixie

ARG SUPABASE_CLI_VERSION=2.84.2
ARG TERRAFORM_VERSION=1.14.9

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

# https://releases.hashicorp.com/terraform/
RUN arch="$(dpkg --print-architecture)" && \
    case "$arch" in \
        amd64) terraform_arch='amd64' ;; \
        arm64) terraform_arch='arm64' ;; \
        *) echo "Unsupported architecture: $arch" >&2; exit 1 ;; \
    esac && \
    curl -fsSL "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_${terraform_arch}.zip" \
        -o /tmp/terraform.zip && \
    curl -fsSL "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_SHA256SUMS" \
        -o /tmp/terraform_SHA256SUMS && \
    grep " terraform_${TERRAFORM_VERSION}_linux_${terraform_arch}.zip$" /tmp/terraform_SHA256SUMS | \
        sed "s/ terraform_${TERRAFORM_VERSION}_linux_${terraform_arch}\\.zip$/ terraform.zip/" > /tmp/terraform_SHA256SUMS.filtered && \
    cd /tmp && sha256sum -c terraform_SHA256SUMS.filtered && \
    unzip /tmp/terraform.zip -d /tmp && \
    install -m 0755 /tmp/terraform /usr/local/bin/terraform && \
    rm -f /tmp/terraform.zip /tmp/terraform /tmp/terraform_SHA256SUMS /tmp/terraform_SHA256SUMS.filtered

RUN npm i -g @openai/codex
