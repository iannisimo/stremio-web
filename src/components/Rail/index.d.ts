import type { ForwardRefExoticComponent, RefAttributes } from 'react';

type Tab = {
    id: string,
    label: string,
    icon?: string,
    logo?: string,
    href?: string,
    onClick?: () => void,
};

type Props = {
    className?: string,
    selected?: string,
    tabs: Tab[],
    profileMenu?: boolean,
};

declare const Rail: ForwardRefExoticComponent<Props & RefAttributes<HTMLElement>>;

export = Rail;
