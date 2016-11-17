/**
 * Copyright Marc J. Schmidt. See the LICENSE file at the top-level
 * directory of this distribution and at
 * https://github.com/marcj/css-element-queries/blob/master/LICENSE.
 */
;
(function ( root, factory ) {
    if ( typeof define === "function" && define.amd ) {
        define(factory);
    } else if ( typeof exports === "object" ) {
        module.exports = factory();
    } else {
        root.ResizeSensor = factory();
    }
}( this, function () {


    var events = new EventQueue();

    /**
     * Class for dimension change detection.
     *
     * @param {Element|Element[]|Elements|jQuery} element
     * @param {Function} callback
     *
     * @constructor
     */
    var ResizeSensor = function ( element, callback ) {
        var that = this;

        // Add class variables here
        that.element = element;
        that.callback = callback;

        forEachElement( element, function( elem ){
            if( !elem.resizeSensor ) {
                appendDetectors( that, elem );
            }

            events.add( elem, callback );
        });
    };

    ResizeSensor.prototype = {
        constructor: ResizeSensor,

        detach: function ResizeSensorDetach ( ev, element ) {
            ResizeSensor.detach( element || this.element, ev );
        },

        reset: function ResizeSensorResize () {
            forEachElement( element, function( elem ){
                if( elem.resizeSensor ) {
                    reset( that, elem );
                }
            });
        }
    };

    /**
     * Function for appending the detectors to the elements
     */
    function appendDetectors ( that, element ) {
        var style = 'display: block; position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: scroll; z-index: -1; visibility: hidden;',
            styleChild = 'position: absolute; left: 0; top: 0; transition: 0s;';

        // Set the elements position to enable the ability to use top/right/bottom/left
        if ( getComputedStyle(element, 'position') == 'static' ) {
            element.style.position = 'relative';
        }

        // Create the sensor element and set the styles and innerHTML
        var rSE = document.createElement( 'resize-sensor' );
        rSE.className = 'resize-sensor';

        rSE.style.cssText = style;
        rSE.innerHTML =
            '<div class="resize-sensor-detector resize-sensor-expand" style="' + style + '">' +
                '<div style="' + styleChild + '"></div>' +
            '</div>' +
            '<div class="resize-sensor-detector resize-sensor-shrink" style="' + style + '">' +
                '<div style="' + styleChild + ' width: 200%; height: 200%"></div>' +
            '</div>'

        rSE.element = element;
        
        rSE.resetting = false;

        rSE.lastWidth = element.offsetWidth;
        rSE.lastHeight = element.offsetHeight;
        rSE.cacheWidth = null;
        rSE.cacheHeight = null;

        rSE.expand = rSE.childNodes[0];
        rSE.expandChild = rSE.expand.childNodes[0];
        rSE.shrink = rSE.childNodes[1];
        rSE.shrinkChild = rSE.shrink.childNodes[0];

        rSE.detach = function ResizeSensorDetach () {
            that.detach( that.callback, element );
        };

        rSE.reset = function ResizeSensorReset () {
            reset( rSE );
        };

        element.resizeSensor = rSE;
    
        element.appendChild( element.resizeSensor );
        reset( element.resizeSensor );
    }

    /**
     * Class for event queueing and management
     * 
     * @constructor
     */
    function EventQueue () {
        var that = this,
            q = {},
            guid = 1;
        this.add = function ( element, ev ) {
            var guid = element.guid || 'rs-' + (guid++);
            element.rsguid = guid;
            q[guid] = q[guid] || [];
            q[guid].push( ev );
        };

        var i, j;
        this.call = function ( element, context, arguments ) {
            var guid = element.rsguid || '';
            if( !!q[guid] ) {
                var evl = q[guid];
                for ( i = 0, j = evl.length; i < j; i++ ) {
                    evl[i].apply( context, arguments );
                }
            }
        };

        this.remove = function ( element, ev ) {
            var newQueue = [];
            if( !!q[element.rsguid] ) {
                var evl = q[element.rsguid];
                for( i = 0, j = evl.length; i < j; i++ ) {
                    if(evl[i] !== ev) {
                        newQueue.push( evl[i] );
                    }
                }
                q[element.rsguid] = newQueue;
            }
        };

        this.length = function ( element ) {
            if( !!q[element.rsguid] ) {
                return q[element.rsguid].length;
            }
        };
    }


    var collectionTypes = ['[object Array]', '[object NodeList]', '[object HTMLCollection]'];
    /**
     * Iterate over each of the provided element(s).
     *
     * @param {HTMLElement|HTMLElement[]} elements
     * @param {Function}                  callback
     */
    function forEachElement ( elements, callback ){
        if( !elements ) {
            return;
        }
        var elementsType = Object.prototype.toString.call( elements ),
            isVanillaCollection = collectionTypes.indexOf(elementsType) != -1,
            isJQueryCollection = 'undefined' !== typeof Elements && elements instanceof Elements,
            isMooToolsCollection = 'undefined' !== typeof Elements && elements instanceof Elements,
            isCollectionTyped = isVanillaCollection || isJQueryCollection || isMooToolsCollection,

            i = 0, j = elements.length;
        if ( isCollectionTyped ) {
            for (; i < j; i++) {
                callback( elements[i] );
            }
        } else {
            callback( elements );
        }
    }

    /**
     * @param {HTMLElement} element
     * @param {String}      prop
     * @returns {String|Number}
     */
    function getComputedStyle ( element, prop ) {
        if ( element.currentStyle ) {
            return element.currentStyle[prop];
        } else if ( window.getComputedStyle ) {
            return window.getComputedStyle( element, null ).getPropertyValue( prop );
        } else {
            return element.style[prop];
        }
    }

    function hasClass ( element, className ) {
        return (" "+ element.className +" ").replace(/[\n\t]/g, " ").indexOf(" "+ className +" ") > -1;
    }

    function live (eventType, elementQuerySelector, cb) {
        document.addEventListener( eventType, function (event) {
            var qs = document.querySelectorAll(elementQuerySelector);

            if (qs) {
                var el = event.target, index = -1;
                while (el && ((index = Array.prototype.indexOf.call(qs, el)) === -1)) {
                    el = el.parentElement;
                }

                if (index > -1) {
                    cb.call(el, event);
                }
            }
        }, true );
    }

    /**
     * Reset the size and scroll position of the resizeSensor element
     * @param  {[type]} rSE resizeSensor Element
     */
    function reset ( rSE ) {
        rSE.resetting = true;
        rSE.expandChild.style.width  = '100000px';
        rSE.expandChild.style.height = '100000px';
        
        
        rSE.expand.scrollLeft = 100000;
        rSE.expand.scrollTop = 100000;
        
        rSE.shrink.scrollLeft = 100000;
        rSE.shrink.scrollTop = 100000;
        rSE.resetting = false;
    }

    function scrollHandler ( ev ) {
        var
            that = this,
            detector = ev.target,
            
            type,
            rSE = detector.parentNode,
            elem = rSE.element;
        if( elem && !rSE.resetting ) {
            if (
                elem.offsetWidth != rSE.lastWidth
                || elem.offsetHeight != rSE.lastHeight
            ) {
                events.call( elem, elem, [
                    ev,
                    {
                        width: rSE.offsetWidth,
                        widthDifference: rSE.offsetWidth - rSE.lastWidth,
                        height: rSE.offsetHeight,
                        heightDifference: rSE.offsetHeight - rSE.lastHeight
                    }
                ]);

                rSE.lastWidth = rSE.offsetWidth;
                rSE.lastHeight = rSE.offsetHeight;
            }
            reset( rSE );
        }
    }

    ResizeSensor.detach = function( element, ev ) {
        forEachElement( element, function( elem ){
            if( typeof ev == "function" ){
                events.remove( elem, ev );
                if( elem.resizedAttached.length( elem ) ) {
                    return;
                }
            }
            if ( elem.resizeSensor ) {
                if(elem.resizeSensor.parentNode) {
                    elem.removeChild( elem.resizeSensor );
                }
                delete elem.resizeSensor;
                delete elem.resizedAttached;
            }
        });
    };
    
    // use only one event for all sensors
    live( 'scroll', '.resize-sensor', scrollHandler );

    return ResizeSensor;
}));
