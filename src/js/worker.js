var Elm;
var elmApp;
var receiveMessagePortName;

module = typeof module === "undefined" ? {} : module;
setTimeout = typeof setTimeout === "undefined" ? function(callback) { return callback() } : setTimeout;

function sendMessage(message) {
  console.log("POSTM")
  self.postMessage(message);
}

self.onmessage = function(event) {
  var msg = event.data;
  console.log("worker got a msg");

  switch (msg.cmd) {
    case "INIT_WORKER":
      if (typeof elmApp === "undefined") {
        var config = JSON.parse(msg.data);

        try {
          importScripts(config.elmPath);

          receiveMessagePortName = config.receiveMessagePortName;

          Elm = typeof Elm === "undefined" ? module.exports : Elm;

          elmApp = Elm[config.elmModuleName].worker(config.args);

          elmApp.ports[config.sendMessagePortName].subscribe(sendMessages);
        } catch(err) {
          sendError("Error initializing Elm in worker: " + err);
        }
      } else {
        sendError("Worker attempted to initialize twice!");
      }

      break;

    case "SEND_TO_WORKER":
      if (typeof elmApp === "undefined") {
        sendError("Canot send() to a worker that has not yet been initialized!");
      }

      try {
        elmApp.ports[receiveMessagePortName].send({forWorker: true, workerId: null, data: msg.data});
      } catch (err) {
        sendError("Error attempting to send message to Elm Worker: " + err);
      }

      break;

    default:
      sendError("Unrecognized worker command: " + msg.cmd);
  }
};
