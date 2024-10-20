const axios = require('axios');

module.exports = function(RED) {
    function PuterJSNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Store the credentials
        this.username = this.credentials.username;
        this.password = this.credentials.password;

        // Store authentication token
        let authToken = null;

        async function authenticate() {
            try {
                const response = await axios.post('https://api.puter.com/v1/auth/login', {
                    username: node.username,
                    password: node.password
                });
                authToken = response.data.token;
                node.status({fill:"green", shape:"dot", text:"Authenticated"});
            } catch (error) {
                node.error("Authentication failed: " + error.message);
                node.status({fill:"red", shape:"ring", text:"Auth failed"});
                throw error;
            }
        }

        async function makeApiCall(endpoint, method, data) {
            if (!authToken) {
                await authenticate();
            }
            try {
                const response = await axios({
                    method: method,
                    url: `https://api.puter.com/v1${endpoint}`,
                    headers: { 'Authorization': `Bearer ${authToken}` },
                    data: data
                });
                return response.data;
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    // Token might be expired, try to authenticate again
                    await authenticate();
                    return makeApiCall(endpoint, method, data);
                }
                throw error;
            }
        }

        node.on('input', async function(msg) {
            const action = config.action;
            const params = msg.payload;

            try {
                switch(action) {
                    case 'write':
                        msg.payload = await makeApiCall('/fs/write', 'POST', {
                            path: params.path,
                            content: params.content
                        });
                        break;
                    case 'read':
                        msg.payload = await makeApiCall(`/fs/read?path=${params.path}`, 'GET');
                        break;
                    case 'mkdir':
                        msg.payload = await makeApiCall('/fs/mkdir', 'POST', {
                            path: params.path
                        });
                        break;
                    case 'readdir':
                        msg.payload = await makeApiCall(`/fs/readdir?path=${params.path}`, 'GET');
                        break;
                    case 'rename':
                        msg.payload = await makeApiCall('/fs/rename', 'POST', {
                            path: params.path,
                            newName: params.newName
                        });
                        break;
                    case 'delete':
                        msg.payload = await makeApiCall(`/fs/delete?path=${params.path}`, 'DELETE');
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