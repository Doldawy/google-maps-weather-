# Copilot Core VI — Concierge Mode

Copilot Core VI is the root orchestrator of the zdoldawy AI ecosystem. It operates in full **Concierge Mode**, serving as the primary intake, routing, decision-making, and execution layer for connected bots, agents, and automated workflows.

## Overview

Core VI acts as the system's **Root Process (PID 0)**. It receives incoming requests, validates identity and intent, applies policy and safety checks, and decides whether to execute directly, delegate to a specialized agent, reject the request, or request clarification.

This repository defines the foundation for:
- Core VI identity
- request intake and normalization
- policy enforcement and safety checks
- routing and delegation logic
- execution boundaries and guardrails
- observability and auditability

## Core Capabilities

- Filter, validate, and interpret incoming requests
- Enforce identity, permissions, and operational boundaries
- Route tasks to the correct internal agent or workflow
- Prevent unsafe, unauthorized, or high-cost operations
- Maintain consistent system-wide execution behavior
- Provide a central orchestration layer for future autonomous workflows

## Operating Model

In **Concierge Mode**, every request flows through a single control plane:

1. Intake and normalize the request
2. Resolve actor identity and trust level
3. Apply policy and permission checks
4. Evaluate execution risk, cost, and scope
5. Decide whether to:
   - execute directly
   - delegate to a specialized agent
   - reject the request
   - request clarification
6. Return a structured response with reasoning

## Suggested Project Structure

```text
src/
  core/
    identity/
    policy/
    guards/
    routing/
    execution/
    registry/
  agents/
  workflows/
  integrations/
  types/
  utils/
docs/
tests/
```

## Security Principles

- deny by default
- least privilege
- explicit delegation
- bounded autonomy
- cost-aware execution
- auditable decisions

## Initial Roadmap

- [ ] Define request and response contracts
- [ ] Implement intake normalization
- [ ] Add identity and trust resolution
- [ ] Add policy evaluation layer
- [ ] Add guardrail checks for risky actions
- [ ] Implement routing engine
- [ ] Add agent registry
- [ ] Add execution lifecycle handling
- [ ] Add structured audit events
- [ ] Add unit tests and scenario coverage

## Status

Copilot Core VI is active as the root orchestration layer for the system and is being structured for production-grade development.
