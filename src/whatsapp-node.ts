import {Deconstruct, Input, Node, NodeDefinition, Output} from "@zwisler/ada-lib";
import {WhatsappService} from "./whatsapp-service";
import {Subscription} from "rxjs";

@Node({
    name: 'Whatsapp Node',
    identifier: '75ddcc57-0b59-45a3-9dad-81e14aade57d',
    description: 'Whatsapp integration node'
})
export class WhatsappNode {

    private subscription: Subscription

    constructor(definition: NodeDefinition, private waService: WhatsappService) {
        this.subscription = waService.receivedMessages$.subscribe(msg => {
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

    @Deconstruct()
    deconstruct() {
        if (this.subscription) this.subscription.unsubscribe();
    }

}