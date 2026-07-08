import re

with open("src/features/progress/pages/ProgressPage.tsx", "r") as f:
    content = f.read()

# Add errorMsg state
imports = """export function ProgressPage() {
  const [weight, setWeight] = useState('');"""
new_imports = """export function ProgressPage() {
  const [weight, setWeight] = useState('');
  const [errorMsg, setErrorMsg] = useState('');"""
content = content.replace(imports, new_imports)

# Update handleLog
old_handle = """  const handleLog = () => {
    const val = parseFloat(weight);
    if (!val) return;
    addWeightMutation.mutate(val);
  };"""

new_handle = """  const todayPrefix = getLocalDateString(new Date()).substring(0, 10);
  const hasLoggedToday = weightLogs.some((l: any) => l.date.startsWith(todayPrefix));

  const handleLog = (isUpdate = false) => {
    setErrorMsg('');
    const val = parseFloat(weight);
    if (!val) return;

    if (weightLogs.length > 0) {
      let previousLogs = weightLogs;
      if (isUpdate) {
        previousLogs = weightLogs.filter((l: any) => !l.date.startsWith(todayPrefix));
      }
      
      if (previousLogs.length > 0) {
        const lastWeight = previousLogs[previousLogs.length - 1].weight;
        const diff = Math.abs(val - lastWeight);
        if (diff > 5) {
          setErrorMsg(`A weight change of ${diff.toFixed(1)} kg is not realistically possible. Please check your entry and try again.`);
          return;
        }
      }
    }

    if (!isUpdate && hasLoggedToday) {
      setErrorMsg("You've already logged your weight today. If you entered the wrong weight, use the 'Update Today's Weight' option to edit it.");
      return;
    }

    addWeightMutation.mutate(val);
  };"""
content = content.replace(old_handle, new_handle)

# Add error message UI and update buttons
old_ui = """      <div className="mb-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <input 
            type="number" 
            value={weight} 
            onChange={(e) => setWeight(e.target.value)} 
            placeholder={`Weight e.g. ${currentWeight}kg`} 
            className="input-field"
            disabled={addWeightMutation.isPending}
          />
          <button 
            onClick={handleLog} 
            disabled={addWeightMutation.isPending} 
            className="disabled:opacity-50 tracking-widest text-[12px] uppercase"
            style={{ background: '#D4FF00', color: '#0A0A0A', fontWeight: 700, border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer' }}
          >
            {addWeightMutation.isPending ? '...' : 'Log'}
          </button>
        </div>"""

new_ui = """      <div className="mb-4 flex flex-col gap-3">
        {errorMsg && (
          <div className="p-3 bg-[rgba(255,45,85,0.1)] text-[#FF2D55] text-[12px] rounded-lg border border-[rgba(255,45,85,0.2)]">
            {errorMsg}
          </div>
        )}
        <div className="flex gap-2">
          <input 
            type="number" 
            value={weight} 
            onChange={(e) => {
              setWeight(e.target.value);
              setErrorMsg('');
            }} 
            placeholder={`Weight e.g. ${currentWeight}kg`} 
            className="input-field"
            disabled={addWeightMutation.isPending}
          />
          {!hasLoggedToday ? (
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
          )}
        </div>"""
content = content.replace(old_ui, new_ui)

with open("src/features/progress/pages/ProgressPage.tsx", "w") as f:
    f.write(content)
