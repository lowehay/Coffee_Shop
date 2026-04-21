import { useMemo, useRef, useState } from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const effectPresets = {
    slideUp: [
        {
            y: "-100%",
        },
        {
            y: "100%",
        },
        {
            y: 0,
        },
    ],

    slideDown: [
        {
            y: "100%",
        },
        {
            y: "-100%",
        },
        {
            y: 0,
        },
    ],

    opacity: [
        {
            opacity: 0,
        },
        {
            opacity: 0,
        },
        {
            opacity: 1,
        },
    ],

    blur: [
        {
            filter: "blur(12px)",
        },
        {
            filter: "blur(12px)",
        },
        {
            filter: "blur(0px)",
        },
    ],

    grayscale: [
        {
            filter: "grayscale(100%)",
        },
        {
            filter: "grayscale(100%)",
        },
        {
            filter: "grayscale(0%)",
        },
    ]
};

const mergeVars = (varsArray) => {
    const merged = {};

    for (const vars of varsArray) {
        for (const [key, value] of Object.entries(vars)) {
            if (key === "filter" && merged.filter) {
                merged.filter += ` ${value}`; // combine filters
            } else {
                merged[key] = value; // last one wins for other props
            }
        }
    }

    return merged;
};

export const Swap = (
    {
        state,
        children,
        duration = 0.4,
        effects = [],
        ...props
    }
) => {
    const [currentState, setCurrentState] = useState(state);

    const containerRef = useRef(null);
    const contentRef = useRef(null);

    const [enterVars, exitVars, finalVars] = useMemo(() => Array.from(
        { length: 3 },
        (_, i) => mergeVars(effects.map((e) => effectPresets[e][i]))
    ), [effects]);

    useGSAP(() => {
        if (currentState === state) return;
        const content = contentRef.current;
        if (!content) return;

        gsap.to(content, {
            ...enterVars,
            duration,
            ease: "power2.in",
            onComplete: () => {
                setCurrentState(state);
                gsap.fromTo(content, exitVars, {
                    ...finalVars,
                    duration,
                    ease: "power2.out",
                });
            },
        });
    }, { dependencies: [state] });

    useGSAP(() => {
        if (!containerRef.current || !contentRef.current) return;

        const box = contentRef.current.getBoundingClientRect();

        gsap.to(containerRef.current, {
            width: box.width,
            height: box.height,
            duration: 0.4,
            ease: "power2.out",
        });
    }, { dependencies: [currentState] });

    return (
        <div {...props} ref={containerRef}>
            <div ref={contentRef} className="inline-block">
                {children(currentState)}
            </div>
        </div>
    );
};
