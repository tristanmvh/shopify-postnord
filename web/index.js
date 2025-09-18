import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import webhooks from "./webhooks.js";
import { getWaybills, getWaybill } from "./database.js";
import cors from "cors";
import jwt from "jsonwebtoken";

const PORT = parseInt(
    "8000", 10
);


//CORS rules
const corsPref = {
    origin: "https://extensions.shopifycdn.com",
    methods: ['GET', "POST", "OPTIONS"],
    credentials: false
}

const STATIC_PATH =
    process.env.NODE_ENV === "production"
        ? `${process.cwd()}/frontend/dist`
        : `${process.cwd()}/frontend/`;

const app = express();

//Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
    shopify.config.auth.callbackPath,
    shopify.auth.callback(),
    shopify.redirectToShopifyOrAppRoot()
);
app.post(
    shopify.config.webhooks.path,
    shopify.processWebhooks({ webhookHandlers: webhooks })
);

//Retrieve waybills for specific order
app.options('/getWaybills/:order_id', cors(corsPref));
app.get("/getWaybills/:order_id", cors(corsPref), async (req, res) => {
    try {
        const orderId = parseInt(req.params.order_id);

        if (!orderId) {
            return res.status(400).send({ error: "Missing order_id parameter" });
        }

        const query = await getWaybills(orderId);

		if(query) {
			res.status(200).send(query);
		} else {
			res.status(404).send("NO_WAYBILLS_FOUND");
		}
    } catch (error) {
        console.error(error);
        res.status(500).send("500 Internal server error");
    }
});

//Endpoint for viewing a waybill
app.get("/waybill/:tracking_number", async (req, res) => {
	const trackingNumber = req.params.tracking_number;
	const token = req.query.token;

	const waybill = await getWaybill(trackingNumber);

	if(waybill) {
		try {
			const request = {
				what: "waybill",
				pdf: trackingNumber
			}

			const signature = jwt.verify(token, process.env.JWT_SECRET);

			if(request.what === signature.what && request.pdf === signature.pdf) {
				res.status(200).sendFile(`${process.cwd()}/waybills/${trackingNumber}.pdf`);
			}
		} catch(e) {
			switch(e.name) {
                //Invalid token
				case "JsonWebTokenError":
					res.status(401).send("401 Unauthorized");
					break;

                //Expired token
				case "TokenExpiredError":
					res.status(410).send("410 Gone");
					break;

                //Unexpected error
				default:
					res.status(500).send("500 Internal server error");
					console.dir(e)
			}
		}
	} else {
		res.status(404).send("404 Not found");
	}
});

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js
app.use("/api/*", shopify.validateAuthenticatedSession());
app.use(express.json());
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
    return res
        .status(200)
        .set("Content-Type", "text/html")
        .send(
            readFileSync(join(STATIC_PATH, "index.html"))
                .toString()
                .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
        );
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});