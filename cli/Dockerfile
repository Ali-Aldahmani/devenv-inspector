# devenv-inspector-cli
# Provides a ready-to-run environment with Python + Node.js + the CLI pre-installed.
# Note: commands inspect packages inside this container, not your host machine.

FROM node:20-slim

# Install Python 3 + pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    bash \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Use bash as the shell (zsh is not available in slim images)
ENV SHELL=/bin/bash

# Install the CLI globally from npm
RUN npm install -g devenv-inspector-cli

ENTRYPOINT ["devenv"]
CMD ["--help"]
