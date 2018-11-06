// Where you want to render the map.

var map;

var markers = [];

var paths = [];

var mainMarker = undefined;
var mainWindow = undefined;

var LeafIcon;

function initialize() {
    var element = document.getElementById("mapid");

    map = L.map(element);

    L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
        attribution:
            '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    if (typeof qtWidget !== "undefined") {
        map.on("dragend", function () {
            center = map.getCenter();
            qtWidget.mapMoved(center.lat, center.lng);
        });

        map.on("click", function (ev) {
            qtWidget.mapClicked(ev.latlng.lat, ev.latlng.lng);
        });

        map.on("dblclick", function (ev) {
            qtWidget.mapDoubleClicked(ev.latlng.lat, ev.latlng.lng);
        });

        map.on("contextmenu", function (ev) {
            qtWidget.mapRightClicked(ev.latlng.lat, ev.latlng.lng);
        });
    }

    LeafIcon = L.Icon.extend({
        options: {
            shadowUrl: "leaf-shadow.png",
            iconSize: [38, 95],
            shadowSize: [50, 64],
            iconAnchor: [22, 94],
            shadowAnchor: [4, 62],
            popupAnchor: [-3, -76]
        }
    });
}

function osm_setCenter(lat, lng) {
    //console.log(lat);
    map.panTo(new L.LatLng(lat, lng));
}

function osm_getCenter() {
    return map.getCenter();
}

function osm_setZoom(zoom) {
    map.setZoom(zoom);
}

function osm_addMarker(key, latitude, longitude, parameters) {
    if (key in markers) {
        osm_deleteMarker(key);
    }

    if ("icon" in parameters) {
        parameters["icon"] = new L.Icon({
            iconUrl: parameters["icon"],
            iconAnchor: new L.Point(16, 16)
        });
    }

    var marker = L.marker([latitude, longitude], parameters).addTo(map);

    if (typeof qtWidget !== "undefined") {
        marker.on("dragend", function (event) {
            var marker = event.target;
            qtWidget.markerMoved(key, marker.getLatLng().lat, marker.getLatLng().lng);
        });

        marker.on("click", function (event) {
            var marker = event.target;
            //marker.bindPopup(parameters["title"]);
            qtWidget.markerClicked(
                key,
                marker.getLatLng().lat,
                marker.getLatLng().lng
            );
        });

        marker.on("dbclick", function (event) {
            var marker = event.target;
            qtWidget.markerClicked(
                key,
                marker.getLatLng().lat,
                marker.getLatLng().lng
            );
        });

        marker.on("contextmenu", function (event) {
            var marker = event.target;
            qtWidget.markerRightClicked(
                key,
                marker.getLatLng().lat,
                marker.getLatLng().lng
            );
        });
    }

    markers[key] = marker;
    return key;
}

function osm_setMarkerIcon(key, iconUrl) {
    if (key in markers) {
        markers[key].setIcon(
            new L.Icon({
                iconUrl: iconUrl,
                iconAnchor: new L.Point(16, 16)
            })
        );
    }
}

function osm_deleteMarker(key) {
    map.removeLayer(markers[key]);
    delete markers[key];
}

function osm_moveMarker(key, latitude, longitude) {
    marker = markers[key];
    var newLatLng = new L.LatLng(latitude, longitude);
    marker.setLatLng(newLatLng);
}

function osm_posMarker(key) {
    marker = markers[key];
    return [marker.getLatLng().lat, marker.getLatLng().lng];
}

function osm_drawPath(key, latlngs, color = "blue", fitBounds = true) {
    if (latlngs.length <= 0) {
        return;
    }

    var polyline = L.polyline(latlngs, {color: color});
    paths[key] = polyline;

    polyline.addTo(map);

    if (fitBounds) {
        map.fitBounds(polyline.getBounds());
    }
}

function osm_removePath(key) {
    paths[key].remove();
}

function osm_hasMarker(key) {
    return markers.hasOwnProperty(key)
}

function osm_createMainMarker(latlng, color = "red", fillColor = "red", radius = 1) {
    mainMarker = L.circleMarker(latlng, {
        radius: radius,
        color: color,
        fill: true,
        fillOpacity: 0.8,
        fillColor: fillColor
    });

    mainMarker.addTo(map);
}

function osm_moveMainMarker(latlng) {
    if (mainMarker) {
        mainMarker.setLatLng(latlng);
        return true;
    }

    return false;
}

function osm_createMainWindow(p1, p2, p3, p4, color, fillColor, strokeSize) {
    mainWindow = L.polygon([p1, p2, p3, p4], {
        color: color,
        fillColor: fillColor,
        weight: strokeSize,
        fill: true,
        fillOpacity: 0.8
    });

    mainWindow.addTo(map)
}

function osm_moveMainWindow(p1, p2, p3, p4) {
    if (mainWindow) {
        mainWindow.setLatLngs([p1, p2, p3, p4]);
        return true;
    }

    return false;
}

function osm_cleanEverything() {
    markers.forEach(element => element.remove());
    marker.clear();

    mainWindow.remove();
    mainWindow = undefined;
    mainMarker.remove();
    mainMarker = undefined;
}