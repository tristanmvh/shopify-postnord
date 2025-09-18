import { DeliveryMethod } from "@shopify/shopify-api";
import { createWaybill } from "./postnord.js";
import { storePDF } from "./storePDF.js";
import { createRequire } from "module";
import shopify, { sessionStorage } from "./shopify.js";
import { addTrackingNumber } from "./addTrackingNumber.js";
import { addWaybill } from "./database.js";
import { getWaybills } from "./database.js";


const require = createRequire(import.meta.url);

const jwt = require("jsonwebtoken");

/**
 * @type {{[key: string]: import("@shopify/shopify-api").WebhookHandler}}
 */
export default {
    /**
     * Customers can request their data from a store owner. When this happens,
     * Shopify invokes this privacy webhook.
     *
     * https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks#customers-data_request
     */

    //NEEEDS TO BE IMPLEMENTED
    CUSTOMERS_DATA_REQUEST: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/api/webhooks",
        callback: async (topic, shop, body, webhookId) => {
            const payload = JSON.parse(body);
            // Payload has the following shape:
            // {
            //   "shop_id": 954889,
            //   "shop_domain": "{shop}.myshopify.com",
            //   "orders_requested": [
            //     299938,
            //     280263,
            //     220458
            //   ],
            //   "customer": {
            //     "id": 191167,
            //     "email": "john@example.com",
            //     "phone": "555-625-1199"
            //   },
            //   "data_request": {
            //     "id": 9999
            //   }
            // }
        },
    },

    /**
     * Store owners can request that data is deleted on behalf of a customer. When
     * this happens, Shopify invokes this privacy webhook.
     *
     * https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks#customers-redact
     */

    //NEEDS TO BE IMPLEMENTED
    CUSTOMERS_REDACT: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/api/webhooks",
        callback: async (topic, shop, body, webhookId) => {
            const payload = JSON.parse(body);
            // Payload has the following shape:
            // {
            //   "shop_id": 954889,
            //   "shop_domain": "{shop}.myshopify.com",
            //   "customer": {
            //     "id": 191167,
            //     "email": "john@example.com",
            //     "phone": "555-625-1199"
            //   },
            //   "orders_to_redact": [
            //     299938,
            //     280263,
            //     220458
            //   ]
            // }
        },
    },

    /**
     * 48 hours after a store owner uninstalls your app, Shopify invokes this
     * privacy webhook.
     *
     * https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks#shop-redact
     */

    //NEEDS TO BE IMPLEMENTED
    SHOP_REDACT: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/api/webhooks",
        callback: async (topic, shop, body, webhookId) => {
            const payload = JSON.parse(body);
            // Payload has the following shape:
            // {
            //   "shop_id": 954889,
            //   "shop_domain": "{shop}.myshopify.com"
            // }
        },
    },
    FULFILLMENTS_CREATE: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/api/webhooks",
        callback: async (topic, shop, body, webhookId) => {
            const payload = JSON.parse(body);
            try {
                fulfillmentsCreate(payload, shop)
            } catch (e) {
                console.error(e);
            }
        },
    },
};

async function fulfillmentsCreate(payload, shop) {
    const sessionId = shopify.api.session.getOfflineId(shop);
    const session = await sessionStorage.loadSession(sessionId);

    const waybill = await createWaybill(payload, shop, session).then(async (response) => {
        const orderNumber = payload.name.replace("#", "").split(".")[0];
        const timestamp = Math.floor(Date.now() / 1000).toString();

        const body = JSON.parse(response);
     

        const trackingNumber = body.bookingResponse.idInformation[0].ids[0].value;
        await storePDF(trackingNumber, body.labelPrintout[0].printout.data).then(async (status) => {
            if (status === "success") {
                const token = jwt.sign({
                    what: "waybill",
                    pdf: trackingNumber
                }, process.env.JWT_SECRET, { expiresIn: "30d" });

                await addTrackingNumber(session, payload.id, trackingNumber);


                await addWaybill(payload.order_id, orderNumber, trackingNumber, token);
            }
        });
    });
}
