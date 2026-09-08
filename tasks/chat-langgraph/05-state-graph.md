# Task 05: HITL policy + StateGraph

**Phase:** 1  
**Depends on:** 04  
**Blocks:** 06

## Description

Implement `hitl.policy.ts`, state annotations, nodes (agent, hitl_gate, tools, finalize), compile graph with recursion_limit.

## Acceptance criteria

- [ ] Mutating vs read-only lists match design
- [ ] Interrupt path when HITL on
- [ ] recursion_limit applied
- [ ] No unbounded while loop

## How to test

Unit test policy; graph smoke with mocked LLM if feasible.
