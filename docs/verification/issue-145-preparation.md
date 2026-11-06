# Issue145: farmer plot establishment

Started2026-11-06 by Codex on codex/farmer-plot-establishment, stacked from verified166 head09c2952. Merge order165->166->145; wait for actual predecessor merge/Pages before own merge. Reuse the existing ConstructionSystem sites, BuilderAI route/slot provider, shared progress and cancellations. Fields/orchards cost no goods and are established by Farmers of their canonical farmId, never by Builder or King. Existing harvest/cargo/Hold retain priority, planting precedes idle tending. Establishment grants Farming XP, not Construction, and growth starts only after completion. Schema32 validates farmer build tasks and zero-cost invested materials; no migration. Add C04 waiting reasons, real browser Save/Load mid-planting and resource/XP/cancellation regressions.

No145 implementation or validation claimed by this checkpoint.
