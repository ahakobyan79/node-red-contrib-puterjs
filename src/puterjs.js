module.exports = function(RED) {
    const axios = require('axios');

    function PuterNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Retrieve the Puter.js configuration from the Node-RED UI
        this.prompt = config.prompt;
        this.model = config.model || 'gpt-4o-mini'; // default model

        // Functionality when a message arrives at the input of the node
        node.on('input', async function(msg) {
            const prompt = this.prompt || msg.payload;

            try {
                // Example: Call Puter.js AI chat API
                const response = await axios.post('https://js.puter.com/v2/', {
                    prompt: prompt,
                    model: this.model
                });

                msg.payload = response.data;
                node.send(msg);  // Send the output to the next node
            } catch (error) {
                node.error("Error calling Puter.js API: " + error.message);
            }
        });
    }

    // Register the node type with Node-RED
    RED.nodes.registerType("puterjs", PuterNode);
}
