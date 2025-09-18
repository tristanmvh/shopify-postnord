import shopify  from "./shopify.js"; 

export async function addTrackingNumber(session, fulfillmentId, trackingNumber) {
    const client = new shopify.api.clients.Graphql({ session });

    const query = `mutation FulfillmentTrackingInfoUpdate($fulfillmentId: ID!, $trackingInfoInput: FulfillmentTrackingInput!, $notifyCustomer: Boolean) {
      fulfillmentTrackingInfoUpdate(fulfillmentId: $fulfillmentId, trackingInfoInput: $trackingInfoInput, notifyCustomer: $notifyCustomer) {
        fulfillment {
          id
          status
          trackingInfo {
            company
            number
            url
          }
        }
        userErrors {
          field
          message
        }
      }
    }`;

    const data = await client.query({
        data: {
            query,
            variables: {
                fulfillmentId: `gid://shopify/Fulfillment/${fulfillmentId}`,
                notifyCustomer: false,
                trackingInfoInput: {
                    number: trackingNumber,
                    company: "PostNord Sweden",
                    url: `https://tracking.postnord.com/se/?id=${trackingNumber}`
                }
            }
        }
    });
}