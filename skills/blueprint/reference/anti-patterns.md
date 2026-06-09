# Anti-Patterns — Canonical Shape Specification

This document defines the canonical shape for all `<AntiPatterns>` blocks used across Blueprint reference modules. It is the single source of truth for anti-pattern block structure.

---

## Shape Definition

All `<AntiPatterns>` blocks use the unfenced canonical XML shape. The wrapper is `<AntiPatterns>` (never `<TweakAntiPatterns>` or other variants). Each `<AntiPattern>` element carries a bare `name="<short title>"` attribute with no `ANTI-PATTERN:` prefix. Required children are `<BadExample>` and `<Why>`. Optional children are `<GoodExample>` and domain-prefixed variants (`<Bad<Domain>Example>`, `<Good<Domain>Example>`, `<GoodSub<Domain>Example>`) when they aid illustration. The block is never wrapped in a ```xml fence.

---

## Exemplar

<AntiPatterns>
  <AntiPattern name="Short Title">
    <BadExample>Description of the forbidden behavior.</BadExample>
    <GoodExample>Description of the correct behavior. (Optional)</GoodExample>
    <Why>One-line explanation of why the bad behavior is forbidden.</Why>
  </AntiPattern>
</AntiPatterns>
