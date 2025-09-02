import * as htmlToImage from 'html-to-image';

/**
 * Creates a raster image from a MapLibre map. The map is first captured as a virtual
 * clone, and then the image is generated from this clone. This process allows the
 * image to be rendered with all of the map's overlays and controls visible.
 * @param {object} map - The MapLibre map instance.
 * @param {object} options - Configuration options that dictate how the image should be generated.
 * @param {string} [options.targetImageId] - REQUIRED: The ID of the HTML element where the image should be inserted.
 * @param {boolean} [options.hideAllControls] - Flag to hide all map controls.
 * @param {array} [options.hideControlsInCorner] - Specific corners from which to hide controls.
 * @param {boolean} [options.hideMarkers] - Flag to hide all map markers.
 * @param {boolean} [options.hidePopups] - Flag to hide all map popups.
 * @param {array} [options.hideVisibleLayers] - Layer IDs to hide on the map by setting their visibility to 'none'.
 * @param {array} [options.showHiddenLayers] - Layer IDs to show on the map by setting their visibility to 'visible'.
 * @param {array} [options.bbox] - Optional bounding box to fit the map to, with padding.
 * @param {boolean} [options.coverEdits] - Flag to prevent seeing any map edits by capturing a background image before the map is rendered.
 * @param {string} [options.format] - The format of the generated image. Possible values are 'jpeg', 'png', 'svg', and 'canvas'.
 * @param {object} [options.htmlToImageOptions] - additonal options for htmlToImage
 * @returns {Promise} A promise that resolves when the image has been generated and inserted into the page.
 */
export async function toElement(map, options) {
   
    const mapElement = map.getContainer();
    let originalBounds = map.getBounds();
    
    const originalCanvas = map.getCanvas();
   
    const targetImageElement = document.getElementById(options.targetImageId);
    const virtualClone = mapElement.cloneNode(true);
    const mapZIndex = getComputedStyle(mapElement).zIndex;

    mapElement.style.height = `${mapElement.getBoundingClientRect().height}px`;
    mapElement.style.width = `${mapElement.getBoundingClientRect().width}px`;
    
    let photocover;
    const preserveDrawingBuffer = (map?._canvasContextAttributes?.preserveDrawingBuffer);

    const _coverEdits = options.coverEdits === false ? false : true;

    if(_coverEdits){
        if(!preserveDrawingBuffer){
            map._canvasContextAttributes = map?._canvasContextAttributes || {}; 
            map._canvasContextAttributes.preserveDrawingBuffer = true;
            map.redraw();
            console.warn("Setting the map's initial preserveDrawingBuffer setting to true may prevent screen flicker.");
        }
       
        const coverData = await htmlToImage.toPng(mapElement);
        photocover = document.createElement('img');
        mapElement.parentNode.prepend(photocover);
        photocover.style.height = `${mapElement.getBoundingClientRect().height}px`;
        photocover.style.width = `${mapElement.getBoundingClientRect().width}px`;
        photocover.style.position = 'absolute';
        photocover.style.top = '0';
        photocover.style.left = '0';
        photocover.style.zIndex = 999;
        photocover.setAttribute('id', 'photocover');
        photocover.src = coverData;
    }

    if (typeof mapZIndex === 'string') mapElement.style.zIndex = 0;

    virtualClone.style.zIndex = -9999;
    virtualClone.style.height = `${mapElement.getBoundingClientRect().height}px`;
    virtualClone.style.width = `${mapElement.getBoundingClientRect().width}px`;
    virtualClone.setAttribute('id', 'virtual-map-container');
    removeElements(virtualClone, 'canvas.maplibregl-canvas');


    if (options.bbox) {
        map.fitBounds(options.bbox, { animate: false });
    }
    map.redraw();

    // temp fix to https://github.com/bubkoo/html-to-image/issues/535
    const htmlToImageOptions = options.htmlToImageOptions || {}
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
    if (isFirefox) {
        htmlToImageOptions.skipFonts = true
    }

    return new Promise((resolve, reject) => {
        map.once('idle', () => {

            manageOverlayVisibility(map, options, virtualClone);

            const newCanvas = copyCanvas(originalCanvas);
            map.fitBounds(originalBounds, { animate: false });
            virtualClone.getElementsByClassName('maplibregl-canvas-container')[0].append(newCanvas);

            mapElement.append(virtualClone);
           
            let imgFunc;
            switch (options.format) {
                case 'jpeg':
                    imgFunc = htmlToImage.toJpeg;
                    break;
                case 'svg':
                    imgFunc = htmlToImage.toSvg;
                    break;
                case 'canvas':
                    imgFunc = htmlToImage.toCanvas;
                    break;
                case 'png':
                default:
                    imgFunc = htmlToImage.toPng;
                    break;
            }
            
            imgFunc(virtualClone, htmlToImageOptions)
                .then((dataUrl) => {
                    targetImageElement.src = dataUrl;
                    mapElement.style.zIndex = mapZIndex;
                    virtualClone.remove();
                    map._canvasContextAttributes.preserveDrawingBuffer = preserveDrawingBuffer;
                    if(photocover){
                        photocover.remove();
                    }
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
