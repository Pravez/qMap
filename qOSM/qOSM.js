// Where you want to render the map.

var map;
var layer;

var markers = [];

var paths = [];

var mainMarker = undefined;
var mainWindow = undefined;

var LeafIcon;

function initialize() {
    var element = document.getElementById("mapid");

    map = L.map(element);

    layer = L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
        attribution:
            '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    });
    layer.addTo(map);

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

    new QWebChannel(qt.webChannelTransport, function (channel) {
        window.qtWidget = channel.objects.qtWidget;

        /*map.on("dragend", function () {
            center = map.getCenter();
            qtWidget.mapEvent("moved", center.lat, center.lng);
        });

        map.on("click", function (ev) {
            qtWidget.mapEvent("clicked", ev.latlng.lat, ev.latlng.lng);
        });

        map.on("dblclick", function (ev) {
            qtWidget.mapEvent("doubleClicked", ev.latlng.lat, ev.latlng.lng);
        });

        map.on("contextmenu", function (ev) {
            qtWidget.mapEvent("rightClicked", ev.latlng.lat, ev.latlng.lng);
        });*/
    });
}

function osm_setCenter(lat, lng) {
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
    //marker.bindTooltip(key, {className: 'tooltipClass'}).openTooltip();

    if (typeof qtWidget !== "undefined") {
        /*marker.on("dragend", function (event) {
            var marker = event.target;
            qtWidget.markerEvent("moved", key, marker.getLatLng().lat, marker.getLatLng().lng);
        });

        marker.on("click", function (event) {
            var marker = event.target;
            //marker.bindPopup(parameters["title"]);
            qtWidget.markerEvent(
                "clicked",
                key,
                marker.getLatLng().lat,
                marker.getLatLng().lng
            );
        });

        marker.on("dbclick", function (event) {
            var marker = event.target;
            qtWidget.markerEvent(
                "doubleClicked",
                key,
                marker.getLatLng().lat,
                marker.getLatLng().lng
            );
        });

        marker.on("contextmenu", function (event) {
            var marker = event.target;
            qtWidget.markerEvent(
                "rightClicked",
                key,
                marker.getLatLng().lat,
                marker.getLatLng().lng
            );
        });*/
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

function osm_createMainMarker(latlng, color = "orange", fillColor = "yellow", radius = 7) {
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
    if (!mainMarker) {
        osm_createMainMarker(latlng);
    }

    mainMarker.setLatLng(latlng);
}

function osm_createMainWindow(p1, p2, p3, p4, color = "blue", fillColor = "green", strokeSize = 5) {
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
    if (!mainWindow) {
        osm_createMainWindow(p1, p2, p3, p4);
    }

    mainWindow.setLatLngs([p1, p2, p3, p4]);
}

function osm_clearMarkers() {
    for(key in markers) {
        if (markers.hasOwnProperty(key)) {
            markers[key].remove();
        }
    }
    markers = []
}

function osm_clearPaths() {
    for(key in paths) {
        if (paths.hasOwnProperty(key)) {
            paths[key].remove();
        }
    }
    paths = []
}

function osm_clearMainWindowAndMarker() {
    if (mainWindow) {
        mainWindow.remove();
        mainWindow = undefined;
    }
    if (mainMarker) {
        mainMarker.remove();
        mainMarker = undefined;
    }
}

function osm_clear() {
    osm_clearPaths();
    osm_clearMarkers();
    osm_clearMainWindowAndMarker();
}

function osm_getMarkerColor(key) {
    return marker[key].options.icon.options.iconUrl;
}