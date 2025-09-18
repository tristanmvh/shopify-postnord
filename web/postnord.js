import { Customer, Sender, PostNordClient } from "./postnord/index.js";
import shopify, { sessionStorage } from "./shopify.js";
import "dotenv/config";

//this function is invoked when an order fulfillment is created (invoked by webhook FULFILLMENTS_CREATE, see webhooks.js)

export async function createWaybill(body, shop, session) {
    //Postnord Client configuration
    const postnordConfig = {
        appName: process.env.POSTNORD_APP_NAME,
        apiKey: process.env.API_KEY_PRODUCTION,
        apiKeyTest: process.env.API_KEY_TEST,
        customerNumber: process.env.POSTNORD_CUSTOMER_NUMBER,
        issuerCode: "Z12",
        isTest: true
    }

    //retrieve order information
    const orderId = body.order_id;
    const orderNumber = body.name.replace("#", "").split(".")[0];
    const order = await shopify.api.rest.Order.find({
        session,
        id: orderId
    });
    const deliveryOption = order.shipping_lines[0].code;

    //calculate order fulfillment weight (grams)
    const weight = () => {
        var items = body.line_items;
        var g = 0;
        for (var i = 0; i < items.length; i++) {
            var itemWeight = items[i].grams;
            var itemQuantity = items[i].quantity;
            g += itemWeight * itemQuantity;
        }
        return g;
    }
    const customerData = body.destination;

    //Initialize PostNord Client 
    const postnord = new PostNordClient();
    postnord.init(postnordConfig);

    //Sender information
    var sender = new Sender(
        process.env.COMPANY_NAME, {
        street: process.env.COMPANY_STREET,
        city: process.env.COMPANY_CITY,
        postalCode: process.env.COMPANY_POSTAL_CODE,
        country: process.env.COMPANY_COUNTRY
    });

    //customer delivery information
    var customer = new Customer(
        customerData.name,
        order.email,
        customerData.phone,
        {
            street: customerData.address1,
            postalCode: customerData.zip,
            city: customerData.city,
            country: customerData.country_code
        }
    );

    //determine if parcel should be delivered to the customer's door or to a service point
    switch (deliveryOption.toLowerCase()) {
        case "leverans till brevlåda":
            return await postnord.myPackHomeSmall(orderNumber, orderNumber, weight() / 1000, ["C2"], sender, customer);
            break;

        case "leverans till ombud":
            return await postnord.servicePoint(orderNumber, orderNumber, weight() / 1000, ["C2", "A7", "A3"], sender, customer);
            break;
    }
}
