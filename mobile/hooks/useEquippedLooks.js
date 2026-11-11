import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { lookFromJson } from "../lib/shopEconomy";
const cache = /* @__PURE__ */ new Map();
function useEquippedLooks(userIds) {
  const ids = Array.from(new Set(userIds.filter((id) => !!id))).sort();
  const key = ids.join(",");
  const [looks, setLooks] = useState(() => Object.fromEntries(ids.filter((id) => cache.has(id)).map((id) => [id, cache.get(id)])));
  useEffect(() => {
    if (!ids.length) return;
    let live = true;
    supabase.rpc("get_equipped_looks", { p_user_ids: ids }).then(({ data, error }) => {
      if (!live || error || !Array.isArray(data)) return;
      const next = {};
      for (const r of data) {
        const entry = { look: lookFromJson(r.look), wearsCrown: !!r.wears_crown };
        cache.set(r.user_id, entry);
        next[r.user_id] = entry;
      }
      setLooks(next);
    }, () => {
    });
    return () => {
      live = false;
    };
  }, [key]);
  return looks;
}
export {
  useEquippedLooks
};
