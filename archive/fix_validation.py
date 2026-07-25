import re

with open("src/features/progress/pages/ProgressPage.tsx", "r") as f:
    content = f.read()

old_handleLog = """  const handleLog = (isUpdate = false) => {
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

new_handleLog = """  const handleLog = (isUpdate = false) => {
    setErrorMsg('');
    const val = parseFloat(weight);
    if (!val) return;

    if (!isUpdate && hasLoggedToday) {
      setErrorMsg("You've already logged your weight today. If you entered the wrong weight, use the 'Update Today's Weight' option to edit it.");
      return;
    }

    const previousLogs = weightLogs.filter((l: any) => !l.date.startsWith(todayPrefix));
    if (previousLogs.length > 0) {
      const lastWeight = previousLogs[previousLogs.length - 1].weight;
      const diff = Math.abs(val - lastWeight);
      if (diff > 5) {
        setErrorMsg(`A weight change of ${diff.toFixed(1)} kg is not realistically possible. Please check your entry and try again.`);
        return;
      }
    }

    addWeightMutation.mutate(val);
  };"""

content = content.replace(old_handleLog, new_handleLog)

with open("src/features/progress/pages/ProgressPage.tsx", "w") as f:
    f.write(content)
