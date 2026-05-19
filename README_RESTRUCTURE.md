# Blueprint README — Restructured Outline

## Structure (ordered top-to-bottom)

### 1. Header Block
- **Logo/Badge row**: NPM version, Node requirement, MIT license, GitHub stars
- **Headline**: One sentence. Problem + solution. Professional tone.
  - Current: "Vibe coding is the future. Shipping broken software isn't."
  - Direction: More direct. "Software engineering discipline for AI-aided development" or similar.
- **Subheading**: 2-3 sentences. What it does, for whom, why it matters.

### 2. CTA + Stats Row
- **Primary CTA button**: `npm install -g @splitwireml/blueprint`
- **Quick stats**: "Used in X projects" OR "Runs X phases" OR "Manages X+ tasks" — pick one real metric
- Minimal, clear. No fluff.

### 3. Screenshot
- Task tracker board in macOS frame
- Clean, minimal. Shows structure (columns: TO-DO, IN-PROGRESS, IN-REVIEW, DONE)
- Caption: "Task tracker keeps phases and streams visible."

### 4. Updates Section (NEW)
- Brief bulleted list of recent improvements or features shipped
- Max 4-5 bullets, 1 line each
- Links to release notes if available
- Rationale: Users land here first; they want to know "what's new?"

### 5. What is Blueprint? (SHORT)
- Replace the long "Why Blueprint" section
- 2-3 concrete paragraphs, NOT feature lists
- Lead with the problem Blueprint solves
- Example structure:
  - Para 1: Context (AI development is fast but risky)
  - Para 2: Blueprint's approach (concrete, one example)
  - Para 3: Outcome (what teams get)
- NO subsections. NO nested benefits lists.

### 6. How It Works (SIMPLIFIED)
- Current 8-step workflow compressed to **5-6 core steps**
- One-liner per step + visual step number
- Example:
  ```
  1. Plan your phase → Blueprint structures it (Gate + Streams)
  2. Execute a stream → Write test first, implement, move to review
  3. Review the work → Verify against spec, move to DONE
  4. Address notes → Fix issues, respond inline
  5. Close the phase → Full validation, surface regressions
  6. Ship → Merge to main
  ```
- NO long sub-explanations. Links to docs/ for details.

### 7. Quick Start (BRIEF TUTORIAL)
- `blueprint init` — what it scaffolds (one sentence)
- `blueprint doctor` — what it checks (one sentence)
- Example project init (3-4 lines)
- "For detailed guides, see [Getting Started](docs/getting-started.md)"
- Keep to <100 words total

### 8. Installation
- Node requirement, package, executable
- Standard npm install line
- That's it. No footnotes.

### 9. Commands Overview (TABLE)
- Simple table: Command | Purpose | Link to docs
- Not exhaustive. Main commands only.
- Example:
  | Command | Purpose |
  |---------|---------|
  | `init` | Scaffold Blueprint project |
  | `doctor` | Audit and repair project structure |

### 10. Footer
- Links: GitHub, Docs, Releases, Contributing
- "For deep dives, see [Comprehensive Guide](docs/guide.md)"

---

## Content Guidelines

### Tone
- Professional, direct, no hype
- Active voice. Concrete examples over abstract claims.
- Avoid: "empower," "seamless," "intuitive," "simply," "just," "basically"
- Use: "Write," "Move," "Verify," "Surface," "Track"

### Language patterns
- ✅ "Test fails, you implement, test passes." (concrete sequence)
- ❌ "Blueprint enables test-driven development at the task level." (abstract)
- ✅ "Scope changed? Blueprint updates your plan." (action + outcome)
- ❌ "Plans that survive reality through progressive refinement." (vague)

### Links, not details
- Any section longer than 3 sentences should link to `docs/` for full depth
- Example: "How It Works" links to `docs/workflows.md` or `docs/phase-planning.md`
- README is entry point; docs are deep dive

### What to CUT
- All subsections under benefits (What is Blueprint?, Why Blueprint, etc.)
- Long code block examples in README (link to docs for those)
- Testimonials, trust signaling, company logos
- Repetition between sections

---

## Content Ownership

**Opus subagent rewrites:**
- Header/subheading
- "What is Blueprint?" paragraph (2-3 sentences)
- "How It Works" (5-6 step summaries)
- "Quick Start" tutorial

**Existing content to reuse:**
- Installation (current README, lines 158-164)
- Commands overview (simplified version of current Commands section)
- Footer links

**New content to create:**
- Updates section (populate from recent releases)
- Stats line (one metric)
