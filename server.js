const WebSocket = require("ws");
const Server = WebSocket.Server;
const Geoip = require("geoip-lite");
const Url = require("url");
const port = process.env.PORT || 2424;

const wss = new Server({ port });

let channelStates = {};

wss.on("connection", (ws, req) => {
  ws.upgradeReq = req;
  var clientID = req.headers["sec-websocket-key"];
  console.log("+++ New connection: ", clientID);
  console.log(`connection url: ${req.url}`);
  var params = Url.parse(req.url, true).query;
  console.log("params", params);
  // console.log(params.channel.length);
  if (!params || !params.channel) {
    ws.close();
  }

  console.log(wss.clients.size, "clients");

  ws.channel = params.channel;

  if (!channelStates[ws.channel]) {
    // IF CHANNEL_ID UNREGISTERED, FIRST CONNECTION IS SPEAKER
    // SOURCE OF TRUTH
    ws.role = "speaker"; //default
    channelStates[ws.channel] = new Array(15).fill({ s: false, p: false });
  } else {
    // WHAT IF SPEAKER WENT AWAY?
    let consoles = 0;
    let speakers = 0;
    wss.clients.forEach((client) => {
      if (client.channel === ws.channel) {
        // ONLY DO STATS ON CLIENTS WITH SAME CHANNEL ID
        if (client.role === "speaker") {
          speakers++;
        } else if (client.role === "console") {
          consoles++;
        }
      }
    });
    console.log("speakers", speakers);
    console.log("consoles", consoles);
    if (speakers === 0) {
      ws.role = "speaker";
    } else {
      ws.role = "console"; //default
    }
  }

  console.log("---ROLE---", ws.role);

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const geo = Geoip.lookup(ip);
  console.log("GEO IP", geo, ip);

  let data = {
    cmd: "state",
    state: channelStates[ws.channel]
  };

  announce(ws.channel, data);

  ws.on("message", (msg) => {
    var clientID = ws.upgradeReq.headers["sec-websocket-key"];
    let data = {};
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.error(e);
    }
    if (!data) {
      return;
    }

    console.log(
      ":::",
      clientID,
      ws.channel,
      ws.role,
      data,
      wss.clients.size + " clients"
    );

    if (!data.cmd) {
      console.log("!!!!!! BYE");
      process.exit(0);
    }

    switch (data.cmd) {
      case "tap":
        let prev_s = channelStates[ws.channel][data.slide - 1].s;
        let prev_p = channelStates[ws.channel][data.slide - 1].p;
        let next_s = ws.role === "speaker" ? !prev_s : prev_s;
        let next_p = ws.role === "console" ? !prev_p : prev_p;
        let newSlide = { s: next_s, p: next_p };
        channelStates[ws.channel] = new Array(15).fill({ s: false, p: false });
        channelStates[ws.channel][data.slide - 1] = newSlide;
        let newData = {
          cmd: "state",
          state: channelStates[ws.channel]
        };
        announce(ws.channel, newData);
        break;
      case "ping": // DO NOTHING
        break;
    }
  });

  ws.on("close", () => {
    console.log("xxx Closing");
    let peers = 0;
    wss.clients.forEach((client) => {
      if (client.channel === ws.channel) {
        peers++;
      }
    });
    if (peers < 1) {
      delete channelStates[ws.channel];
    }
    console.log(channelStates);
  });
});

function announce(channel, data) {
  console.log("*** announcing ***");
  wss.clients.forEach((client) => {
    if (client.channel === channel && client.readyState === WebSocket.OPEN) {
      console.log("--> Channel ID: ", client.channel);
      data.role = client.role;
      client.send(JSON.stringify(data));
    }
  });
}
