import { PluginClient, Layout } from "flipper-plugin";
import { WebSocket } from "ws";

type Events = {
  test: any;
  event: any;
  start: any;
};

type Methods = {
  message(payload: { type: string }): Promise<any>;
};

export function plugin(client: PluginClient<Events, Methods>) {

  const wss = new WebSocket.Server({ port: 8189 });

  wss.on("connection", (ws) => {
    console.log("Inspector iFrame socket connected ", ws);

    // This is the RN app getting loaded or reloaded
    client.onMessage("start", (event) => {
      console.log(
        "Got a start message from RN app. Need to start the inspector"
      );
      try {
        if (client.isConnected) {
          client.send("message", { type: "xstate.inspecting" });
        } else {
          console.log("Not sending start event because we are not connected");
        }
      } catch (e) {
        console.error("Failed to start the inspector: ", e);
      }
    });

    client.onMessage("event", (event) => {
      let data = JSON.stringify(event);
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    });

    ws.on("message", (data) => {
      if (client.isConnected) {
        client.send("message", JSON.parse(data));
      } else {
        console.log(
          "Not sending event from inspector because we are not connected"
        );
      }
    });
  });

  console.log(`starting wss ${wss}`, wss);

  client.onConnect(async () => {
    console.log("Client connected.");
  });

  client.onDisconnect(() => {
    console.log("Client disconnected. closing the websocket server");
    wss.close();
  });

  return {};
}

export function Component() {
  return (
    <Layout.Container rounded={false} grow={true}>
      <iframe
        width="100%"
        height="100%"
        src="https://statecharts.io/inspect?server=localhost:8189"
      />
    </Layout.Container>
  );
}
