import { json } from "@inboxpilot/core";

export const handler = async () => {
  return json(200, { status: "ok" });
};
