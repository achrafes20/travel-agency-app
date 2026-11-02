import {createHmac} from "node:crypto";
import {readFileSync} from "node:fs";
const secret=process.env.PAYMENT_WEBHOOK_SECRET;
if(!secret)throw new Error("Exporter PAYMENT_WEBHOOK_SECRET ; aucune valeur par défaut dans cet utilitaire.");
const body=readFileSync(process.argv[2]||0);
console.log(JSON.stringify({"X-Atlas-Signature":createHmac("sha256",secret).update(body).digest("hex"),"X-Atlas-Timestamp":String(Math.floor(Date.now()/1000))},null,2));

