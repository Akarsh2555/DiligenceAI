---
version: 1.0
name: DiligenceAI-Hybrid-Design
description: A hybrid enterprise AI interface combining Claude's warm editorial readability (cream canvases, slab-serif typography) with Cohere's data-rich enterprise dashboard aesthetic (deep green-black product bands, pill-shaped taxonomy chips, rounded media cards). This system is specifically designed for a Due Diligence platform where users read long-form legal text but interact with high-density data agents.

colors:
  primary: "#cc785c" # Claude Coral for primary CTAs and voltage
  primary-active: "#a9583e"
  ink: "#141413" # Claude warm ink for readable text
  deep-green: "#003c33" # Cohere Enterprise Green for dark agent bands
  dark-navy: "#071829" # Cohere Navy for data dashboards
  canvas: "#faf9f5" # Claude Tinted Cream (vital for long-form reading)
  soft-stone: "#eeece7" # Cohere soft stone for neutral feature cards
  surface-dark: "#181715"
  hairline: "#e6dfd8"
  muted: "#6c6a64"
  action-blue: "#1863dc" # Cohere Action Blue for editorial links
  success: "#5db872"
  warning: "#d4a017"
  error: "#b30000"
  on-primary: "#ffffff"
  on-dark: "#faf9f5"

typography:
  display-xl:
    fontFamily: "Copernicus, Tiempos Headline, serif" # Claude's editorial slab-serif
    fontSize: 64px
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: -1.5px
  section-display:
    fontFamily: "Unica77, Inter, sans-serif" # Cohere's structured sans
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -1px
  title-lg:
    fontFamily: "Unica77, Inter, sans-serif"
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.3
  body-md:
    fontFamily: "Unica77, Inter, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  button:
    fontFamily: "Unica77, Inter, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.71
  mono-label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 14px
    fontWeight: 400
    letterSpacing: 0.28px
  caption:
    fontFamily: "Unica77, Inter, sans-serif"
    fontSize: 13px
    fontWeight: 500

rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 22px # Cohere's signature media card radius
  xl: 30px
  pill: 9999px # Cohere's pill buttons

spacing:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}" # Claude Coral
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}" # Cohere Pill Shape
    padding: 12px 24px
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 12px 24px
    border: 1px solid {colors.ink}
  agent-console-card:
    backgroundColor: "{colors.dark-navy}" # Cohere Navy Dashboard
    textColor: "{colors.on-dark}"
    rounded: "{rounded.lg}"
    padding: 32px
  editorial-document-card:
    backgroundColor: "{colors.canvas}" # Claude Cream Document
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 48px
    border: 1px solid {colors.hairline}
  risk-taxonomy-chip:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.mono-label}"
    rounded: "{rounded.sm}"
    padding: 8px 14px
  research-table:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    borderBottom: 1px solid {colors.hairline}
---

## Overview: The Best of Both Worlds
For **DiligenceAI**, we are merging the **editorial trust of Claude** with the **enterprise data-density of Cohere**. 

Because analysts have to read 20-page generated reports, the base page MUST use Claude's **Warm Cream Canvas** (`#faf9f5`) and **Slab-Serif Headlines** (Copernicus). This reduces eye-strain and makes the AI output feel like a bespoke financial publication rather than a sterile SaaS dashboard.

However, because the system is powered by 4 independent AI agents (Risk, Growth, Legal, Web), the data visualization and agent interactions MUST use Cohere's **Deep Navy/Green Product Bands** and **Pill-shaped Taxonomy Chips**. This provides the "Command Center" feel required for high-density enterprise software.

## Key Design Decisions:
1. **Backgrounds:** The primary app background is Claude's warm cream. However, the "Agent Analysis" section drops into a full-width Cohere Deep Navy (`#071829`) band to visually communicate that the AI is "doing heavy lifting."
2. **CTAs:** We use Cohere's heavily rounded pill shapes (`32px`) for buttons, but we paint them with Claude's signature warm Coral (`#cc785c`).
3. **Typography:** We use Claude's Slab-Serif for the large H1/H2 document titles (creating an editorial feel), but we use Cohere's crisp, almost monospaced Unica77/Inter for the actual data tables and risk matrices.
4. **Data Cards:** The generated Executive Summary sits on a flat, shadowless cream card with a hairline border (Claude style), while the Risk/Growth metrics sit in distinct Soft Stone (`#eeece7`) cards with larger 22px border radii (Cohere style).
