FROM denoland/deno:debian-2.2.9

# The port that your MCP server might need (if any)
EXPOSE 3000

WORKDIR /app

# Add deno user for better security
# deno:deno with UID:GID = 1993:1993 is already set up in the base image

# Create and set deno directory permissions
ENV DENO_DIR=/app/.deno-dir
ENV DENO_INSTALL_ROOT=/usr/local

# Prepare directories with proper permissions (as root first)
RUN mkdir -p ${DENO_DIR} && \
    mkdir -p /app/node_modules && \
    mkdir -p /app/node_modules/.deno && \
    touch /app/deno.lock && \
    chown -R deno:deno /app && \
    chown -R deno:deno ${DENO_DIR} && \
    chown -R deno:deno /app/node_modules

# Copy dependency management files
COPY --chown=deno:deno deno.json deno.lock* ./

# Copy all source and test files
COPY --chown=deno:deno src/ ./src/
COPY --chown=deno:deno test/ ./test/

# Switch to deno user for security
USER deno

# Cache dependencies but don't fail if there's an issue
RUN deno cache src/index.ts || echo "Cache step completed with warnings"

# Command to run the server with necessary permissions
# Allow network for AWS S3 API, env for configuration, file system read access, and system info
ENTRYPOINT ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-sys"]
CMD ["src/index.ts"]
