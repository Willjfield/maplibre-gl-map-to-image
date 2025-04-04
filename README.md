# maplibre-gl-map-to-image

A JavaScript library that generates an HTML image element with a PNG source from a Maplibre GL JS map. The library allows users to customize the map image by selecting which overlays to include or exclude, such as markers, popups, and controls. It also allows the map to fit a bounding box only for the purpose of image generation.

## Features

* Generate a PNG image from a Maplibre GL JS map
* Customize the image by selecting which overlays to include:
	+ Markers
	+ Popups
	+ Controls
* Render overlays outside of the main Maplibre WebGL canvas context
* Set the source of an existing HTML `img` element to the generated PNG data

## Future Development

* Support for generating images in formats other than PNG
* Direct access to image data for use cases like direct downloading
* Support different image resolutions and aspect ratios that may not match the current map canvas

## Dependencies

* [htmlToImage](https://www.npmjs.com/package/html-to-image)

## Usage

To use this library, simply call the `toPng` function and pass in your Maplibre GL JS map instance, along with options for which overlays to include. The function will return a PNG image that can be set as the source of an existing HTML `img` element.

```javascript
import { toPng } from 'maplibre-image-generator';

const map = new maplibregl.Map({
  // your map options here
});

const targetImage = document.getElementById('target-image');

const options = {
    targetImageId, //* @param {string} REQUIRED: The ID of the target image element where the PNG will be set.
    [bbox], //* @param {array} Optional bounding box to fit the map before conversion.
    hideAllControls, //* @param {boolean} Flag to hide all map controls during conversion.
    [hideControlsInCorner], //* @param {array} Specific corners to hide controls from.
    hideMarkers, //* @param {boolean} Flag to hide markers during conversion.
    hidePopups, //* @param {boolean} Flag to hide popups during conversion.
    [hideVisibleLayers], //* @param {array}Layer IDs to hide during conversion.
    [showHiddenLayers], //* @param {array} Layer IDs to show during conversion.
}

await toPng(map, options);

```
