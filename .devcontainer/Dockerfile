# https://mcr.microsoft.com/en-us/product/devcontainers/typescript-node/about
FROM mcr.microsoft.com/devcontainers/typescript-node:4.0-24-trixie

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

RUN npm i -g @openai/codex
