import re
import os

def fix_file(filepath, var_name):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find start
    old_start = f"<AnimatePresence>\n        {{{var_name} && createPortal("
    new_start = f"{{typeof document !== 'undefined' && createPortal(\n        <AnimatePresence>\n          {{{var_name} && ("
    
    if old_start in content:
        content = content.replace(old_start, new_start)
    else:
        print(f"Could not find start in {filepath}")
    
    # Find end
    old_end = f"          </motion.div>\n        ), document.body)}}\n      </AnimatePresence>"
    new_end = f"          </motion.div>\n          )}}\n        </AnimatePresence>,\n        document.body\n      )}}"

    if old_end in content:
        content = content.replace(old_end, new_end)
    else:
        # alternate end
        old_end_2 = f"            </motion.div>\n          </motion.div>\n        ), document.body)}}\n      </AnimatePresence>"
        new_end_2 = f"            </motion.div>\n          </motion.div>\n          )}}\n        </AnimatePresence>,\n        document.body\n      )}}"
        if old_end_2 in content:
            content = content.replace(old_end_2, new_end_2)
        else:
            print(f"Could not find end in {filepath}")
            
            # another attempt for end
            old_end_3 = f"              </motion.div>\n            </motion.div>\n        ), document.body)}}\n        </AnimatePresence>"
            new_end_3 = f"              </motion.div>\n            </motion.div>\n          )}}\n        </AnimatePresence>,\n        document.body\n      )}}"
            if old_end_3 in content:
                content = content.replace(old_end_3, new_end_3)

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Fixed {filepath}")

fix_file('src/features/awards/pages/AwardsPage.tsx', 'selectedAward')
fix_file('src/features/goal/pages/GoalSetterPage.tsx', 'resetGoalConfirm')
fix_file('src/features/profile/pages/ProfilePage.tsx', 'showResetModal')

