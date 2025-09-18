import { MongoClient } from "mongodb";

const uri = `mongodb://${process.env.MONGODB_DATABASE}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOSTNAME}:${process.env.MONGODB_PORT}/mongodb?authSource=${process.env.MONGODB_USER_DB}`;

const client = new MongoClient(uri);

//get waybills by order id
export async function getWaybills(id) {
	try {
		await client.connect();
		const db = client.db("mongodb");
		const waybills = db.collection("waybills");

		const query = { id: id };

		const waybillsFound = waybills.find(query);

		if(await waybills.countDocuments(query) === 0) {
			return null;
		} else {
			return await waybillsFound.toArray();
		}
	} finally {
		await client.close();
	}
}

//get a waybill by tracking number
export async function getWaybill(trackingNumber) {

	try {
		await client.connect();
		const db = client.db("mongodb");
		const waybills = db.collection("waybills");

		const query = { trackingNumber: trackingNumber };
		const waybill = await waybills.findOne(query);

		return waybill;
	} finally {
		await client.close();
	}
}

//add a waybill to DB
export async function addWaybill(id, orderNumber, trackingNumber, token) {
	await client.connect();

	try {
		const db = client.db("mongodb");
		const waybills = db.collection("waybills");

		const waybill = {
			id: id,
			orderNumber: orderNumber,
			trackingNumber: trackingNumber,
			token: token
		};
		const result = await waybills.insertOne(waybill);
	} finally {
		await client.close();
	}
}
