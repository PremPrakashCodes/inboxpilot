exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app: "InboxPilot",
      status: "running",
      message: "InboxPilot is live",
    }),
  };
};
