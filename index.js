import * as htmlToImage from 'html-to-image';
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

function removeElements(element, selector) {
    Array.from(element.querySelectorAll(selector)).forEach((el) => el.remove());
}

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
