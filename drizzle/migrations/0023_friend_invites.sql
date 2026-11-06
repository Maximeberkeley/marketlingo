CREATE OR REPLACE FUNCTION public.get_invite_preview(p_code text)
RETURNS TABLE(first_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT split_part(coalesce(nullif(trim(p.display_name), ''), 'A friend'), ' ', 1), p.avatar_url
  FROM public.profiles p
  WHERE p.friend_code = upper(trim(p_code)) AND length(trim(p_code)) BETWEEN 4 AND 12
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_invite_preview(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_preview(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.accept_invite(p_code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_me uuid := auth.uid();
  v_owner uuid;
  v_name text;
  v_row public.friendships%ROWTYPE;
  v_status text;
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  SELECT id, coalesce(nullif(trim(display_name), ''), 'Your friend') INTO v_owner, v_name
  FROM public.profiles WHERE friend_code = upper(trim(p_code)) LIMIT 1;
  IF v_owner IS NULL THEN RETURN jsonb_build_object('status', 'invalid'); END IF;
  IF v_owner = v_me THEN RETURN jsonb_build_object('status', 'own_code'); END IF;

  SELECT * INTO v_row FROM public.friendships
  WHERE (user_id = v_me AND friend_id = v_owner) OR (user_id = v_owner AND friend_id = v_me)
  LIMIT 1;

  IF v_row.id IS NULL THEN
    INSERT INTO public.friendships (user_id, friend_id, status)
    VALUES (v_owner, v_me, 'accepted') RETURNING * INTO v_row;
    v_status := 'connected';
  ELSIF v_row.status <> 'accepted' THEN
    UPDATE public.friendships SET status = 'accepted', updated_at = now()
    WHERE id = v_row.id RETURNING * INTO v_row;
    v_status := 'connected';
  ELSE
    v_status := 'already';
  END IF;

  RETURN jsonb_build_object('status', v_status, 'friendship_id', v_row.id, 'name', v_name);
END;
$$;
REVOKE ALL ON FUNCTION public.accept_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_invite(text) TO authenticated;