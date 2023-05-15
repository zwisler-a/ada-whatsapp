import { AnyMessageContent, proto } from "@whiskeysockets/baileys";
import { Subject } from "rxjs";

export class WhatsappService {

    receivedMessages$ = new Subject<{ fromMe: boolean, jid: string, message: string }>();
    sendMessage$ = new Subject<{ jid: string, message: AnyMessageContent }>();

    messageRecieved(msg: proto.IWebMessageInfo) {
        const message = {
            fromMe: msg.key.fromMe,
            jid: msg.key.remoteJid,
            message: this.extractText(msg)
        };
        console.log(message);
        this.receivedMessages$.next(message);
    }

    private extractText(msg: proto.IWebMessageInfo): string {
        return msg.message.conversation || msg.message.extendedTextMessage.text
    }
}