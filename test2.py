state = {"carbs_target": 100}
overrides = {"carbs_target": None, "water_target": 2.5}
state.update(overrides)
print(state)
