-- ============================================================
-- 005: release a partner/worker's profile when their link is deleted,
-- and stop exposing auth-only functions to anonymous callers.
-- Idempotent: safe to re-run.
-- ============================================================

-- ---------- Deleted partner/worker can join another business ----------
-- claim_invite refuses accounts whose profile is still 'partner'/'worker',
-- so reset the profile once the link that granted that role is gone.
CREATE OR REPLACE FUNCTION public.release_linked_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_role TEXT;
BEGIN
  IF TG_TABLE_NAME = 'b2b_partners' THEN
    v_user := OLD.partner_user_id;
    v_role := 'partner';
  ELSE
    v_user := OLD.worker_user_id;
    v_role := 'worker';
  END IF;

  IF v_user IS NOT NULL THEN
    UPDATE user_profiles
    SET role = 'roaster', linked_to = NULL
    WHERE user_id = v_user AND role = v_role AND linked_to = OLD.roaster_user_id;
  END IF;
  RETURN OLD;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.release_linked_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS release_linked_profile ON b2b_partners;
CREATE TRIGGER release_linked_profile
  AFTER DELETE ON b2b_partners
  FOR EACH ROW EXECUTE FUNCTION public.release_linked_profile();

DROP TRIGGER IF EXISTS release_linked_profile ON team_members;
CREATE TRIGGER release_linked_profile
  AFTER DELETE ON team_members
  FOR EACH ROW EXECUTE FUNCTION public.release_linked_profile();

-- ---------- Anonymous callers ----------
-- These all require a signed-in user; get_invite stays public because the
-- join page looks up a code before the account exists.
REVOKE EXECUTE ON FUNCTION public.claim_invite(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_roasting_order(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_my_worker_name(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_roasting_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_my_worker_name(TEXT) TO authenticated;
