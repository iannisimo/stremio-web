import type { ForwardRefExoticComponent, RefAttributes } from 'react';

type Tab = {
    id: string,
    label: string,
    icon?: string,
    logo?: string,
    href?: string,
    bottom?: boolean,
    onClick?: () => void,
};

type Props = {
    className?: string,
    selected?: string,
    tabs: Tab[],
};

declare const Rail: ForwardRefExoticComponent<Props & RefAttributes<HTMLElement>>;

export = Rail;
