import { Input, Node, NodeDefinition, Output } from "@ada/lib";
import { WhatsappService } from "./whatsapp-service";

@Node({
    name: 'Whatsapp Node',
    identifier: '75ddcc57-0b59-45a3-9dad-81e14aade57d',
    description: 'Whatsapp integration node'
})
export class WhatsappNode {



    constructor(definition: NodeDefinition, private waService: WhatsappService) {
        waService.receivedMessages$.subscribe(msg => {
            if (msg.fromMe) this.messageSent(msg);
            if (!msg.fromMe) this.messageRecieved(msg);
        })
    }

    @Output({
        name: 'Message sent'
    })
    messageSent: (data: any) => void;

    @Output({
        name: 'Message received'
    })
    messageRecieved: (data: any) => void;


    @Input({
        name: 'Send Message'
    })
    sendMessage(data: any) {
        if (data['jid'] && data['message']) {
            this.waService.sendMessage$.next({
                jid: data['jid'],
                message: data['message']
            })
        } else {
            console.log('Unknown', typeof data, data)
        }
    }

}