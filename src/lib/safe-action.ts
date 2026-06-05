import { createSafeActionClient } from "next-safe-action";
import { createClient } from '@/utils/supabase/server';

export const actionClient = createSafeActionClient();

export const authActionClient = actionClient.use(async ({ next }) => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: You must be logged in to perform this action.");
  }

  return next({ ctx: { user, supabase } });
});
