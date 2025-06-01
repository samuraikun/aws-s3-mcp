# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2025-06-01

### Added

- **HTTP Transport Support**: StreamableHTTP with Server-Sent Events for web clients
- **Transport Abstraction Layer**: Factory pattern supporting STDIO, HTTP, and SSE protocols
- **Application Class**: Centralized configuration management and transport orchestration
- **Session Management**: Stateful HTTP sessions with proper MCP protocol compliance
- **Enhanced CLI Arguments**: Support for `--stdio`, `--http`, and auto-detection
- **HTTP Mock Utilities**: Bridge between Hono framework and Node.js streams
- **Comprehensive Test Suite**: Integration tests for HTTP server and SSE endpoints
- **CLAUDE.md**: Development guidance for Claude Code with architecture documentation

### Changed

- **Entry Point**: Refactored from direct server creation to Application-based architecture
- **Transport Selection**: Runtime transport factory selection instead of hardcoded STDIO
- **Docker Configuration**: Updated entrypoint for modular architecture support
- **README Documentation**: Enhanced with transport features and deployment options
- **run-inspector.sh**: Added Docker support with transport-specific debugging options
- **Server Version**: Updated to 0.4.0 to reflect major architectural changes

### Fixed

- **CI Test Failures**: Resolved HTTP server integration test issues with proper session initialization
- **Import Organization**: Fixed Biome linting compliance for import statements
- **SSE Endpoint Tests**: Fixed crypto import for Node.js compatibility
- **Accept Headers**: Ensured StreamableHTTPServerTransport compatibility
- **Docker Compose**: Removed .env.local requirement for simplified setup

### Dependencies

- **Added**: @hono/node-server, hono for HTTP transport
- **Updated**: @modelcontextprotocol/sdk to latest version for StreamableHTTP support

## [0.3.0] - 2025-04-29

### Added

- Docker support with Dockerfile and docker-compose configuration
- GitHub Actions workflow for Docker build, test, scan, and publish
- Enhanced run-inspector.sh with Docker Compose and CLI support
- Added Docker setup instructions for running the S3 MCP server

### Changed

- Updated README with badges and improved documentation
- Improved GitHub workflow configurations

## [0.2.5] - 2025-04-10

### Changed

- chore(deps): update @modelcontextprotocol/sdk to version 1.9.0

## [0.2.4] - 2025-04-05

### Changed

- Merge pull request #1 from samuraikun/dependabot/npm_and_yarn/vite-6.2.4
- Updated vite dependency to version 6.2.4

## [0.2.3] - 2025-03-25

### Changed

- chore: update README.md & .npmignore
- Improved documentation
- Updated .npmignore to exclude unnecessary files from npm package

## [0.2.2] - 2025-03-20

### Fixed

- fix: update GitHub Actions permissions for release creation
- Fixed CI/CD pipeline permissions for automated releases

## [0.2.1] - 2025-03-15

### Changed

- Release version 0.2.1
- Minor improvements and bug fixes

## [0.2.0] - 2025-03-15

### Added

- Initial development setup
- Command-line interface with `--help` and `--version` flags
- Improved server startup messages with configuration display
- Updated README with npm publishing instructions

## [0.1.0] - 2025-03-15

### Added

- Core functionality for AWS S3 MCP Server
- Basic file operations (read, list, get_object)
- PDF parsing support
- Integration with Model Context Protocol
- Unit tests for core functionality
- CI: add test workflow

[Unreleased]: https://github.com/samuraikun/aws-s3-mcp/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/samuraikun/aws-s3-mcp/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/samuraikun/aws-s3-mcp/compare/v0.2.5...v0.3.0
[0.2.5]: https://github.com/samuraikun/aws-s3-mcp/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/samuraikun/aws-s3-mcp/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/samuraikun/aws-s3-mcp/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/samuraikun/aws-s3-mcp/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/samuraikun/aws-s3-mcp/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/samuraikun/aws-s3-mcp/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/samuraikun/aws-s3-mcp/releases/tag/v0.1.0
