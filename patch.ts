import { readFileSync, writeFileSync } from 'fs';

// 1. GoalSetterPage
let p1 = readFileSync('src/features/goal/pages/GoalSetterPage.tsx', 'utf8');
p1 = p1.replace(
  'const [customCarbs, setCustomCarbs] = useState<number | null>(null);',
  'const [customCarbs, setCustomCarbs] = useState<number | null>(null);\n  const [customFiber, setCustomFiber] = useState<number | null>(null);'
);
p1 = p1.replace(
  'setCustomCarbs(data.carbs_target ?? 0);',
  'setCustomCarbs(data.carbs_target ?? 0);\n        setCustomFiber(data.fiber_target ?? 20);'
);
p1 = p1.replace(
  'carbs_target: customCarbs || null,',
  'carbs_target: customCarbs || null,\n        fiber_target: customFiber || null,'
);
p1 = p1.replace(
  'const carbsStr = customCarbs ? String(customCarbs) : \'\';',
  'const carbsStr = customCarbs ? String(customCarbs) : \'\';\n    const fiberStr = customFiber ? String(customFiber) : \'\';'
);
writeFileSync('src/features/goal/pages/GoalSetterPage.tsx', p1);

// 2. MealLoggerPage
let p2 = readFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', 'utf8');
p2 = p2.replace(/eatenFiberer/g, 'eatenFiber');
p2 = p2.replace(
  'const fiberPct = fiberTarget ? Math.min(eatenFiber / fiberTarget, 1) : 0;',
  'const fiberPct = fiberTarget ? Math.min(eatenFiber / fiberTarget, 1) : 0;'
); // just a check, but we fixed the naming issue
writeFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', p2);

// 3. useCalculatedProfile
let p3 = readFileSync('src/shared/hooks/useCalculatedProfile.ts', 'utf8');
p3 = p3.replace(
  'function useCalculatedProfile(profileData: DbProfile | null, macroOverrides?: { carbs_target?: number; fat_target?: number; water_target?: number; }) {',
  'function useCalculatedProfile(profileData: DbProfile | null, macroOverrides?: { carbs_target?: number; fat_target?: number; water_target?: number; fiber_target?: number; }) {'
);
writeFileSync('src/shared/hooks/useCalculatedProfile.ts', p3);

// 4. useLongPress
let p4 = readFileSync('src/shared/hooks/useLongPress.ts', 'utf8');
p4 = p4.replace(
  'timeout.current = setTimeout(() => {\n                onLongPress(event);\n                setLongPressTriggered(true);\n            }, delay);',
  'timeout.current = setTimeout(() => {\n                onLongPress(event as any);\n                setLongPressTriggered(true);\n            }, delay);'
);
p4 = p4.replace(
  'onContextMenu: (e: any) => {\n            e.preventDefault();\n            onLongPress(e);\n        }',
  'onContextMenu: (e: any) => {\n            e.preventDefault();\n            onLongPress(e as any);\n        }'
);
writeFileSync('src/shared/hooks/useLongPress.ts', p4);

