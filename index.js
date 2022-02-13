const { WebSocketServer } = require('ws');

const waitingResponse = []
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', async function connection(ws) {
    ws.on('message', function processMessage(msg) {
        // console.log('received: %s', msg);
        try {
            let data = JSON.parse(msg);

            if (data.hasOwnProperty("requestId")) {
                const request = waitingResponse[data.requestId]
                if (request)
                    request.resolve(data)
                else
                    console.log("wait res not found request id: ", data)
            } else {
                console.log("without request id: ", data);
            }
        }catch(e) {
            console.log('received message error: ', msg);
        }
    })

    try {
        const {request, result} = await sendPayload({ "data": 'something', "requestId": "1234" })
        console.log("websocket req: ", request, " res: ", result)
    } catch (e) {
        console.log("websocket send error: ", e)
    }

    async function sendPayload(details) {
        const request = waitingResponse[details.requestId] = { sent: +new Date() };

        try {
            ws.send(JSON.stringify(details));

            const result = await new Promise(function (resolve, reject) {
                request.resolve = resolve;

                setTimeout(() => {
                    reject(new Error('Timeout'));
                }, 5000);
            });
            console.log("websocket req to res time took", (+new Date() - request.sent) / 1000);

            return {request: request, result: result};
        } finally {
            delete waitingResponse[details.requestId];
        }
    }
});

