import { AnyMessageContent, proto } from "@adiwajshing/baileys";
import { Subject } from "rxjs";

export class WhatsappService {

    receivedMessages$ = new Subject<{ fromMe: boolean, jid: string, message: string }>();
    sendMessage$ = new Subject<{ jid: string, message: AnyMessageContent }>();

    messageRecieved(msg: proto.IWebMessageInfo) {
        const message = {
            fromMe: msg.key.fromMe,
            jid: msg.key.remoteJid,
            message: msg.message.conversation
        };
        console.log(message);
        this.receivedMessages$.next(message);
    }
}