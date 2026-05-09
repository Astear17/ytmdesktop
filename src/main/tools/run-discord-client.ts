import DiscordClient from "../integrations/discord-presence/minimal-discord-client/index.ts";

(async () => {
  const client = new DiscordClient("1143202598460076053");
  client.on("connect", () => {
    console.log("connected");
    client.setActivity({ type: 2, status_display_type: 1, details: "TS Test", state: "Artist", instance: false });
    setTimeout(() => {
      client.clearActivity();
      client.destroy();
      process.exit(0);
    }, 2000);
  });
  client.on("close", () => {
    console.log("closed");
  });
  await client.connect().catch((e: unknown) => {
    console.error("connect failed", e);
    process.exit(1);
  });
})();
