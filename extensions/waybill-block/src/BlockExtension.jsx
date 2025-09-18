import {
    reactExtension,
    useApi,
    AdminBlock,
    BlockStack,
    Text,
} from '@shopify/ui-extensions-react/admin';
import WaybillList from './WaybillList.jsx';


// The target used here must match the target used in the extension's toml file (./shopify.extension.toml)
const TARGET = 'admin.order-details.block.render';
export default reactExtension(TARGET, () => <App />);

function App() {
    // The useApi hook provides access to several useful APIs like i18n and data.
    const { i18n, data } = useApi(TARGET);
    const orderId = data.selected?.[0]?.id.split("/Order/")[1];
    return (
        // The AdminBlock component provides an API for setting the title of the Block extension wrapper.
        <AdminBlock title="Fraktsedlar">
            <BlockStack>
                <WaybillList orderId={orderId}></WaybillList>
            </BlockStack>
        </AdminBlock>
    );
}