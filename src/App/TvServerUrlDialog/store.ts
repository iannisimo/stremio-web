type Request = {
    url: string,
    onConfirm: () => void,
    onCancel: () => void,
};

let request: Request | null = null;
const listeners = new Set<() => void>();

const setRequest = (next: Request | null) => {
    request = next;
    listeners.forEach((listener) => listener());
};

const getRequest = () => request;

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export type { Request };
export { setRequest, getRequest, subscribe };
