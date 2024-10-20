module.exports = function(RED) {
    function PuterJSNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // Store the credentials
        this.username = this.credentials.username;
        this.password = this.credentials.password;

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

        // Store authentication status
        let isAuthenticated = false;

        async function authenticate() {
            try {
                // Here, we would use the username and password to authenticate
                // However, Puter.js doesn't seem to have a direct method for this
                // We might need to simulate a login or use a different API
                await puter.auth.signIn();
                isAuthenticated = true;
                node.status({fill:"green", shape:"dot", text:"Authenticated"});
            } catch (error) {
                node.error("Authentication failed: " + error.message);
                node.status({fill:"red", shape:"ring", text:"Auth failed"});
                throw error;
            }
        }

        node.on('input', async function(msg) {
            const action = config.action;
            const params = msg.payload;

            try {
                if (!isAuthenticated) {
                    await authenticate();
                }

                switch(action) {
                    case 'write':
                        msg.payload = await puter.fs.write(params.path, params.content);
                        break;
                    case 'read':
                        const blob = await puter.fs.read(params.path);
                        msg.payload = await blob.text();
                        break;
                    case 'mkdir':
                        msg.payload = await puter.fs.mkdir(params.path);
                        break;
                    case 'readdir':
                        msg.payload = await puter.fs.readdir(params.path);
                        break;
                    case 'rename':
                        msg.payload = await puter.fs.rename(params.path, params.newName);
                        break;
                    case 'delete':
                        msg.payload = await puter.fs.delete(params.path);
                        break;
                    case 'setKV':
                        msg.payload = await puter.kv.set(params.key, params.value);
                        break;
                    case 'getKV':
                        msg.payload = await puter.kv.get(params.key);
                        break;
                    case 'chat':
                        msg.payload = await puter.ai.chat(params.prompt);
                        break;
                    default:
                        throw new Error("Unknown action: " + action);
                }
                node.send(msg);
                node.status({fill:"green", shape:"dot", text:"Success"});
            } catch (error) {
                node.error(error.message);
                node.status({fill:"red", shape:"ring", text: error.message});
            }
        });
    }

    RED.nodes.registerType("puterjs", PuterJSNode, {
        credentials: {
            username: {type: "text"},
            password: {type: "password"}
        }
    });
}