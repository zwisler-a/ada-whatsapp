import { proto } from "@adiwajshing/baileys";
import { Subject } from "rxjs";

export class WhatsappService {

    receivedMessages$ = new Subject<{ fromMe: boolean, jid: string, message: string }>();
    sendMessage$ = new Subject<{ jid: string, message: string }>();

    messageRecieved(msg: proto.IWebMessageInfo) {
        this.receivedMessages$.next({
            fromMe: msg.key.fromMe,
            jid: msg.key.remoteJid,
            message: msg.message.conversation
        })
    }
}