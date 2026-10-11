"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";

/** Server actions redirect with ?ok=… or ?err=…; show it as a toast and clean the URL. */
export default function FlashToast() {
  const params = useSearchParams();
  const path = usePathname();
  const router = useRouter();
  const shown = useRef("");

  useEffect(() => {
    const ok = params.get("ok"), err = params.get("err");
    const msg = ok ?? err;
    if (!msg || shown.current === `${path}|${msg}`) return;
    shown.current = `${path}|${msg}`;
    notifications.show(
      ok
        ? { color: "teal", title: "Done", message: ok, icon: <IconCheck size={18} />, autoClose: 4000 }
        : { color: "red", title: "Something went wrong", message: err!, icon: <IconAlertCircle size={18} />, autoClose: 7000 },
    );
    const rest = new URLSearchParams(params.toString());
    rest.delete("ok"); rest.delete("err");
    router.replace(rest.size ? `${path}?${rest}` : path, { scroll: false });
  }, [params, path, router]);

  return null;
}
