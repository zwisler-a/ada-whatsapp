import makeWASocket, { AnyMessageContent, delay, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, makeInMemoryStore, useMultiFileAuthState } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { WhatsappService } from './whatsapp-service'

const logger = require('pino')()

logger.info('hello world')

const useStore = !process.argv.includes('--no-store')
const doReplies = !process.argv.includes('--no-reply')

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = useStore ? makeInMemoryStore({ logger }) : undefined
store?.readFromFile(process.env.STORE_PATH ?? './baileys_store_multi.json')
// save every 10s
setInterval(() => {
    store?.writeToFile(process.env.STORE_PATH ?? './baileys_store_multi.json')
}, 10_000)

// start a connection
const startSock = async (waService: WhatsappService) => {
    const { state, saveCreds } = await useMultiFileAuthState(process.env.AUTH_PATH ?? 'baileys_auth_info')
    // fetch latest version of WA Web
    const { version, isLatest } = await fetchLatestBaileysVersion()
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            /** caching makes the store faster to send/recv messages */
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: true,
        // ignore all broadcast messages -- to receive the same
        // comment the line below out
        // shouldIgnoreJid: jid => isJidBroadcast(jid),
        // implement to handle retries
        getMessage: async key => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid!, key.id!)
                return msg?.message || undefined
            }

            // only if store is present
            return {
                conversation: 'hello'
            }
        }
    })

    store?.bind(sock.ev)

    const sendMessageWTyping = async (msg: AnyMessageContent, jid: string) => {
        console.log('sending', jid, msg);
        await sock.presenceSubscribe(jid)
        await delay(500)

        await sock.sendPresenceUpdate('composing', jid)
        await delay(2000)

        await sock.sendPresenceUpdate('paused', jid)

        await sock.sendMessage(jid, msg)
        await sock.sendPresenceUpdate('unavailable', jid)

    }

    waService.sendMessage$.subscribe(msg => sendMessageWTyping(msg.message, msg.jid))

    // the process function lets you process all events that just occurred
    // efficiently in a batch
    sock.ev.process(
        // events is a map for event name => event data
        async (events) => {
            // something about the connection changed
            // maybe it closed, or we received all offline message or connection opened
            if (events['connection.update']) {
                const update = events['connection.update']
                const { connection, lastDisconnect } = update
                if (connection === 'close') {
                    // reconnect if not logged out
                    if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
                        startSock(waService)
                    } else {
                        console.log('Connection closed. You are logged out.')
                    }
                }
            }

            // credentials updated -- save them
            if (events['creds.update']) {
                await saveCreds()
            }

            if (events['messages.upsert']) {
                const upsert = events['messages.upsert']
                console.log('recv messages')

                if (upsert.type === 'notify') {
                    for (const msg of upsert.messages) {
                        waService.messageRecieved(msg);
                    }
                }
            }

        }
    )

    return sock
}

export { startSock }
