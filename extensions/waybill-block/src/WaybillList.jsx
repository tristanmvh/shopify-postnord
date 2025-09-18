import {
    reactExtension,
    useApi,
    AdminBlock,
    BlockStack,
    Text,
	Link
} from '@shopify/ui-extensions-react/admin';
import { useEffect } from 'react';
import { useState } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';


function WaybillLink({name, token}) {
	return (
		<Link href={ "https://example.com/waybill/" + name + "?token=" + token } target="_blank">{name}</Link>
	)
}

export default function WaybillList({ orderId }) {
    const [waybills, setWaybills] = useState([]);
    const shopify = useAppBridge();

	const view = () => {
		return waybills.map(waybill => {
			return <WaybillLink name={waybill.trackingNumber} token={waybill.token} />
		});
	}


    useEffect(() => {

        const getWaybills = async (orderId) => {
            const response = await fetch(`https://example.com/getWaybills/${orderId}`);
			const data =  await response.json();
			setWaybills(data);
        }

        getWaybills(orderId);
    }, [orderId]);


    if (waybills.length == 0) {
        return <Text>No waybills found</Text>
    }
    return (
		{view()}
	)
}
