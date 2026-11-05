import { useEffect } from 'react';
import { setRequest, Request } from './store';

// Rendered by SearchParamsHandler, outside the routes: hands the request to
// TvServerUrlSlot, which shows the dialog inside the top page.
const TvServerUrlDialog = ({ url, onConfirm, onCancel }: Request) => {
    useEffect(() => {
        setRequest({ url, onConfirm, onCancel });
        return () => setRequest(null);
    }, [url, onConfirm, onCancel]);

    return null;
};

export default TvServerUrlDialog;
