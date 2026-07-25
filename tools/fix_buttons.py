import re

with open("src/features/progress/pages/ProgressPage.tsx", "r") as f:
    content = f.read()

old_buttons = """          {!hasLoggedToday ? (
            <button 
              onClick={() => handleLog(false)} 
              disabled={addWeightMutation.isPending} 
              className="disabled:opacity-50 tracking-widest text-[12px] uppercase shrink-0"
              style={{ background: '#D4FF00', color: '#0A0A0A', fontWeight: 700, border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer' }}
            >
              {addWeightMutation.isPending ? '...' : 'Log'}
            </button>
          ) : (
            <button 
              onClick={() => handleLog(true)} 
              disabled={addWeightMutation.isPending} 
              className="disabled:opacity-50 tracking-widest text-[12px] uppercase shrink-0"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer' }}
            >
              {addWeightMutation.isPending ? '...' : "Update Today's Weight"}
            </button>
          )}"""

new_buttons = """          <button 
            onClick={() => handleLog(false)} 
            disabled={addWeightMutation.isPending} 
            className="disabled:opacity-50 tracking-widest text-[12px] uppercase shrink-0"
            style={{ background: '#D4FF00', color: '#0A0A0A', fontWeight: 700, border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer' }}
          >
            {addWeightMutation.isPending ? '...' : 'Log'}
          </button>
          {hasLoggedToday && (
            <button 
              onClick={() => handleLog(true)} 
              disabled={addWeightMutation.isPending} 
              className="disabled:opacity-50 tracking-widest text-[12px] uppercase shrink-0"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer' }}
            >
              {addWeightMutation.isPending ? '...' : "Update Today's Weight"}
            </button>
          )}"""

content = content.replace(old_buttons, new_buttons)

with open("src/features/progress/pages/ProgressPage.tsx", "w") as f:
    f.write(content)
