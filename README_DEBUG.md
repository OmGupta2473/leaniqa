# Debugging 500 Error

If you are seeing a "Server error" or 500 from the `parse-meal` function, it is likely because the Gemini API key is missing in your Supabase project's secrets. 

To fix this:
1. Open your terminal or command prompt.
2. Run this command to set the secret in your Supabase project:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_actual_api_key_here --project-ref your_project_ref
   ```
3. You can find your project ref in your Supabase dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`
