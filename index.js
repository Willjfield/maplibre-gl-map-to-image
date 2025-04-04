import * as htmlToImage from 'html-to-image';
/**
 * Converts a MapLibre map to a PNG image and sets the image source to a specified target element.
 *
 * @param {object} map - The MapLibre map instance.
 * @param {object} options - Configuration options for the conversion process.
 * @param {string} options.targetImageId - REQUIRED: The ID of the target image element where the PNG will be set.
 * @param {array} [options.bbox] - Optional bounding box to fit the map before conversion.
 * @param {boolean} [options.hideAllControls] - Flag to hide all map controls during conversion.
 * @param {array} [options.hideControlsInCorner] - Specific corners to hide controls from.
 * @param {boolean} [options.hideMarkers] - Flag to hide markers during conversion.
 * @param {boolean} [options.hidePopups] - Flag to hide popups during conversion.
 * @param {array} [options.hideVisibleLayers] - Layer IDs to hide during conversion.
 * @param {array} [options.showHiddenLayers] - Layer IDs to show during conversion.
 * @returns {Promise} Resolves when the image has been successfully generated and set.
 */

export async function toPng(map, options) {
    let originalBounds = map.getBounds();
    if (options.bbox) {
        map.fitBounds(options.bbox, { animate: false });
    }

    const mapElement = map.getContainer();
    mapElement.style.height = `${mapElement.getBoundingClientRect().height}px`;
    const targetImageElement = document.getElementById(options.targetImageId);

    const virtualClone = mapElement.cloneNode(true);
    const mapZIndex = getComputedStyle(mapElement).zIndex;

    if (typeof mapZIndex === 'string') mapElement.style.zIndex = 0;

    virtualClone.style.zIndex = -9999;
    virtualClone.style.height = `${mapElement.getBoundingClientRect().height}px`;
    virtualClone.style.width = `${mapElement.getBoundingClientRect().width}px`;
    virtualClone.setAttribute('id', 'virtual-map-container');

    removeElements(virtualClone, 'canvas.maplibregl-canvas');

    const originalCanvas = map.getCanvas();

    map.redraw();
    return new Promise((resolve, reject) => {
        map.once('idle', () => {
            manageOverlayVisibility(map, options, virtualClone);

            const newCanvas = copyCanvas(originalCanvas);
            map.fitBounds(originalBounds, { animate: false });
            virtualClone.getElementsByClassName('maplibregl-canvas-container')[0].append(newCanvas);

            mapElement.append(virtualClone);

            htmlToImage
                .toPng(virtualClone)
                .then((dataUrl) => {

                    targetImageElement.src = dataUrl;
                    mapElement.style.zIndex = mapZIndex;
                    virtualClone.remove();
                    resolve();
                })
                .catch((err) => {
                    console.error('ERROR: ', err)
                    reject(err);
                });
        });
    })
}

/**
 * Manages the visibility of various overlay elements on a virtual map clone based on provided options.
 *
 * @param {object} map - The MapLibre map instance.
 * @param {object} options - Configuration options that dictate which elements to hide or show.
 * @param {boolean} [options.hideAllControls] - Flag to hide all map controls.
 * @param {array} [options.hideControlsInCorner] - Specific corners from which to hide controls.
 * @param {boolean} [options.hideMarkers] - Flag to hide all map markers.
 * @param {boolean} [options.hidePopups] - Flag to hide all map popups.
 * @param {array} [options.hideVisibleLayers] - Layer IDs to hide on the map by setting their visibility to 'none'.
 * @param {array} [options.showHiddenLayers] - Layer IDs to show on the map by setting their visibility to 'visible'.
 * @param {array} [options.bbox] - Optional bounding box to fit the map to, with padding.
 * @param {HTMLElement} virtualClone - The cloned map container where the visibility changes are applied.
 */

function manageOverlayVisibility(map, options, virtualClone) {
    if (options.hideAllControls) {
        removeElements(virtualClone, '.maplibregl-control-container');
    }

    if (options.hideControlsInCorner) {
        options.hideControlsInCorner.forEach((corner) => {
            removeElements(virtualClone, `.maplibregl-ctrl-${corner}`);
        });
    }

    if (options.hideMarkers) {
        removeElements(virtualClone, '.maplibregl-marker');
    }

    if (options.hidePopups) {
        removeElements(virtualClone, '.maplibregl-popup');
    }

    if (options.hideVisibleLayers) {
        options.hideVisibleLayers.forEach((layerId) => {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', 'none');
            } else {
                console.warn(`layer ${layerId} not found`);
            }
        });
    }

    if (options.showHiddenLayers) {
        options.showHiddenLayers.forEach((layerId) => {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', 'visible');
            } else {
                console.warn(`layer ${layerId} not found`);
            }
        });
    }

    if (options.bbox) {
        map.fitBounds(options.bbox, { padding: 20 });
    }
}

/**
 * Removes all DOM elements matching the specified selector within a given parent element.
 *
 * @param {HTMLElement} element - The parent element containing elements to be removed.
 * @param {string} selector - The CSS selector to match elements that should be removed.
 */

function removeElements(element, selector) {
    Array.from(element.querySelectorAll(selector)).forEach((el) => el.remove());
}

/**
 * Creates a new canvas element and copies the content of the given canvas element to it.
 *
 * @param {HTMLElement} canvas - The canvas element to be copied.
 * @returns {HTMLElement} A new canvas element with the same dimensions and content as the original.
 */
function copyCanvas(canvas) {

    const newCanvas = document.createElement('canvas');
    const rect = canvas.getBoundingClientRect();

    newCanvas.width = rect.width;
    newCanvas.height = rect.height;
    newCanvas.style.width = rect.width;
    newCanvas.style.height = rect.height;

    const context = newCanvas.getContext('2d');
    context.drawImage(canvas, 0, 0, rect.width, rect.height);
    return newCanvas;
}
