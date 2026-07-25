import re

with open('src/features/profile/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

if "import { useCallback } from" not in content and "useCallback" not in content:
    content = content.replace("import { useState } from 'react';", "import { useState, useCallback } from 'react';")

old_openEdit = """  const openEdit = () => {
    if (profile) {
      updateDraftProfile({
        name: profile.name || "",
        age: profile.age?.toString() || "",
        weight: profile.current_weight_kg?.toString() || "",
        height: profile.height_cm?.toString() || "",
        gender: (profile.gender as any) || "",
        activity: profile.activity_level || ""
      });
    }
    setEditOpen(true);
    setEditState('summary');
    setConfirmed(false);
  };"""

new_openEdit = """  const openEdit = useCallback(() => {
    if (profile) {
      updateDraftProfile({
        name: profile.name || "",
        age: profile.age?.toString() || "",
        weight: profile.current_weight_kg?.toString() || "",
        height: profile.height_cm?.toString() || "",
        gender: (profile.gender as any) || "",
        activity: profile.activity_level || ""
      });
    }
    setEditOpen(true);
    setEditState('summary');
    setConfirmed(false);
  }, [profile, updateDraftProfile, setEditOpen, setEditState]);"""

old_handleSave = """  const handleSave = () => {
    setLoading(true);
    updateProfileMutation.mutate({
      name: draftProfile.name,
      age: parseInt(draftProfile.age) || undefined,
      current_weight_kg: parseFloat(draftProfile.weight) || undefined,
      height_cm: parseFloat(draftProfile.height) || undefined,
      gender: draftProfile.gender as any,
      activity_level: draftProfile.activity
    });
  };"""

new_handleSave = """  const handleSave = useCallback(() => {
    setLoading(true);
    updateProfileMutation.mutate({
      name: draftProfile.name,
      age: parseInt(draftProfile.age) || undefined,
      current_weight_kg: parseFloat(draftProfile.weight) || undefined,
      height_cm: parseFloat(draftProfile.height) || undefined,
      gender: draftProfile.gender as any,
      activity_level: draftProfile.activity
    });
  }, [draftProfile, updateProfileMutation]);"""

old_handleReset = """  const handleReset = async () => {
    setLoading(true);
    try {
      await profileService.resetOnboarding();
      setEditOpen(false);
      setEditState('summary');
      queryClient.clear(); // Clear all data
      navigate('/onboarding', { replace: true });
    } catch (e) {
      console.error('Failed to reset', e);
      setLoading(false);
    }
  };"""

new_handleReset = """  const handleReset = useCallback(async () => {
    setLoading(true);
    try {
      await profileService.resetOnboarding();
      setEditOpen(false);
      setEditState('summary');
      queryClient.clear(); // Clear all data
      navigate('/onboarding', { replace: true });
    } catch (e) {
      console.error('Failed to reset', e);
      setLoading(false);
    }
  }, [setEditOpen, setEditState, queryClient, navigate]);"""

content = content.replace(old_openEdit, new_openEdit)
content = content.replace(old_handleSave, new_handleSave)
content = content.replace(old_handleReset, new_handleReset)

with open('src/features/profile/pages/ProfilePage.tsx', 'w') as f:
    f.write(content)
