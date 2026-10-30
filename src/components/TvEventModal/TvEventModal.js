const React = require('react');
const { useTranslation } = require('react-i18next');
const { default: FullscreenDialog } = require('stremio/components/FullscreenDialog');
const useEvents = require('stremio/components/EventModal/useEvents');

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
        const primary = modal.addon?.manifestUrl ?
            [{ label: t('INSTALL_ADDON'), href: `#/addons?addon=${encodeURIComponent(modal.addon.manifestUrl)}`, onClick: onClose }]
            :
            modal.externalUrl ?
                [{ label: t('LEARN_MORE'), href: modal.externalUrl, target: '_blank' }]
                :
                [];
        return [...primary, { label: t('BUTTON_CLOSE'), onClick: onClose }];
    }, [modal, onClose, t]);

    return (
        modal !== null ?
            <FullscreenDialog
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
