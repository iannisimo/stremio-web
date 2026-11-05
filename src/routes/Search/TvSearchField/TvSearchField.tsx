import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '@stremio/stremio-icons/react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import usePlayUrl from 'stremio/common/usePlayUrl';
import Button from 'stremio/components/Button';
import TextInput from 'stremio/components/TextInput';
import styles from './TvSearchField.less';

// JS modules without types
const useLocalSearch = require('stremio/components/NavBar/HorizontalNavBar/SearchBar/useLocalSearch');
const debounce = require('lodash.debounce');

type Props = {
    query: string | null,
    focusKey?: string,
};

const ClearButton = ({ onClick }: { onClick: () => void }) => {
    const { ref } = useFocusable();
    return (
        <Button ref={ref} className={styles['clear-button']} onClick={onClick}>
            <Icon className={styles['clear-icon']} name={'close'} />
        </Button>
    );
};

// Takes the place of the top bar's SearchBar: the field opens the text
// editor, which shows the local-search suggestions while typing.
const TvSearchField = ({ query, focusKey }: Props) => {
    const { t } = useTranslation();
    const [, setSearchParams] = useSearchParams();
    const { handlePlayUrl } = usePlayUrl();
    const localSearch = useLocalSearch();
    const [text, setText] = useState(query ?? '');

    useEffect(() => setText(query ?? ''), [query]);

    const searchLocal = useMemo(() => debounce(localSearch.search, 250), [localSearch.search]);
    useEffect(() => {
        searchLocal(text);
        return () => searchLocal.cancel();
    }, [text, searchLocal]);
    const suggestions = useMemo(() => (
        text.trim().length > 0 ? (localSearch.items ?? []).map((item: { query: string }) => item.query) : []
    ), [text, localSearch.items]);

    const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setText(event.currentTarget.value), []);

    const onSubmit = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value.trim();
        setSearchParams(value.length > 0 ? { search: value } : {});
    }, [setSearchParams]);

    const onPaste = useCallback((event: React.ClipboardEvent<HTMLInputElement>) => {
        const pasted = event.clipboardData.getData('text');
        if (pasted) handlePlayUrl(pasted);
    }, [handlePlayUrl]);

    const clear = useCallback(() => {
        setText('');
        setSearchParams({});
    }, [setSearchParams]);

    return (
        <div className={styles['tv-search-field']}>
            <div className={styles['field-container']}>
                <Icon className={styles['field-icon']} name={'search'} />
                <TextInput
                    focusKey={focusKey}
                    className={styles['field']}
                    type={'text'}
                    placeholder={t('SEARCH_OR_PASTE_LINK')}
                    value={text}
                    onChange={onChange}
                    onSubmit={onSubmit}
                    onPaste={onPaste}
                    suggestions={suggestions}
                />
            </div>
            {
                query ?
                    <ClearButton onClick={clear} />
                    :
                    null
            }
        </div>
    );
};

export default TvSearchField;
