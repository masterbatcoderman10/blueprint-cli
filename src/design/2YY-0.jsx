// DESIGN REFERENCE — DO NOT EDIT BY HAND; regenerate via the Paper MCP fetch script if the artboard changes.
// Artboard: 2YY-0 — "Kanban — Board First with Task Detail"
// Source: blueprint-controls / Page 1
// Fetched: 2026-05-18
// Dimensions: 1440 × 900px
// Fonts: Space Grotesk, DM Sans, JetBrains Mono, System Sans-Serif

(
    <div style={{ backgroundColor: '#111110', boxSizing: 'border-box', display: 'flex', fontSize: '12px', fontSynthesis: 'none', lineHeight: '16px', MozOsxFontSmoothing: 'grayscale', overflow: 'clip', WebkitFontSmoothing: 'antialiased' }}>
      {/* Board Panel — 1160px wide */}
      <div style={{ backgroundColor: '#111110', boxSizing: 'border-box', display: 'flex', flexBasis: 'auto', flexDirection: 'column', flexGrow: '0', flexShrink: '0', height: '900px', overflow: 'clip', WebkitFontSmoothing: 'antialiased', width: '1160px' }}>
        {/* Header — project name, view toggle, stats, filters */}
        <div style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: '0', gap: '20px', height: '143px', paddingBlock: '20px', paddingInline: '32px', width: '1160px' }}>
          <div style={{ alignItems: 'flex-start', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', width: '1096px' }}>
            <div style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: '0', gap: '4px', width: '299px' }}>
              <div style={{ boxSizing: 'border-box', color: '#EDE9E3', display: 'inline-block', fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: '24px', fontWeight: 700, lineHeight: '30px' }}>
                blueprint-controls
              </div>
              <div style={{ boxSizing: 'border-box', color: '#6B6560', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '14px', lineHeight: '18px' }}>
                Operational source of truth for active projects
              </div>
            </div>
            {/* View toggle: Explorer / Kanban */}
            <div style={{ borderColor: '#333130', borderRadius: '6px', borderStyle: 'solid', borderWidth: '1px', boxSizing: 'border-box', display: 'flex', overflow: 'clip' }}>
              <div style={{ boxSizing: 'border-box', paddingBlock: '6px', paddingInline: '12px' }}>
                <div style={{ boxSizing: 'border-box', color: '#6B6560', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '13px', lineHeight: '16px' }}>
                  Explorer
                </div>
              </div>
              <div style={{ backgroundColor: '#282624', boxSizing: 'border-box', paddingBlock: '6px', paddingInline: '12px' }}>
                <div style={{ boxSizing: 'border-box', color: '#EDE9E3', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '13px', fontWeight: 500, lineHeight: '16px' }}>
                  Kanban
                </div>
              </div>
            </div>
          </div>
          {/* Stats row + filter dropdowns */}
          <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', width: '1096px' }}>
            <div style={{ alignItems: 'baseline', boxSizing: 'border-box', display: 'flex', gap: '24px' }}>
              <div style={{ alignItems: 'baseline', boxSizing: 'border-box', display: 'flex', gap: '6px' }}>
                <div style={{ boxSizing: 'border-box', color: '#EDE9E3', display: 'inline-block', fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: '16px', fontWeight: 700, lineHeight: '20px' }}>1</div>
                <div style={{ boxSizing: 'border-box', color: '#A39E96', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '12px', lineHeight: '16px' }}>milestone</div>
              </div>
              <div style={{ alignItems: 'baseline', boxSizing: 'border-box', display: 'flex', gap: '6px' }}>
                <div style={{ boxSizing: 'border-box', color: '#EDE9E3', display: 'inline-block', fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: '16px', fontWeight: 700, lineHeight: '20px' }}>1</div>
                <div style={{ boxSizing: 'border-box', color: '#A39E96', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '12px', lineHeight: '16px' }}>phase</div>
              </div>
              <div style={{ alignItems: 'baseline', boxSizing: 'border-box', display: 'flex', gap: '6px' }}>
                <div style={{ boxSizing: 'border-box', color: '#EDE9E3', display: 'inline-block', fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: '16px', fontWeight: 700, lineHeight: '20px' }}>6</div>
                <div style={{ boxSizing: 'border-box', color: '#A39E96', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '12px', lineHeight: '16px' }}>streams</div>
              </div>
            </div>
            <div style={{ boxSizing: 'border-box', display: 'flex', gap: '12px' }}>
              <div style={{ alignItems: 'center', borderColor: '#333130', borderRadius: '6px', borderStyle: 'solid', borderWidth: '1px', boxSizing: 'border-box', display: 'flex', gap: '8px', paddingBlock: '6px', paddingInline: '14px' }}>
                <div style={{ boxSizing: 'border-box', color: '#6B6560', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '11px', lineHeight: '14px' }}>Phase</div>
                <div style={{ boxSizing: 'border-box', color: '#EDE9E3', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '13px', fontWeight: 500, lineHeight: '16px' }}>M1 — Phase 2</div>
                <div style={{ boxSizing: 'border-box', color: '#6B6560', display: 'inline-block', fontFamily: 'system-ui, sans-serif', fontSize: '10px', lineHeight: '12px' }}>▾</div>
              </div>
              <div style={{ alignItems: 'center', borderColor: '#333130', borderRadius: '6px', borderStyle: 'solid', borderWidth: '1px', boxSizing: 'border-box', display: 'flex', gap: '8px', paddingBlock: '6px', paddingInline: '14px' }}>
                <div style={{ boxSizing: 'border-box', color: '#6B6560', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '11px', lineHeight: '14px' }}>Stream</div>
                <div style={{ boxSizing: 'border-box', color: '#EDE9E3', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '13px', fontWeight: 500, lineHeight: '16px' }}>All Streams</div>
                <div style={{ boxSizing: 'border-box', color: '#6B6560', display: 'inline-block', fontFamily: 'system-ui, sans-serif', fontSize: '10px', lineHeight: '12px' }}>▾</div>
              </div>
            </div>
          </div>
        </div>

        {/* Board — 5 columns: To Do | In Progress | In Review | Rework | Done */}
        <div style={{ boxSizing: 'border-box', display: 'flex', flexShrink: '0', gap: '16px', height: '757px', paddingInline: '32px', width: '1160px' }}>
          {/* Column: To Do (status-dot: #6B6560) */}
          <div style={{ boxSizing: 'border-box', display: 'flex', flexBasis: '0%', flexDirection: 'column', flexGrow: '1', flexShrink: '1', gap: '6px', minWidth: '0px', width: '216px' }}>
            <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', flexShrink: '0', height: '30px', justifyContent: 'space-between', width: '216px' }}>
              <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', gap: '8px' }}>
                <div style={{ backgroundColor: '#6B6560', borderRadius: '50%', boxSizing: 'border-box', flexShrink: '0', height: '8px', width: '8px' }} />
                <div style={{ boxSizing: 'border-box', color: '#EDE9E3', display: 'inline-block', fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, lineHeight: '16px' }}>To Do</div>
              </div>
              <div style={{ backgroundColor: '#282624', borderRadius: '4px', boxSizing: 'border-box', paddingBlock: '2px', paddingInline: '8px' }}>
                <div style={{ boxSizing: 'border-box', color: '#A39E96', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '14px', lineHeight: '18px' }}>4</div>
              </div>
            </div>
            {/* Task card */}
            <div style={{ backgroundColor: '#1E1D1B', borderColor: '#333130', borderRadius: '6px', borderStyle: 'solid', borderWidth: '1px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: '0', gap: '8px', height: '82px', paddingBlock: '10px', paddingInline: '10px', width: '216px' }}>
              <div style={{ boxSizing: 'border-box', color: '#EDE9E3', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '12px', lineHeight: '17px' }}>Build shared Kanban board, column, and task-card primitives</div>
              <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', gap: '6px' }}>
                <div style={{ backgroundColor: '#6B6560', borderRadius: '3px', boxSizing: 'border-box', paddingBlock: '2px', paddingInline: '4px' }}>
                  <div style={{ boxSizing: 'border-box', color: '#111110', display: 'inline-block', fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: '8px', fontWeight: 700, lineHeight: '10px', textTransform: 'uppercase' }}>Stream A</div>
                </div>
                <div style={{ boxSizing: 'border-box', color: '#A39E96', display: 'inline-block', fontFamily: '"JetBrains Mono", system-ui, sans-serif', fontSize: '10px', lineHeight: '12px' }}>A.1</div>
              </div>
            </div>
          </div>

          {/* Column: In Progress (status-dot: #F97316) */}
          <div style={{ boxSizing: 'border-box', display: 'flex', flexBasis: '0%', flexDirection: 'column', flexGrow: '1', flexShrink: '1', gap: '6px', minWidth: '0px', width: '216px' }}>
            <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', flexShrink: '0', height: '30px', justifyContent: 'space-between', width: '216px' }}>
              <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', gap: '8px' }}>
                <div style={{ backgroundColor: '#F97316', borderRadius: '50%', boxSizing: 'border-box', flexShrink: '0', height: '8px', width: '8px' }} />
                <div style={{ boxSizing: 'border-box', color: '#EDE9E3', display: 'inline-block', fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, lineHeight: '16px' }}>In Progress</div>
              </div>
              <div style={{ backgroundColor: '#282624', borderRadius: '4px', boxSizing: 'border-box', paddingBlock: '2px', paddingInline: '8px' }}>
                <div style={{ boxSizing: 'border-box', color: '#A39E96', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '14px', lineHeight: '18px' }}>2</div>
              </div>
            </div>
          </div>

          {/* Column: In Review (status-dot: #A78BFA) */}
          <div style={{ boxSizing: 'border-box', display: 'flex', flexBasis: '0%', flexDirection: 'column', flexGrow: '1', flexShrink: '1', gap: '6px', minWidth: '0px', width: '216px' }}>
            <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', flexShrink: '0', height: '30px', justifyContent: 'space-between', width: '216px' }}>
              <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', gap: '8px' }}>
                <div style={{ backgroundColor: '#A78BFA', borderRadius: '50%', boxSizing: 'border-box', flexShrink: '0', height: '8px', width: '8px' }} />
                <div style={{ boxSizing: 'border-box', color: '#EDE9E3', display: 'inline-block', fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, lineHeight: '16px' }}>In Review</div>
              </div>
              <div style={{ backgroundColor: '#282624', borderRadius: '4px', boxSizing: 'border-box', paddingBlock: '2px', paddingInline: '8px' }}>
                <div style={{ boxSizing: 'border-box', color: '#A39E96', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '14px', lineHeight: '18px' }}>1</div>
              </div>
            </div>
          </div>

          {/* Column: Rework (status-dot: #EC4899) */}
          <div style={{ boxSizing: 'border-box', display: 'flex', flexBasis: '0%', flexDirection: 'column', flexGrow: '1', flexShrink: '1', gap: '6px', minWidth: '0px', width: '216px' }}>
            <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', flexShrink: '0', height: '30px', justifyContent: 'space-between', width: '216px' }}>
              <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', gap: '8px' }}>
                <div style={{ backgroundColor: '#EC4899', borderRadius: '50%', boxSizing: 'border-box', flexShrink: '0', height: '8px', width: '8px' }} />
                <div style={{ boxSizing: 'border-box', color: '#EDE9E3', display: 'inline-block', fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, lineHeight: '16px' }}>Rework</div>
              </div>
              <div style={{ backgroundColor: '#282624', borderRadius: '4px', boxSizing: 'border-box', paddingBlock: '2px', paddingInline: '8px' }}>
                <div style={{ boxSizing: 'border-box', color: '#A39E96', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '14px', lineHeight: '18px' }}>0</div>
              </div>
            </div>
            <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', flexShrink: '0', height: '42px', justifyContent: 'center', width: '216px' }}>
              <div style={{ boxSizing: 'border-box', color: '#6B6560', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '12px', lineHeight: '16px', textAlign: 'center' }}>Review rejections land here</div>
            </div>
          </div>

          {/* Column: Done (status-dot: #22C55E) */}
          <div style={{ boxSizing: 'border-box', display: 'flex', flexBasis: '0%', flexDirection: 'column', flexGrow: '1', flexShrink: '1', gap: '6px', minWidth: '0px', width: '216px' }}>
            <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', flexShrink: '0', height: '30px', justifyContent: 'space-between', width: '216px' }}>
              <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', gap: '8px' }}>
                <div style={{ backgroundColor: '#22C55E', borderRadius: '50%', boxSizing: 'border-box', flexShrink: '0', height: '8px', width: '8px' }} />
                <div style={{ boxSizing: 'border-box', color: '#EDE9E3', display: 'inline-block', fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: '13px', fontWeight: 600, lineHeight: '16px' }}>Done</div>
              </div>
              <div style={{ backgroundColor: '#282624', borderRadius: '4px', boxSizing: 'border-box', paddingBlock: '2px', paddingInline: '8px' }}>
                <div style={{ boxSizing: 'border-box', color: '#A39E96', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '14px', lineHeight: '18px' }}>5</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Rail — 280px, closed by default */}
      <div style={{ backgroundColor: '#151413', borderLeftColor: '#333130', borderLeftStyle: 'solid', borderLeftWidth: '1px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: '0', gap: '20px', height: '900px', overflow: 'clip', padding: '20px', width: '280px' }}>
        {/* Status + title */}
        <div style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', gap: '6px' }}>
            <div style={{ backgroundColor: '#4ADE80', borderRadius: '50%', boxSizing: 'border-box', flexShrink: '0', height: '8px', width: '8px' }} />
            <div style={{ boxSizing: 'border-box', color: '#A8A29E', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.5px', lineHeight: '14px', textTransform: 'uppercase' }}>In Progress</div>
          </div>
          <div style={{ boxSizing: 'border-box', color: '#EDE9E3', display: 'inline-block', fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: '16px', fontWeight: 600, lineHeight: '22px' }}>
            Build shared Kanban board, column, and task-card primitives
          </div>
        </div>
        <div style={{ backgroundColor: '#333130', boxSizing: 'border-box', flexShrink: '0', height: '1px', width: '100%' }} />
        {/* Description */}
        <div style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: '0', gap: '12px' }}>
          <div style={{ boxSizing: 'border-box', color: '#A8A29E', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '12px', fontWeight: 500, letterSpacing: '0.5px', lineHeight: '16px', textTransform: 'uppercase' }}>Description</div>
          <div style={{ boxSizing: 'border-box', color: '#D7D3CD', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '13px', lineHeight: '20px' }}>
            Create reusable Kanban board primitives including column containers, drag handles, and task card components with consistent styling and interaction states.
          </div>
        </div>
        <div style={{ backgroundColor: '#333130', boxSizing: 'border-box', flexShrink: '0', height: '1px', width: '100%' }} />
        {/* Review comments */}
        <div style={{ boxSizing: 'border-box', display: 'flex', flexBasis: '0%', flexDirection: 'column', flexGrow: '1', flexShrink: '1', gap: '16px', overflow: 'clip' }}>
          <div style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: '0', gap: '10px' }}>
            <div style={{ boxSizing: 'border-box', color: '#A8A29E', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '12px', fontWeight: 500, letterSpacing: '0.5px', lineHeight: '16px', textTransform: 'uppercase' }}>Review Comments</div>
            <div style={{ boxSizing: 'border-box', display: 'flex', flexShrink: '0', gap: '6px' }}>
              {/* Major chip: bg #DC262626 border #DC26264D text #EF4444 */}
              <div style={{ alignItems: 'center', backgroundColor: '#DC262626', borderColor: '#DC26264D', borderRadius: '4px', borderStyle: 'solid', borderWidth: '1px', boxSizing: 'border-box', display: 'flex', height: '24px', justifyContent: 'center', paddingInline: '8px' }}>
                <div style={{ boxSizing: 'border-box', color: '#EF4444', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '10px', fontWeight: 600, lineHeight: '12px' }}>+ MAJOR</div>
              </div>
              {/* Minor chip: bg #F59E0B26 border #F59E0B4D text #F59E0B */}
              <div style={{ alignItems: 'center', backgroundColor: '#F59E0B26', borderColor: '#F59E0B4D', borderRadius: '4px', borderStyle: 'solid', borderWidth: '1px', boxSizing: 'border-box', display: 'flex', height: '24px', justifyContent: 'center', paddingInline: '8px' }}>
                <div style={{ boxSizing: 'border-box', color: '#F59E0B', display: 'inline-block', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '10px', fontWeight: 600, lineHeight: '12px' }}>+ MINOR</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
