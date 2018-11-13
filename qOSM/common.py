from PyQt5.QtWebChannel import QWebChannel

from .config import config

doTrace = False

import json
import os

import decorator

backend = config['backend']

if backend == "PyQt5":
    from PyQt5.QtCore import pyqtSignal, QUrl, QEvent, QObject
    from PyQt5.QtWebEngineWidgets import QWebEnginePage
    from PyQt5.QtWebEngineWidgets import QWebEngineView
    from PyQt5.QtWidgets import QApplication
else:
    raise Exception("Works only with PyQt5")

@decorator.decorator
def trace(function, *args, **k):
    """Decorates a function by tracing the begining and
    end of the function execution, if doTrace global is True"""

    if doTrace:
        print("> " + function.__name__, args, k)
    result = function(*args, **k)
    if doTrace:
        print("< " + function.__name__, args, k, "->", result)
    return result


class _LoggedPage(QWebEnginePage):
    @trace
    def javaScriptConsoleMessage(self, QWebEnginePage_JavaScriptConsoleMessageLevel, p_str, p_int, p_str_1):
        print('[%s], JS: %s line %d: %s' % (QWebEnginePage_JavaScriptConsoleMessageLevel, p_str, p_int, p_str_1))



class QOSM(QWebEngineView):
    mapMoved = pyqtSignal(float, float)
    mapClicked = pyqtSignal(float, float)
    mapRightClicked = pyqtSignal(float, float)
    mapDoubleClicked = pyqtSignal(float, float)

    markerMoved = pyqtSignal(str, float, float)
    markerClicked = pyqtSignal(str, float, float)
    markerDoubleClicked = pyqtSignal(str, float, float)
    markerRightClicked = pyqtSignal(str, float, float)



    def __init__(self, parent=None, debug=True):
        QWebEngineView.__init__(self, parent=parent)

        self.page().profile().setCachePath("cache")

        self.initialized = False


        basePath = os.path.abspath(os.path.dirname(__file__))
        url = 'file://' + basePath + '/qOSM.html'
        self.load(QUrl(url))

        self.web_channel = QWebChannel()
        self.page().setWebChannel(self.web_channel)
        self.web_channel.registerObject("qtWidget", self)

        self.loadFinished.connect(self.onLoadFinished)
        #self.linkClicked.connect(QDesktopServices.openUrl)



    def onLoadFinished(self, ok):
        if self.initialized:
            return

        if not ok:
            print("Error initializing OpenStreetMap")

        self.initialized = True
        self.centerAt(0, 0)
        self.setZoom(0)

    def waitUntilReady(self):
        while not self.initialized:
            QApplication.processEvents()

    def runScript(self, script):
        return self.page().runJavaScript(script)

    def centerAt(self, latitude, longitude):
        self.runScript("osm_setCenter({}, {})".format(latitude, longitude))

    def setZoom(self, zoom):
        self.runScript("osm_setZoom({})".format(zoom))

    def center(self):
        center = self.runScript("osm_getCenter()")
        return center['lat'], center['lng']

    def addMarker(self, key, latitude, longitude, **extra):
        return self.runScript("osm_addMarker(key={!r},"
                              "latitude= {}, "
                              "longitude= {}, {});".format(key, latitude, longitude, json.dumps(extra)))

    def moveMarker(self, key, latitude, longitude):
        self.runScript("osm_moveMarker(key={!r},"
                       "latitude= {}, "
                       "longitude= {});".format(key, latitude, longitude))

    def removeMarker(self, key):
        self.runScript("osm_deleteMarker(key={!r}".format(key))

    def positionMarker(self, key):
        return tuple(self.runScript("osm_posMarker(key={!r});".format(key)))

    def setMarkerIcon(self, key, iconUrl):
        self.runScript(
            "osm_setMarkerIcon(key={!r}, iconUrl={})".format(key, iconUrl))

    def drawPath(self, key, latlngs, color, fitBounds):
        self.runScript("osm_drawPath(key={!r}, "
                       "latlngs={}, "
                       "color = \"{}\","
                       "fitBounds= {})".format(key, latlngs, color, "true" if fitBounds else "false"))

    def removePath(self, key):
        self.runScript("osm_removePath(key={!r})".format(key))

    def hasMarker(self, key):
        self.runScript("osm_hasMarker(key={!r})".format(key))

    def createMainMarker(self, latlng, color="red", fill_color="red", radius=1):
        self.runScript("osm_createMainMarker(latlng={}, color=\"{}\", fillColor=\"{}\", radius={})".format([*latlng], color, fill_color, radius))

    def moveMainMarker(self, latlng):
        return self.runScript("osm_moveMainMarker(latlng={})".format([*latlng]))

    def createMainWindow(self, window, color, fillColor, strokeSize):
        self.runScript("osm_createMainWindow(p1={}, p2={}, p3={}, p4={}, color=\"{}\", fillColor=\"{}\", strokeSize={})"
                       .format(*window, color, fillColor, strokeSize))

    def moveMainWindow(self, window):
        return self.runScript("osm_moveMainWindow(p1={}, p2={}, p3={}, p4={})".format(*window))

    def redraw(self):
        return self.runScript("osm_redraw()")

    def clear(self):
        self.runScript("osm_clear()")

    def clearMarkers(self):
        self.runScript("osm_clearMarkers()")

    def clearPaths(self):
        self.runScript("osm_clearPaths()")

    def clearMainObjects(self):
        self.runScript("osm_clearMainWindowAndMarker()")

    def getMarkerColor(self, key):
        return self.runScript("osm_getMarkerColor(key={})".format(key))

