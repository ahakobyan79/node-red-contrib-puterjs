const axios = require('axios');

module.exports = function(RED) {
    function PuterJSNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Store the credentials
        this.username = this.credentials.username;
        this.password = this.credentials.password;

        // Function to make authenticated API calls
        async function makeApiCall(endpoint, method, data) {
            try {
                const response = await axios({
                    method: method,
                    url: `https://api.puter.com/v1${endpoint}`,
                    auth: {
                        username: node.username,
                        password: node.password
                    },
                    data: data
                });
                return response.data;
            } catch (error) {
                throw error;
            }
        }

        node.on('input', async function(msg) {
            const action = config.action;
            const params = msg.payload;

            try {
                switch(action) {
                    case 'writeFile':
                        msg.payload = await makeApiCall('/fs/write', 'POST', {
                            path: params.filename,
                            content: params.content
                        });
                        break;
                    case 'readFile':
                        msg.payload = await makeApiCall(`/fs/read?path=${params.filename}`, 'GET');
                        break;
                    case 'setKV':
                        msg.payload = await makeApiCall('/kv/set', 'POST', {
                            key: params.key,
                            value: params.value
                        });
                        break;
                    case 'getKV':
                        msg.payload = await makeApiCall(`/kv/get?key=${params.key}`, 'GET');
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