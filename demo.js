import {toElement} from './index.js';

console.log('test')
const map = new window.maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    center: [0, 0],
    zoom: 0
});

const options = {
    targetImageId: 'image'
};

toElement(map, options);
