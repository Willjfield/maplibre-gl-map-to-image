import {toElement} from '../../index.js';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    center: [0, 0],
    zoom: 0,
    canvasContextAttributes: {
        preserveDrawingBuffer: false
    }
});

const options = {
    targetImageId: 'image',
    bbox: [-80, 20, -60, 60],
    coverEdits: true
};

function createImage(){
    toElement(map, options);
}

document.getElementById('create-image').addEventListener('click', createImage);
