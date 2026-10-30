const React = require('react');
const PropTypes = require('prop-types');
const { useTranslation } = require('react-i18next');
const { useCore } = require('stremio/core');
const { default: FullscreenDialog } = require('stremio/components/FullscreenDialog');

// Long-press / right-click dialog for a card. Library items bring their own
// options; other cards get the meta actions built from `metaItem`.
const MetaItemActions = ({ name, image, href, metaItem, watched, options, onSelectOption, onClose }) => {
    const { t } = useTranslation();
    const core = useCore();

    const actions = React.useMemo(() => {
        const close = (fn) => () => {
            onClose();
            fn();
        };
        if (Array.isArray(options) && options.length > 0) {
            return [
                ...options.map(({ label, value }) => ({
                    label: t(label),
                    onClick: close(() => onSelectOption(value)),
                })),
                { label: t('BUTTON_CLOSE'), onClick: onClose },
            ];
        }
        const item = metaItem && typeof metaItem === 'object' ? metaItem : null;
        const trailerHref = item?.trailerStreams?.[0]?.deepLinks?.player;
        const isWatched = item?.watched ?? watched;
        const dispatch = (action, args) => core.transport.dispatch({ action: 'Ctx', args: { action, args } });
        return [
            typeof href === 'string' ? { label: t('SHOW'), href, onClick: onClose } : null,
            typeof trailerHref === 'string' ? { label: t('TRAILER'), href: trailerHref, onClick: onClose } : null,
            item === null ? null : item.inLibrary ?
                { label: t('REMOVE_FROM_LIB'), onClick: close(() => dispatch('RemoveFromLibrary', item.id)) }
                :
                { label: t('ADD_TO_LIB'), onClick: close(() => dispatch('AddToLibrary', item)) },
            item === null ? null : {
                label: isWatched ? t('CTX_MARK_UNWATCHED') : t('CTX_MARK_WATCHED'),
                onClick: close(() => dispatch('MetaItemMarkAsWatched', { meta_item: item, is_watched: !isWatched })),
            },
            { label: t('BUTTON_CLOSE'), onClick: onClose },
        ].filter(Boolean);
    }, [options, onSelectOption, onClose, t, href, metaItem, watched]);

    const logo = typeof metaItem?.logo === 'string' ? metaItem.logo : null;
    return (
        <FullscreenDialog
            image={logo ?? image}
            background={metaItem?.background ?? image}
            title={logo !== null || typeof name !== 'string' ? '' : name}
            message={metaItem?.description ?? undefined}
            actions={actions}
            onClose={onClose}
        />
    );
};

MetaItemActions.propTypes = {
    name: PropTypes.string,
    image: PropTypes.string,
    href: PropTypes.string,
    metaItem: PropTypes.shape({
        id: PropTypes.string,
        logo: PropTypes.string,
        background: PropTypes.string,
        description: PropTypes.string,
        inLibrary: PropTypes.bool,
        watched: PropTypes.bool,
        trailerStreams: PropTypes.array,
    }),
    watched: PropTypes.bool,
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.string,
    })),
    onSelectOption: PropTypes.func,
    onClose: PropTypes.func,
};

module.exports = MetaItemActions;
