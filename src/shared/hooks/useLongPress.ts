import { useCallback, useRef, useState } from 'react';

export function useLongPress(
    onLongPress: (e?: any) => void = () => {},
    onClick: (e?: any) => void = () => {},
    { shouldPreventDefault = true, delay = 500 }: { shouldPreventDefault?: boolean; delay?: number; } = {}
) {
    const [longPressTriggered, setLongPressTriggered] = useState(false);
    const timeout = useRef<any>(null);
    const target = useRef<any>(null);

    const start = useCallback(
        (event: any) => {
            if (shouldPreventDefault && event.target) {
                event.target.addEventListener('touchend', preventDefault as any, {
                    passive: false
                });
                target.current = event.target;
            }
            setLongPressTriggered(false);
            timeout.current = setTimeout(() => {
                onLongPress && onLongPress(event as any);
                setLongPressTriggered(true);
            }, delay);
        },
        [onLongPress, delay, shouldPreventDefault]
    );

    const clear = useCallback(
        (event: any, shouldTriggerClick = true) => {
            timeout.current && clearTimeout(timeout.current);
            shouldTriggerClick && !longPressTriggered && onClick && onClick(event);
            setLongPressTriggered(false);
            if (shouldPreventDefault && target.current) {
                target.current.removeEventListener('touchend', preventDefault as any);
            }
        },
        [shouldPreventDefault, onClick, longPressTriggered]
    );

    return {
        onMouseDown: (e: any) => start(e),
        onTouchStart: (e: any) => start(e),
        onMouseUp: (e: any) => clear(e, true),
        onMouseLeave: (e: any) => clear(e, false),
        onTouchEnd: (e: any) => clear(e, true),
        onContextMenu: (e: any) => {
            e.preventDefault();
            onLongPress && onLongPress(e as any);
        }
    };
}

const preventDefault = (event: Event) => {
    if (!('touches' in event)) return;
    if ((event as TouchEvent).touches.length < 2 && event.preventDefault) {
        event.preventDefault();
    }
};
