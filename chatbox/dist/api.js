var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// package/api.ts
var api_exports = {};
__export(api_exports, {
  default: () => createChatBoxAPI
});
module.exports = __toCommonJS(api_exports);
var import_redis = require("@upstash/redis");
function createChatBoxAPI(options) {
  const redis = import_redis.Redis.fromEnv();
  const domain = process.env.DOMAIN;
  return async function(req, res) {
    const method = req.method;
    const api = req.query.chatbox[0];
    const chatId = req.query.chatbox[1];
    try {
      if (!chatId)
        throw new Error("Missing chatId");
      switch (api) {
        case "chat":
          switch (method) {
            case "GET":
              const data = await redis.lrange(chatId, 0, 2 ** 32 - 1);
              return res.status(200).json({ chatData: data });
            case "POST":
              const { text } = JSON.parse(req.body);
              const response = await redis.rpush(chatId, text);
              return res.status(200).json({ response });
            default:
              throw new Error("Method not allowed");
          }
        case "slack":
          switch (method) {
            case "POST":
              const text = `New chat with id: ${domain}/chats/${chatId}`;
              const requests = options.webhooks.map(async (webhook) => {
                return fetch(webhook, {
                  method: "POST",
                  body: JSON.stringify({ text }),
                  headers: { "Content-Type": "application/json" }
                });
              });
              await Promise.all(requests);
              return res.status(200).json({ response: "ok" });
            default:
              throw new Error("Method not allowed");
          }
        default:
          throw new Error("Method not allowed");
      }
    } catch (err) {
      let message = err;
      if (err instanceof TypeError) {
        message = err.message;
      }
      return res.status(500).json({ message });
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
