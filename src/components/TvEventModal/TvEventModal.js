const React = require('react');
const { useTranslation } = require('react-i18next');
const { default: TvFullscreenDialog } = require('stremio/components/TvFullscreenDialog');
const useEvents = require('stremio/components/EventModal/useEvents');

// Only links that stay in the app; addon installs and web pages don't work here.
const isInternalLink = (url) => typeof url === 'string' && (url.startsWith('#/') || url.startsWith('stremio://'));

const TvEventModal = () => {
    const { t } = useTranslation();

    const { events, pullEvents, dismissEvent } = useEvents();

    const modal = React.useMemo(() => {
        return events?.modal?.type === 'Ready' ?
            events.modal.content
            :
            null;
    }, [events]);

    const onClose = React.useCallback(() => {
        modal?.id && dismissEvent(modal.id);
    }, [modal]);

    React.useEffect(() => {
        pullEvents();
    }, []);

    const actions = React.useMemo(() => {
        if (modal === null) return [];
        const primary = isInternalLink(modal.externalUrl) ?
            [{ label: t('LEARN_MORE'), href: modal.externalUrl, onClick: onClose }]
            :
            [];
        return [...primary, { label: t('BUTTON_CLOSE'), onClick: onClose }];
    }, [modal, onClose, t]);

    return (
        modal !== null ?
            <TvFullscreenDialog
                image={modal.imageUrl}
                background={modal.imageUrl}
                eyebrow={modal.addon?.name}
                title={modal.title ?? ''}
                message={modal.message}
                actions={actions}
                onClose={onClose}
            />
            :
            null
    );
};

module.exports = TvEventModal;
