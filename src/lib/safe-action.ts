import { createSafeActionClient } from "next-safe-action";
import { createClient } from '@/utils/supabase/server';

// Actions throw user-facing messages (e.g. "No custom pricing set..."), so pass
// them through instead of the library's generic "Something went wrong".
export const actionClient = createSafeActionClient({
  handleServerError: (e) => {
    console.error("Action error:", e.message);
    return e.message;
  },
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: You must be logged in to perform this action.");
  }

  return next({ ctx: { user, supabase } });
});
