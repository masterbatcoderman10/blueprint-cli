# PRD Planning

This module defines how to author a Product Requirements Document (PRD).
A PRD is the highest-level planning document in Blueprint. It captures
the full product vision, target users, and feature roadmap organized
by milestones. It is non-technical.

---

<PRDPrinciples>
  A PRD answers THREE questions:
    1. What problem does this solve and for whom?
    2. What does the product do?
    3. How does it roll out?

  A PRD does NOT contain:
    - Technical implementation details (database schemas, API routes, frameworks)
    - Detailed user roles or permission matrices
    - Task breakdowns or phase-level planning
    - Open questions (those belong in project-progress.md)
    - References to other documents
    - An "Out of Scope" section — if a feature is not in any milestone,
      it is simply not in the product

  The PRD is written in product language, not engineering language.
  A non-technical stakeholder should be able to read it and understand
  the entire product.
</PRDPrinciples>

---

<PRDProcess>
  MVP DEFINITION:
    The MVP (Minimum Viable Product) is the point at which the product has
    achieved its primary key features and objectives — the core reason the
    product exists. It is not necessarily the first milestone. The MVP may
    span two, three, or more milestones. A milestone that only lays
    groundwork without fulfilling the product's central purpose is not
    the MVP boundary. The MVP boundary is placed after the milestone where
    a user would say "this does what it was built to do."

  DURING QUESTIONS:
    - Understand the problem before discussing features
    - Ask about rollout preference: does the user want a lean MVP
      with many milestones, or a larger MVP with fewer milestones?
    - Ask where the MVP boundary sits — after which milestone has
      the product achieved its primary objectives? Do not assume M1.
    - Do not suggest features — extract them from the user

  DURING DRAFTING:
    - Features are one-liner bullets, not paragraphs
    - If a feature needs a paragraph to explain, it is too detailed
      for the PRD — simplify to the user-facing outcome
    - Every feature must live under a milestone
    - Milestone names should be meaningful and descriptive,
      not generic labels like "Phase 2" or "Enhancements"

  WHEN UPDATING AN EXISTING PRD:
    - New capabilities that do not fit any existing milestone
      get a new milestone or are added to an appropriate existing one
    - Confirm with the user before adding a new milestone
    - Do not remove features without user confirmation
    - Update the milestone description if its scope has changed
</PRDProcess>

---

<PRDTemplate>

  # {{Product Name}} — Product Requirements Document

  ## Overview

  **Problem:** {{What pain or inefficiency exists today}}

  **Solution:** {{One paragraph — how this product solves the problem}}

  **Success Criteria:**
  - {{How do you know this product is working}}
  - {{Measurable or observable outcome}}

  ## Target Users

  {{Who uses this product. Describe the user segment — demographics,
  context, group size, behavior. Do not list roles or permissions.}}

  {{If there are meaningfully different user types, name them in plain
  language (e.g., "organizers and participants") without defining
  what each can or cannot do.}}

  ## Platform & Experience

  - **Primary platform:** {{mobile, desktop, both}}
  - **Access model:** {{open, invite-only, closed group}}
  - **Authentication:** {{product-level description, not technical}}
  - {{Any other non-technical experience constraints}}

  ## Milestones

  ### M1 — {{Meaningful Name}}
  > {{One sentence — what this milestone delivers and why it matters}}
  - {{Feature as user-facing outcome}}
  - {{Feature as user-facing outcome}}
  - {{Feature as user-facing outcome}}

  ### M2 — {{Meaningful Name}}
  > {{One sentence — what this milestone delivers and why it matters}}
  - {{Feature as user-facing outcome}}
  - {{Feature as user-facing outcome}}

  ---
  **MVP** — Primary product objectives achieved.

  ---

  ### M3 — {{Meaningful Name}}
  > {{One sentence — what this milestone delivers and why it matters}}
  - {{Feature as user-facing outcome}}
  - {{Feature as user-facing outcome}}

</PRDTemplate>

---

<PRDExample>
  The following is an example of a well-structured PRD.

  # MealBoard — Product Requirements Document

  ## Overview

  **Problem:** Home cooks accumulate recipes across bookmarks, screenshots,
  handwritten notes, and messaging apps. When it's time to plan the week's
  meals, there is no single place to browse what they know how to cook,
  plan what to make, and generate a shopping list from those plans.

  **Solution:** A mobile app that lets users collect recipes into a personal
  library, plan meals for the week, and automatically generate consolidated
  shopping lists from selected recipes.

  **Success Criteria:**
  - Users plan at least 3 meals per week using the app
  - Shopping list generation replaces manual list-making
  - Recipe lookup replaces scattered bookmarks and screenshots

  ## Target Users

  Home cooks who prepare meals regularly — typically adults managing
  household meals for themselves or a family. They already cook from
  recipes but lack a system to organize and plan around them.

  Some users are solo cooks managing their own meals. Others coordinate
  with a partner or household members who contribute to meal planning.

  ## Platform & Experience

  - **Primary platform:** Mobile-first, with a responsive web view
  - **Access model:** Personal accounts, with optional household sharing
  - **Authentication:** Email and password signup

  ## Milestones

  ### M1 — Recipe Collection
  > A personal recipe library that replaces scattered bookmarks and notes.
  - Save recipes manually with title, ingredients, steps, and tags
  - Import recipes from a URL with automatic parsing
  - Search and filter recipes by tag, ingredient, or name
  - Organize recipes into custom collections

  ### M2 — Meal Planning & Shopping
  > Turn a recipe library into a weekly meal plan with automated shopping lists.
  - Drag recipes onto a weekly calendar view
  - Generate a consolidated shopping list from planned meals
  - Adjust shopping list quantities based on serving size
  - Check off items while shopping

  ---
  **MVP** — Primary product objectives achieved.

  ---

  ### M3 — Household Sharing
  > Multiple household members can contribute to planning and shopping.
  - Invite household members to a shared recipe library
  - Collaborative meal calendar with visibility into who planned what
  - Shared shopping list with real-time sync
  - Personal recipe collections alongside shared ones

  ### M4 — Cooking Experience
  > A guided cooking mode that makes the app useful during meal preparation.
  - Step-by-step cooking view with large text and timers
  - Voice-controlled navigation between recipe steps
  - Scale recipe ingredients for different serving counts
  - Mark recipes as cooked to build a cooking history
</PRDExample>
