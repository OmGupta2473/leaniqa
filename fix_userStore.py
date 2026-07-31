import re

with open('src/features/profile/store/userStore.ts', 'r') as f:
    content = f.read()

old_interface = """  profileEditState: 'summary' | 'form' | 'reset';
  setProfileEditState: (state: 'summary' | 'form' | 'reset') => void;

  clearUserStore: () => void;
}"""

new_interface = """  profileEditState: 'summary' | 'form' | 'reset';
  setProfileEditState: (state: 'summary' | 'form' | 'reset') => void;

  macroOverrides?: {
    carbs_target?: number | null;
    fat_target?: number | null;
    water_target?: number | null;
  };
  setMacroOverrides: (overrides: { carbs_target?: number | null, fat_target?: number | null, water_target?: number | null }) => void;

  clearUserStore: () => void;
}"""

content = content.replace(old_interface, new_interface)

old_impl = """      profileEditState: 'summary',
      setProfileEditState: (profileEditState) => set({ profileEditState }),

      clearUserStore: () => set({ """

new_impl = """      profileEditState: 'summary',
      setProfileEditState: (profileEditState) => set({ profileEditState }),

      macroOverrides: {},
      setMacroOverrides: (overrides) => set((state) => ({ macroOverrides: { ...state.macroOverrides, ...overrides } })),

      clearUserStore: () => set({ """

content = content.replace(old_impl, new_impl)

with open('src/features/profile/store/userStore.ts', 'w') as f:
    f.write(content)

