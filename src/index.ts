import { ProxyHelper, setup } from "@zwisler/ada-lib";
import { startSock } from "./whatsapp";
import { WhatsappNode } from "./whatsapp-node";
import { WhatsappService } from "./whatsapp-service";

async function main() {
    const waService = new WhatsappService();
    const nodeDef = ProxyHelper.create(WhatsappNode, waService);
    const service = await setup({
        amqpUrl: process.env.AMQP_URL
    });
    startSock(waService);
    service.register([nodeDef], 'whatsapp-connector', 'Whatsapp Connector', 'WA')
}
main();

//startSock();