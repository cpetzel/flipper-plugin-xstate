import React from "react";
import {
  PluginClient,
  usePlugin,
  createState,
  useValue,
  Layout,
} from "flipper-plugin";

type Data = {
  id: string;
  message?: string;
};

type Events = {
  newData: Data;
};

// Read more: https://fbflipper.com/docs/tutorial/js-custom#creating-a-first-plugin
// API: https://fbflipper.com/docs/extending/flipper-plugin#pluginclient
export function plugin(client: PluginClient<Events, {}>) {
  const data = createState<Record<string, Data>>({}, { persist: "data" });

  client.onMessage("test", (newData) => {
    // this will be an xstate message.
    // simply post it on the window
    console.log("Got message from client", window);
    // data.update((draft) => {
    //   draft[newData.url] = newData;
    // });
  });

  /* client.addMenuEntry({
    action: "clear",
    handler: async () => {
      data.set({});
    },
  }); */

  return { data };
}

class App extends React.Component {
  render() {
    return (
      <iframe width="100%" height="100%" src="https://stately.ai/viz?inspect" />
    );
  }
}

/**
 * TODO next steps to get the xstate viz in here... 
 * 
 * Xstate already provides 2 kind of inspectors... 
 * - window inspector - uses window messages from the parent
 * - socket inspector - the inspector listens to messages from a socket connection
 *    - I think via http://inspector.io/XXX?server=localhost:9898 (see https://github.com/statelyai/xstate/discussions/1430#discussioncomment-398304)
 * 
 * These don't work with flipper... but it should be easy to add them to flipper... 
 * TLDR - we are going to recreate "browser.js" but backed by a flipper plugin.
 * 
 * The data flow will be as follows...
 * 
 * RN app will need to create a new kind of receiver, that adheres to the [XStateDevInterface] interface
 * and slap it on the global JS instance. once we call "inspect()" on this new receiver (only on native)
 * then any new machine that is craeted with the devTools = true will be "registered" with this code. 
 * All events will then be sent over to flipper via messages. 
 * 
 * Then on the inspector side (flipper), I need to receive this message from the plugin, and then marshall it to the inspector.
 * 
 * ----Viz-----
 * To make sure this all works, simply render the new viz in a iframe src (https://stately.ai/viz?inspect), and create aproxy
 * Once this is rendering, It is probably waiting for window message events... 
 * So I need to setup a simple proxy that receives messages from RN ("xstate.event") and simply 
 * forwards them to the window as a message.
 * 
 * Might need to send it to the iframe
 * //document.getElementById('cross_domain_page').contentWindow.postMessage(.......)

 * 
 * --long term solution--
 * To get the viz to show up in flipper, I can fork this new viz (https://github.com/statelyai/xstate-viz)
 * and simply render it as a component. 

 * ---ALT---
 * I simply save the existing page as html/js, and create my proxy in this plugin repo (marshalling events)
 * 
 * The next thing to solve, is to marshal events the other way... 
 * ex. if I click on an event in the Viz, then I need to receive that event in my proxy code (probably as a window message?),
 *  and send it back to the client into RN where it hopefully gets sent the the client's inspector machine, to be delegated to the actual machines
 * 
 * Remove the login button,
 * remove the code tab
 * 
 */

// Read more: https://fbflipper.com/docs/tutorial/js-custom#building-a-user-interface-for-the-plugin
// API: https://fbflipper.com/docs/extending/flipper-plugin#react-hooks
export function Component() {
  const instance = usePlugin(plugin);
  const data = useValue(instance.data);

  return (
    <Layout.Container rounded={false} grow={true}>
      {/* {Object.entries(data).map(([id, d]) => (
        <pre key={id} data-testid={id}>
          {JSON.stringify(d)}
        </pre>
      ))} */}
      <App />
    </Layout.Container>
  );
}
