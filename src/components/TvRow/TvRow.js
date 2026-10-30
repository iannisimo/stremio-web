const React = require('react');
const ReactIs = require('react-is');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { Button } = require('stremio/components');
const useTranslate = require('stremio/common/useTranslate');
const { FocusContext, useFocusGroup } = require('stremio/services/Navigation');
const TvRowPlaceholder = require('./TvRowPlaceholder/TvRowPlaceholder');
const styles = require('./styles');

const ROW_SIZE = 20;

const TvRow = ({ className, title, catalog, message, itemComponent, notifications }) => {
    const t = useTranslate();

    const catalogTitle = React.useMemo(() => {
        return title ?? t.catalogTitle(catalog);
    }, [title, catalog, t.catalogTitle]);

    const items = React.useMemo(() => {
        return catalog?.items ?? catalog?.content?.content;
    }, [catalog]);

    const href = React.useMemo(() => {
        return catalog?.deepLinks?.discover ?? catalog?.deepLinks?.library;
    }, [catalog]);

    const group = useFocusGroup();

    const shape = items?.[0]?.posterShape ?? 'poster';

    return (
        <FocusContext.Provider value={group.focusKey}>
            <div ref={group.ref} className={classnames(className, styles['tv-row-container'])}>
                {
                    typeof catalogTitle === 'string' && catalogTitle.length > 0 ?
                        <div className={styles['header-container']}>
                            <div className={styles['title-container']} title={catalogTitle}>{catalogTitle}</div>
                        </div>
                        :
                        null
                }
                {
                    typeof message === 'string' && message.length > 0 ?
                        <div className={styles['message-container']} title={message}>{message}</div>
                        :
                        <div className={styles['meta-items-container']}>
                            {
                                ReactIs.isValidElementType(itemComponent) ?
                                    items.slice(0, ROW_SIZE).map((item, index) => {
                                        return React.createElement(itemComponent, {
                                            ...item,
                                            metaItem: item,
                                            key: index,
                                            className: classnames(styles['meta-item'], styles['poster-shape-poster'], styles[`poster-shape-${item.posterShape}`]),
                                            notifications,
                                        });
                                    })
                                    :
                                    null
                            }
                            {
                                href ?
                                    <Button className={classnames(styles['see-all-container'], styles[`poster-shape-${shape}`])} title={t.string('BUTTON_SEE_ALL')} href={href}>
                                        <Icon className={styles['icon']} name={'chevron-forward'} />
                                        <div className={styles['label']}>{t.string('BUTTON_SEE_ALL')}</div>
                                    </Button>
                                    :
                                    null
                            }
                        </div>
                }
            </div>
        </FocusContext.Provider>
    );
};

TvRow.Placeholder = TvRowPlaceholder;

TvRow.propTypes = {
    className: PropTypes.string,
    title: PropTypes.string,
    message: PropTypes.string,
    catalog: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        type: PropTypes.string,
        addon: PropTypes.shape({
            manifest: PropTypes.shape({
                id: PropTypes.string,
                name: PropTypes.string,
            }),
        }),
        content: PropTypes.shape({
            content: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.arrayOf(PropTypes.shape({
                    posterShape: PropTypes.string,
                })),
            ]),
        }),
        items: PropTypes.arrayOf(PropTypes.shape({
            posterShape: PropTypes.string,
        })),
        deepLinks: PropTypes.shape({
            discover: PropTypes.string,
            library: PropTypes.string,
        }),
    }),
    itemComponent: PropTypes.elementType,
    notifications: PropTypes.object,
};

module.exports = TvRow;
