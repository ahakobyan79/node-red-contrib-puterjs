module.exports = function(RED) {
    function PuterNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Example: AI chat interaction using Puter.js
        node.on('input', function(msg) {
            var inputText = msg.payload || "Hello, Puter.js";
            // Assuming Puter.js script is loaded separately or via config
            puter.ai.chat(inputText).then(function(response) {
                node.status({fill:"green",shape:"dot",text:"response received"});
                msg.payload = response;
                node.send(msg);
            }).catch(function(err) {
                node.status({fill:"red",shape:"ring",text:"error"});
                node.error("Error: " + err.toString(), msg);
            });
        });
    }
    RED.nodes.registerType("puterjs", PuterNode);
}
