(() => {

    /* =========================================
       CONFIGURATION
    ========================================== */

    const CONFIG = {

        radius: 3,

        mobileRadius: 2,


        centerScale: 1.70,

        firstRingScale: 1.28,

        secondRingScale: 1.08,

        outerScale: 0.94,


        expansionStrength: 16,

        firstRingExpansion: 7,


        auraDesktopSize: 260,

        auraMobileSize: 180,


        pointerInterval: 20,


        drawerDuration: 650,

        contentFadeDuration: 250

    };


    /* =========================================
       DOM
    ========================================== */

    const grid =
        document.getElementById(
            "hex-grid"
        );


    const aura =
        document.getElementById(
            "aura"
        );


    const drawer =
        document.getElementById(
            "drawer"
        );


    const navItems =
        Array.from(
            document.querySelectorAll(
                ".nav-item"
            )
        );


    const contents =
        Array.from(
            document.querySelectorAll(
                ".drawer-content"
            )
        );


    const columns =
        Array.from(
            grid.querySelectorAll(
                ".hex-column"
            )
        );


    /* =========================================
       HEXAGON DATA
    ========================================== */

    const hexagons = [];


    columns.forEach(
        (
            column,
            columnIndex
        ) => {

            const elements =
                Array.from(
                    column.querySelectorAll(
                        ".hex"
                    )
                );


            elements.forEach(
                (
                    element,
                    row
                ) => {

                    hexagons.push({

                        element,

                        column:
                            columnIndex,

                        row,

                        x: 0,

                        y: 0

                    });

                }
            );

        }
    );


    /* =========================================
       POINTER STATE
    ========================================== */

    let mouseX = 0;

    let mouseY = 0;

    let lastPointer = 0;

    let frame = null;


    /* =========================================
       DRAWER STATE
    ========================================== */

    let activePanel = null;

    let drawerAnimating = false;


    /* =========================================
       POSITIONS
    ========================================== */

    function updatePositions() {

        for (
            const hex of hexagons
        ) {

            const rect =
                hex.element
                    .getBoundingClientRect();


            hex.x =
                rect.left +
                rect.width / 2;


            hex.y =
                rect.top +
                rect.height / 2;

        }

    }


    /* =========================================
       FIND CLOSEST HEXAGON
    ========================================== */

    function findClosest(
        x,
        y
    ) {

        let closest = null;

        let closestDistance =
            Infinity;


        for (
            const hex of hexagons
        ) {

            const dx =
                hex.x - x;

            const dy =
                hex.y - y;


            const distance =
                dx * dx +
                dy * dy;


            if (
                distance <
                closestDistance
            ) {

                closestDistance =
                    distance;

                closest =
                    hex;

            }

        }


        return closest;

    }


    /* =========================================
       HEXAGON DISTANCE
    ========================================== */

    function hexDistance(
        a,
        b
    ) {

        const aq =
            a.column;


        const ar =
            a.row -
            (
                a.column -
                (a.column & 1)
            ) / 2;


        const bq =
            b.column;


        const br =
            b.row -
            (
                b.column -
                (b.column & 1)
            ) / 2;


        const ax = aq;

        const az = ar;

        const ay =
            -ax - az;


        const bx = bq;

        const bz = br;

        const by =
            -bx - bz;


        return Math.max(

            Math.abs(
                ax - bx
            ),

            Math.abs(
                ay - by
            ),

            Math.abs(
                az - bz
            )

        );

    }


    /* =========================================
       SCALE
    ========================================== */

    function getScale(
        distance
    ) {

        if (
            distance === 0
        ) {

            return CONFIG.centerScale;

        }


        if (
            distance === 1
        ) {

            return CONFIG.firstRingScale;

        }


        if (
            distance === 2
        ) {

            return CONFIG.secondRingScale;

        }


        return CONFIG.outerScale;

    }


    /* =========================================
       LIGHT INTENSITY
    ========================================== */

    function getIntensity(
        distance
    ) {

        if (
            distance === 0
        ) {

            return 1;

        }


        if (
            distance === 1
        ) {

            return 0.55;

        }


        if (
            distance === 2
        ) {

            return 0.20;

        }


        return 0;

    }


    /* =========================================
       DESATURATION
    ========================================== */

    function getDesaturation(
        distance
    ) {

        if (
            distance === 0
        ) {

            return 0;

        }


        if (
            distance === 1 ||
            distance === 2
        ) {

            return 0.50;

        }


        return 0.80;

    }


    /* =========================================
       SATURATION
    ========================================== */

    function getSaturation(
        distance
    ) {

        if (
            distance === 0
        ) {

            return 1.10;

        }


        return 1;

    }


    /* =========================================
       DISPLACEMENT
    ========================================== */

    function getDisplacement(
        center,
        hex,
        distance
    ) {

        if (
            distance === 0
        ) {

            return {
                x: 0,
                y: 0
            };

        }


        let dx =
            hex.x -
            center.x;


        let dy =
            hex.y -
            center.y;


        const length =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            length === 0
        ) {

            return {
                x: 0,
                y: 0
            };

        }


        dx /= length;

        dy /= length;


        if (
            distance === 1
        ) {

            return {

                x:
                    dx *
                    CONFIG.expansionStrength,

                y:
                    dy *
                    CONFIG.expansionStrength

            };

        }


        if (
            distance === 2
        ) {

            return {

                x:
                    dx *
                    CONFIG.firstRingExpansion,

                y:
                    dy *
                    CONFIG.firstRingExpansion

            };

        }


        if (
            distance === 3
        ) {

            return {

                x:
                    dx * 2,

                y:
                    dy * 2

            };

        }


        return {
            x: 0,
            y: 0
        };

    }


    /* =========================================
       MOVE AURA
    ========================================== */

    function moveAura(
        center
    ) {

        const isMobile =
            window.matchMedia(
                "(max-width: 700px)"
            ).matches;


        const size =
            isMobile
                ? CONFIG.auraMobileSize
                : CONFIG.auraDesktopSize;


        const gridRect =
            grid.getBoundingClientRect();


        const x =
            center.x -
            gridRect.left;


        const y =
            center.y -
            gridRect.top;


        aura.style.left =
            `${x}px`;


        aura.style.top =
            `${y}px`;


        aura.style.width =
            `${size}px`;


        aura.style.height =
            `${size}px`;


        aura.style.opacity =
            isMobile
                ? "0.42"
                : "0.58";

    }


    /* =========================================
       APPLY HEX EFFECT
    ========================================== */

    function applyEffect(
        center
    ) {

        const isMobile =
            window.matchMedia(
                "(max-width: 700px)"
            ).matches;


        const radius =
            isMobile
                ? CONFIG.mobileRadius
                : CONFIG.radius;


        for (
            const hex of hexagons
        ) {

            const distance =
                hexDistance(
                    center,
                    hex
                );


            if (
                distance <= radius
            ) {

                const scale =
                    getScale(
                        distance
                    );


                const intensity =
                    getIntensity(
                        distance
                    );


                const desaturation =
                    getDesaturation(
                        distance
                    );


                const saturation =
                    getSaturation(
                        distance
                    );


                const displacement =
                    getDisplacement(
                        center,
                        hex,
                        distance
                    );


                hex.element.style.setProperty(
                    "--scale",
                    scale
                );


                hex.element.style.setProperty(
                    "--pulse",
                    intensity
                );


                hex.element.style.setProperty(
                    "--desaturation",
                    desaturation
                );


                hex.element.style.setProperty(
                    "--saturation",
                    saturation
                );


                hex.element.style.setProperty(
                    "--offset-x",
                    `${displacement.x}px`
                );


                hex.element.style.setProperty(
                    "--offset-y",
                    `${displacement.y}px`
                );

            }


            else if (
                distance ===
                radius + 1
            ) {

                const displacement =
                    getDisplacement(
                        center,
                        hex,
                        distance
                    );


                hex.element.style.setProperty(
                    "--scale",
                    CONFIG.outerScale
                );


                hex.element.style.setProperty(
                    "--pulse",
                    0
                );


                hex.element.style.setProperty(
                    "--desaturation",
                    0.80
                );


                hex.element.style.setProperty(
                    "--saturation",
                    1
                );


                hex.element.style.setProperty(
                    "--offset-x",
                    `${displacement.x}px`
                );


                hex.element.style.setProperty(
                    "--offset-y",
                    `${displacement.y}px`
                );

            }


            else {

                hex.element.style.setProperty(
                    "--scale",
                    1
                );


                hex.element.style.setProperty(
                    "--pulse",
                    0
                );


                hex.element.style.setProperty(
                    "--desaturation",
                    0.80
                );


                hex.element.style.setProperty(
                    "--saturation",
                    1
                );


                hex.element.style.setProperty(
                    "--offset-x",
                    "0px"
                );


                hex.element.style.setProperty(
                    "--offset-y",
                    "0px"
                );

            }

        }


        moveAura(
            center
        );

    }


    /* =========================================
       POINTER MOVE
    ========================================== */

    function handlePointerMove(
        event
    ) {

        mouseX =
            event.clientX;

        mouseY =
            event.clientY;


        if (!frame) {

            frame =
                requestAnimationFrame(
                    processPointer
                );

        }

    }


    /* =========================================
       PROCESS POINTER
    ========================================== */

    function processPointer() {

        frame = null;


        const now =
            performance.now();


        if (
            now -
            lastPointer <
            CONFIG.pointerInterval
        ) {

            return;

        }


        lastPointer =
            now;


        const center =
            findClosest(
                mouseX,
                mouseY
            );


        if (
            center
        ) {

            applyEffect(
                center
            );

        }

    }


    /* =========================================
       TOUCH
    ========================================== */

    function handleTouch(
        event
    ) {

        const touch =
            event.touches[0];


        if (!touch) {

            return;

        }


        mouseX =
            touch.clientX;

        mouseY =
            touch.clientY;


        const center =
            findClosest(
                mouseX,
                mouseY
            );


        if (
            center
        ) {

            applyEffect(
                center
            );

        }

    }


    /* =========================================
       DRAWER CONTENT
    ========================================== */

    function showContent(
        panel
    ) {

        contents.forEach(
            content => {

                content.classList.remove(
                    "active"
                );

            }
        );


        const target =
            document.getElementById(
                `${panel}-content`
            );


        if (
            target
        ) {

            target.classList.add(
                "active"
            );

        }

    }


    /* =========================================
       OPEN DRAWER
    ========================================== */

    function openDrawer(
        panel
    ) {

        if (
            drawerAnimating
        ) {

            return;

        }


        drawerAnimating =
            true;


        activePanel =
            panel;


        showContent(
            panel
        );


        drawer.classList.add(
            "open"
        );


        drawer.setAttribute(
            "aria-hidden",
            "false"
        );


        navItems.forEach(
            item => {

                item.classList.toggle(
                    "active",
                    item.dataset.panel === panel
                );

            }
        );


        setTimeout(
            () => {

                drawerAnimating =
                    false;

            },
            CONFIG.drawerDuration
        );

    }


    /* =========================================
       CLOSE DRAWER
    ========================================== */

    function closeDrawer() {

        if (
            drawerAnimating
        ) {

            return;

        }


        drawerAnimating =
            true;


        drawer.classList.remove(
            "open"
        );


        drawer.setAttribute(
            "aria-hidden",
            "true"
        );


        navItems.forEach(
            item => {

                item.classList.remove(
                    "active"
                );

            }
        );


        activePanel =
            null;


        setTimeout(
            () => {

                drawerAnimating =
                    false;

            },
            CONFIG.drawerDuration
        );

    }


    /* =========================================
       CHANGE DRAWER CONTENT
    ========================================== */

    function changeDrawerContent(
        panel
    ) {

        if (
            panel === activePanel
        ) {

            closeDrawer();

            return;

        }


        if (
            !drawer.classList.contains(
                "open"
            )
        ) {

            openDrawer(
                panel
            );

            return;

        }


        if (
            drawerAnimating
        ) {

            return;

        }


        drawerAnimating =
            true;


        const current =
            document.getElementById(
                `${activePanel}-content`
            );


        const next =
            document.getElementById(
                `${panel}-content`
            );


        /*
         * Fade OUT
         */

        current.classList.remove(
            "active"
        );


        setTimeout(
            () => {

                /*
                 * Cambiamos el contenido
                 * mientras permanece abierto
                 */

                activePanel =
                    panel;


                next.classList.add(
                    "active"
                );


                navItems.forEach(
                    item => {

                        item.classList.toggle(
                            "active",
                            item.dataset.panel === panel
                        );

                    }
                );


                /*
                 * Fade IN
                 */

                setTimeout(
                    () => {

                        drawerAnimating =
                            false;

                    },
                    CONFIG.contentFadeDuration
                );

            },
            CONFIG.contentFadeDuration
        );

    }


    /* =========================================
       NAVIGATION
    ========================================== */

    navItems.forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    changeDrawerContent(
                        item.dataset.panel
                    );

                }
            );

        }
    );


    /* =========================================
       POINTER LEAVE
    ========================================== */

    window.addEventListener(
        "pointerleave",
        () => {

            aura.style.opacity =
                "0";

        }
    );


    /* =========================================
       POINTER EVENTS
    ========================================== */

    window.addEventListener(
        "pointermove",
        handlePointerMove,
        {
            passive: true
        }
    );


    window.addEventListener(
        "touchstart",
        handleTouch,
        {
            passive: true
        }
    );


    window.addEventListener(
        "touchmove",
        handleTouch,
        {
            passive: true
        }
    );


    /* =========================================
       RESIZE
    ========================================== */

    let resizeTimeout;


    window.addEventListener(
        "resize",
        () => {

            clearTimeout(
                resizeTimeout
            );


            resizeTimeout =
                setTimeout(
                    updatePositions,
                    150
                );

        }
    );


    /* =========================================
       INITIALIZE
    ========================================== */

    updatePositions();

})();