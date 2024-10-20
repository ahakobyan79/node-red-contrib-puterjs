module.exports = function(RED) {
    function PuterJSNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // Load the Puter.js script
        const script = document.createElement('script');
        script.src = 'https://js.puter.com/v2/';
        document.head.appendChild(script);

        script.onload = function() {
            node.status({fill:"green", shape:"dot", text:"Puter.js loaded"});
        };

        script.onerror = function() {
            node.status({fill:"red", shape:"ring", text:"Failed to load Puter.js"});
        };

        node.on('input', function(msg) {
            const action = config.action;
            const params = msg.payload;

            if (action === 'authenticate') {
                puter.auth.signIn().then((res) => {
                    msg.payload = res;
                    node.send(msg);
                }).catch((error) => {
                    node.error("Authentication failed: " + error);
                });
            } else if (action === 'chat') {
                puter.ai.chat(params.prompt).then((response) => {
                    msg.payload = response;
                    node.send(msg);
                }).catch((error) => {
                    node.error("Chat failed: " + error);
                });
            } else if (action === 'writeFile') {
                puter.fs.write(params.filename, params.content).then((file) => {
                    msg.payload = file;
                    node.send(msg);
                }).catch((error) => {
                    node.error("File write failed: " + error);
                });
            } else if (action === 'readFile') {
                puter.fs.read(params.filename).then(async (blob) => {
                    msg.payload = await blob.text();
                    node.send(msg);
                }).catch((error) => {
                    node.error("File read failed: " + error);
                });
            } else if (action === 'setKV') {
                puter.kv.set(params.key, params.value).then(() => {
                    msg.payload = { success: true };
                    node.send(msg);
                }).catch((error) => {
                    node.error("KV set failed: " + error);
                });
            } else if (action === 'getKV') {
                puter.kv.get(params.key).then((value) => {
                    msg.payload = value;
                    node.send(msg);
                }).catch((error) => {
                    node.error("KV get failed: " + error);
                });
            } else {
                node.error("Unknown action: " + action);
            }
        });
    }
    RED.nodes.registerType("puterjs", PuterJSNode);
}