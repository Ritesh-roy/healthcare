import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRealtimeTables(tables: string[], queryKeys?: unknown[][]) {
  const queryClient = useQueryClient();
  const tableKey = tables.join(",");

  useEffect(() => {
    const uniqueTables = Array.from(new Set(tables));
    const channel = supabase.channel(`live-data-${uniqueTables.join("-")}-${Math.random().toString(36).slice(2)}`);

    uniqueTables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          const keys = queryKeys?.length ? queryKeys : uniqueTables.map((name) => [name]);
          keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
        },
      );
    });

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, tableKey]);
}