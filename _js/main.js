var map = L.map('mapid', {
    center: [39.138582, -101.782186],
    zoom: 4,
    minZoom: 4,
    maxBounds: [[78.242545,-191.254831],[3.320705,-32.799767]]
});

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoicGpiZXJuYXJkLXV3bWFkaXNvbiIsImEiOiJjamxyN29ldGowMjZ5M3VqcjI3eWE5NGxxIn0.WdZos8IUeTiGoI4BW3vyjQ'
}).addTo(map);


    