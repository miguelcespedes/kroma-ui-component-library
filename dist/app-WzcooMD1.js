(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
var top = "top";
var bottom = "bottom";
var right = "right";
var left = "left";
var auto = "auto";
var basePlacements = [top, bottom, right, left];
var start = "start";
var end = "end";
var clippingParents = "clippingParents";
var viewport = "viewport";
var popper = "popper";
var reference = "reference";
var variationPlacements = /* @__PURE__ */ basePlacements.reduce(function(acc, placement) {
  return acc.concat([placement + "-" + start, placement + "-" + end]);
}, []);
var placements = /* @__PURE__ */ [].concat(basePlacements, [auto]).reduce(function(acc, placement) {
  return acc.concat([placement, placement + "-" + start, placement + "-" + end]);
}, []);
var beforeRead = "beforeRead";
var read = "read";
var afterRead = "afterRead";
var beforeMain = "beforeMain";
var main = "main";
var afterMain = "afterMain";
var beforeWrite = "beforeWrite";
var write = "write";
var afterWrite = "afterWrite";
var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];
function getNodeName(element) {
  return element ? (element.nodeName || "").toLowerCase() : null;
}
function getWindow(node) {
  if (node == null) {
    return window;
  }
  if (node.toString() !== "[object Window]") {
    var ownerDocument = node.ownerDocument;
    return ownerDocument ? ownerDocument.defaultView || window : window;
  }
  return node;
}
function isElement$1(node) {
  var OwnElement = getWindow(node).Element;
  return node instanceof OwnElement || node instanceof Element;
}
function isHTMLElement(node) {
  var OwnElement = getWindow(node).HTMLElement;
  return node instanceof OwnElement || node instanceof HTMLElement;
}
function isShadowRoot(node) {
  if (typeof ShadowRoot === "undefined") {
    return false;
  }
  var OwnElement = getWindow(node).ShadowRoot;
  return node instanceof OwnElement || node instanceof ShadowRoot;
}
function applyStyles(_ref) {
  var state = _ref.state;
  Object.keys(state.elements).forEach(function(name) {
    var style = state.styles[name] || {};
    var attributes = state.attributes[name] || {};
    var element = state.elements[name];
    if (!isHTMLElement(element) || !getNodeName(element)) {
      return;
    }
    Object.assign(element.style, style);
    Object.keys(attributes).forEach(function(name2) {
      var value = attributes[name2];
      if (value === false) {
        element.removeAttribute(name2);
      } else {
        element.setAttribute(name2, value === true ? "" : value);
      }
    });
  });
}
function effect$2(_ref2) {
  var state = _ref2.state;
  var initialStyles = {
    popper: {
      position: state.options.strategy,
      left: "0",
      top: "0",
      margin: "0"
    },
    arrow: {
      position: "absolute"
    },
    reference: {}
  };
  Object.assign(state.elements.popper.style, initialStyles.popper);
  state.styles = initialStyles;
  if (state.elements.arrow) {
    Object.assign(state.elements.arrow.style, initialStyles.arrow);
  }
  return function() {
    Object.keys(state.elements).forEach(function(name) {
      var element = state.elements[name];
      var attributes = state.attributes[name] || {};
      var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]);
      var style = styleProperties.reduce(function(style2, property) {
        style2[property] = "";
        return style2;
      }, {});
      if (!isHTMLElement(element) || !getNodeName(element)) {
        return;
      }
      Object.assign(element.style, style);
      Object.keys(attributes).forEach(function(attribute) {
        element.removeAttribute(attribute);
      });
    });
  };
}
const applyStyles$1 = {
  name: "applyStyles",
  enabled: true,
  phase: "write",
  fn: applyStyles,
  effect: effect$2,
  requires: ["computeStyles"]
};
function getBasePlacement(placement) {
  return placement.split("-")[0];
}
var max = Math.max;
var min = Math.min;
var round = Math.round;
function getUAString() {
  var uaData = navigator.userAgentData;
  if (uaData != null && uaData.brands && Array.isArray(uaData.brands)) {
    return uaData.brands.map(function(item) {
      return item.brand + "/" + item.version;
    }).join(" ");
  }
  return navigator.userAgent;
}
function isLayoutViewport() {
  return !/^((?!chrome|android).)*safari/i.test(getUAString());
}
function getBoundingClientRect(element, includeScale, isFixedStrategy) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  var clientRect = element.getBoundingClientRect();
  var scaleX = 1;
  var scaleY = 1;
  if (includeScale && isHTMLElement(element)) {
    scaleX = element.offsetWidth > 0 ? round(clientRect.width) / element.offsetWidth || 1 : 1;
    scaleY = element.offsetHeight > 0 ? round(clientRect.height) / element.offsetHeight || 1 : 1;
  }
  var _ref = isElement$1(element) ? getWindow(element) : window, visualViewport = _ref.visualViewport;
  var addVisualOffsets = !isLayoutViewport() && isFixedStrategy;
  var x = (clientRect.left + (addVisualOffsets && visualViewport ? visualViewport.offsetLeft : 0)) / scaleX;
  var y = (clientRect.top + (addVisualOffsets && visualViewport ? visualViewport.offsetTop : 0)) / scaleY;
  var width = clientRect.width / scaleX;
  var height = clientRect.height / scaleY;
  return {
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    x,
    y
  };
}
function getLayoutRect(element) {
  var clientRect = getBoundingClientRect(element);
  var width = element.offsetWidth;
  var height = element.offsetHeight;
  if (Math.abs(clientRect.width - width) <= 1) {
    width = clientRect.width;
  }
  if (Math.abs(clientRect.height - height) <= 1) {
    height = clientRect.height;
  }
  return {
    x: element.offsetLeft,
    y: element.offsetTop,
    width,
    height
  };
}
function contains(parent, child) {
  var rootNode = child.getRootNode && child.getRootNode();
  if (parent.contains(child)) {
    return true;
  } else if (rootNode && isShadowRoot(rootNode)) {
    var next = child;
    do {
      if (next && parent.isSameNode(next)) {
        return true;
      }
      next = next.parentNode || next.host;
    } while (next);
  }
  return false;
}
function getComputedStyle$1(element) {
  return getWindow(element).getComputedStyle(element);
}
function isTableElement(element) {
  return ["table", "td", "th"].indexOf(getNodeName(element)) >= 0;
}
function getDocumentElement(element) {
  return ((isElement$1(element) ? element.ownerDocument : (
    // $FlowFixMe[prop-missing]
    element.document
  )) || window.document).documentElement;
}
function getParentNode(element) {
  if (getNodeName(element) === "html") {
    return element;
  }
  return (
    // this is a quicker (but less type safe) way to save quite some bytes from the bundle
    // $FlowFixMe[incompatible-return]
    // $FlowFixMe[prop-missing]
    element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
    element.parentNode || // DOM Element detected
    (isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
    // $FlowFixMe[incompatible-call]: HTMLElement is a Node
    getDocumentElement(element)
  );
}
function getTrueOffsetParent(element) {
  if (!isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
  getComputedStyle$1(element).position === "fixed") {
    return null;
  }
  return element.offsetParent;
}
function getContainingBlock(element) {
  var isFirefox = /firefox/i.test(getUAString());
  var isIE = /Trident/i.test(getUAString());
  if (isIE && isHTMLElement(element)) {
    var elementCss = getComputedStyle$1(element);
    if (elementCss.position === "fixed") {
      return null;
    }
  }
  var currentNode = getParentNode(element);
  if (isShadowRoot(currentNode)) {
    currentNode = currentNode.host;
  }
  while (isHTMLElement(currentNode) && ["html", "body"].indexOf(getNodeName(currentNode)) < 0) {
    var css = getComputedStyle$1(currentNode);
    if (css.transform !== "none" || css.perspective !== "none" || css.contain === "paint" || ["transform", "perspective"].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === "filter" || isFirefox && css.filter && css.filter !== "none") {
      return currentNode;
    } else {
      currentNode = currentNode.parentNode;
    }
  }
  return null;
}
function getOffsetParent(element) {
  var window2 = getWindow(element);
  var offsetParent = getTrueOffsetParent(element);
  while (offsetParent && isTableElement(offsetParent) && getComputedStyle$1(offsetParent).position === "static") {
    offsetParent = getTrueOffsetParent(offsetParent);
  }
  if (offsetParent && (getNodeName(offsetParent) === "html" || getNodeName(offsetParent) === "body" && getComputedStyle$1(offsetParent).position === "static")) {
    return window2;
  }
  return offsetParent || getContainingBlock(element) || window2;
}
function getMainAxisFromPlacement(placement) {
  return ["top", "bottom"].indexOf(placement) >= 0 ? "x" : "y";
}
function within(min$1, value, max$1) {
  return max(min$1, min(value, max$1));
}
function withinMaxClamp(min2, value, max2) {
  var v = within(min2, value, max2);
  return v > max2 ? max2 : v;
}
function getFreshSideObject() {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
}
function mergePaddingObject(paddingObject) {
  return Object.assign({}, getFreshSideObject(), paddingObject);
}
function expandToHashMap(value, keys) {
  return keys.reduce(function(hashMap, key) {
    hashMap[key] = value;
    return hashMap;
  }, {});
}
var toPaddingObject = function toPaddingObject2(padding, state) {
  padding = typeof padding === "function" ? padding(Object.assign({}, state.rects, {
    placement: state.placement
  })) : padding;
  return mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
};
function arrow(_ref) {
  var _state$modifiersData$;
  var state = _ref.state, name = _ref.name, options = _ref.options;
  var arrowElement = state.elements.arrow;
  var popperOffsets2 = state.modifiersData.popperOffsets;
  var basePlacement = getBasePlacement(state.placement);
  var axis = getMainAxisFromPlacement(basePlacement);
  var isVertical = [left, right].indexOf(basePlacement) >= 0;
  var len = isVertical ? "height" : "width";
  if (!arrowElement || !popperOffsets2) {
    return;
  }
  var paddingObject = toPaddingObject(options.padding, state);
  var arrowRect = getLayoutRect(arrowElement);
  var minProp = axis === "y" ? top : left;
  var maxProp = axis === "y" ? bottom : right;
  var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets2[axis] - state.rects.popper[len];
  var startDiff = popperOffsets2[axis] - state.rects.reference[axis];
  var arrowOffsetParent = getOffsetParent(arrowElement);
  var clientSize = arrowOffsetParent ? axis === "y" ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
  var centerToReference = endDiff / 2 - startDiff / 2;
  var min2 = paddingObject[minProp];
  var max2 = clientSize - arrowRect[len] - paddingObject[maxProp];
  var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
  var offset2 = within(min2, center, max2);
  var axisProp = axis;
  state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset2, _state$modifiersData$.centerOffset = offset2 - center, _state$modifiersData$);
}
function effect$1(_ref2) {
  var state = _ref2.state, options = _ref2.options;
  var _options$element = options.element, arrowElement = _options$element === void 0 ? "[data-popper-arrow]" : _options$element;
  if (arrowElement == null) {
    return;
  }
  if (typeof arrowElement === "string") {
    arrowElement = state.elements.popper.querySelector(arrowElement);
    if (!arrowElement) {
      return;
    }
  }
  if (!contains(state.elements.popper, arrowElement)) {
    return;
  }
  state.elements.arrow = arrowElement;
}
const arrow$1 = {
  name: "arrow",
  enabled: true,
  phase: "main",
  fn: arrow,
  effect: effect$1,
  requires: ["popperOffsets"],
  requiresIfExists: ["preventOverflow"]
};
function getVariation(placement) {
  return placement.split("-")[1];
}
var unsetSides = {
  top: "auto",
  right: "auto",
  bottom: "auto",
  left: "auto"
};
function roundOffsetsByDPR(_ref, win) {
  var x = _ref.x, y = _ref.y;
  var dpr = win.devicePixelRatio || 1;
  return {
    x: round(x * dpr) / dpr || 0,
    y: round(y * dpr) / dpr || 0
  };
}
function mapToStyles(_ref2) {
  var _Object$assign2;
  var popper2 = _ref2.popper, popperRect = _ref2.popperRect, placement = _ref2.placement, variation = _ref2.variation, offsets = _ref2.offsets, position = _ref2.position, gpuAcceleration = _ref2.gpuAcceleration, adaptive = _ref2.adaptive, roundOffsets = _ref2.roundOffsets, isFixed = _ref2.isFixed;
  var _offsets$x = offsets.x, x = _offsets$x === void 0 ? 0 : _offsets$x, _offsets$y = offsets.y, y = _offsets$y === void 0 ? 0 : _offsets$y;
  var _ref3 = typeof roundOffsets === "function" ? roundOffsets({
    x,
    y
  }) : {
    x,
    y
  };
  x = _ref3.x;
  y = _ref3.y;
  var hasX = offsets.hasOwnProperty("x");
  var hasY = offsets.hasOwnProperty("y");
  var sideX = left;
  var sideY = top;
  var win = window;
  if (adaptive) {
    var offsetParent = getOffsetParent(popper2);
    var heightProp = "clientHeight";
    var widthProp = "clientWidth";
    if (offsetParent === getWindow(popper2)) {
      offsetParent = getDocumentElement(popper2);
      if (getComputedStyle$1(offsetParent).position !== "static" && position === "absolute") {
        heightProp = "scrollHeight";
        widthProp = "scrollWidth";
      }
    }
    offsetParent = offsetParent;
    if (placement === top || (placement === left || placement === right) && variation === end) {
      sideY = bottom;
      var offsetY = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.height : (
        // $FlowFixMe[prop-missing]
        offsetParent[heightProp]
      );
      y -= offsetY - popperRect.height;
      y *= gpuAcceleration ? 1 : -1;
    }
    if (placement === left || (placement === top || placement === bottom) && variation === end) {
      sideX = right;
      var offsetX = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.width : (
        // $FlowFixMe[prop-missing]
        offsetParent[widthProp]
      );
      x -= offsetX - popperRect.width;
      x *= gpuAcceleration ? 1 : -1;
    }
  }
  var commonStyles = Object.assign({
    position
  }, adaptive && unsetSides);
  var _ref4 = roundOffsets === true ? roundOffsetsByDPR({
    x,
    y
  }, getWindow(popper2)) : {
    x,
    y
  };
  x = _ref4.x;
  y = _ref4.y;
  if (gpuAcceleration) {
    var _Object$assign;
    return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? "0" : "", _Object$assign[sideX] = hasX ? "0" : "", _Object$assign.transform = (win.devicePixelRatio || 1) <= 1 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
  }
  return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : "", _Object$assign2[sideX] = hasX ? x + "px" : "", _Object$assign2.transform = "", _Object$assign2));
}
function computeStyles(_ref5) {
  var state = _ref5.state, options = _ref5.options;
  var _options$gpuAccelerat = options.gpuAcceleration, gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat, _options$adaptive = options.adaptive, adaptive = _options$adaptive === void 0 ? true : _options$adaptive, _options$roundOffsets = options.roundOffsets, roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;
  var commonStyles = {
    placement: getBasePlacement(state.placement),
    variation: getVariation(state.placement),
    popper: state.elements.popper,
    popperRect: state.rects.popper,
    gpuAcceleration,
    isFixed: state.options.strategy === "fixed"
  };
  if (state.modifiersData.popperOffsets != null) {
    state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
      offsets: state.modifiersData.popperOffsets,
      position: state.options.strategy,
      adaptive,
      roundOffsets
    })));
  }
  if (state.modifiersData.arrow != null) {
    state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
      offsets: state.modifiersData.arrow,
      position: "absolute",
      adaptive: false,
      roundOffsets
    })));
  }
  state.attributes.popper = Object.assign({}, state.attributes.popper, {
    "data-popper-placement": state.placement
  });
}
const computeStyles$1 = {
  name: "computeStyles",
  enabled: true,
  phase: "beforeWrite",
  fn: computeStyles,
  data: {}
};
var passive = {
  passive: true
};
function effect(_ref) {
  var state = _ref.state, instance = _ref.instance, options = _ref.options;
  var _options$scroll = options.scroll, scroll = _options$scroll === void 0 ? true : _options$scroll, _options$resize = options.resize, resize = _options$resize === void 0 ? true : _options$resize;
  var window2 = getWindow(state.elements.popper);
  var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);
  if (scroll) {
    scrollParents.forEach(function(scrollParent) {
      scrollParent.addEventListener("scroll", instance.update, passive);
    });
  }
  if (resize) {
    window2.addEventListener("resize", instance.update, passive);
  }
  return function() {
    if (scroll) {
      scrollParents.forEach(function(scrollParent) {
        scrollParent.removeEventListener("scroll", instance.update, passive);
      });
    }
    if (resize) {
      window2.removeEventListener("resize", instance.update, passive);
    }
  };
}
const eventListeners = {
  name: "eventListeners",
  enabled: true,
  phase: "write",
  fn: function fn() {
  },
  effect,
  data: {}
};
var hash$1 = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
function getOppositePlacement(placement) {
  return placement.replace(/left|right|bottom|top/g, function(matched) {
    return hash$1[matched];
  });
}
var hash = {
  start: "end",
  end: "start"
};
function getOppositeVariationPlacement(placement) {
  return placement.replace(/start|end/g, function(matched) {
    return hash[matched];
  });
}
function getWindowScroll(node) {
  var win = getWindow(node);
  var scrollLeft = win.pageXOffset;
  var scrollTop = win.pageYOffset;
  return {
    scrollLeft,
    scrollTop
  };
}
function getWindowScrollBarX(element) {
  return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
}
function getViewportRect(element, strategy) {
  var win = getWindow(element);
  var html = getDocumentElement(element);
  var visualViewport = win.visualViewport;
  var width = html.clientWidth;
  var height = html.clientHeight;
  var x = 0;
  var y = 0;
  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    var layoutViewport = isLayoutViewport();
    if (layoutViewport || !layoutViewport && strategy === "fixed") {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }
  return {
    width,
    height,
    x: x + getWindowScrollBarX(element),
    y
  };
}
function getDocumentRect(element) {
  var _element$ownerDocumen;
  var html = getDocumentElement(element);
  var winScroll = getWindowScroll(element);
  var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
  var width = max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
  var height = max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
  var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
  var y = -winScroll.scrollTop;
  if (getComputedStyle$1(body || html).direction === "rtl") {
    x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}
function isScrollParent(element) {
  var _getComputedStyle = getComputedStyle$1(element), overflow = _getComputedStyle.overflow, overflowX = _getComputedStyle.overflowX, overflowY = _getComputedStyle.overflowY;
  return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
}
function getScrollParent(node) {
  if (["html", "body", "#document"].indexOf(getNodeName(node)) >= 0) {
    return node.ownerDocument.body;
  }
  if (isHTMLElement(node) && isScrollParent(node)) {
    return node;
  }
  return getScrollParent(getParentNode(node));
}
function listScrollParents(element, list) {
  var _element$ownerDocumen;
  if (list === void 0) {
    list = [];
  }
  var scrollParent = getScrollParent(element);
  var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
  var win = getWindow(scrollParent);
  var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
  var updatedList = list.concat(target);
  return isBody ? updatedList : (
    // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
    updatedList.concat(listScrollParents(getParentNode(target)))
  );
}
function rectToClientRect(rect) {
  return Object.assign({}, rect, {
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height
  });
}
function getInnerBoundingClientRect(element, strategy) {
  var rect = getBoundingClientRect(element, false, strategy === "fixed");
  rect.top = rect.top + element.clientTop;
  rect.left = rect.left + element.clientLeft;
  rect.bottom = rect.top + element.clientHeight;
  rect.right = rect.left + element.clientWidth;
  rect.width = element.clientWidth;
  rect.height = element.clientHeight;
  rect.x = rect.left;
  rect.y = rect.top;
  return rect;
}
function getClientRectFromMixedType(element, clippingParent, strategy) {
  return clippingParent === viewport ? rectToClientRect(getViewportRect(element, strategy)) : isElement$1(clippingParent) ? getInnerBoundingClientRect(clippingParent, strategy) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
}
function getClippingParents(element) {
  var clippingParents2 = listScrollParents(getParentNode(element));
  var canEscapeClipping = ["absolute", "fixed"].indexOf(getComputedStyle$1(element).position) >= 0;
  var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;
  if (!isElement$1(clipperElement)) {
    return [];
  }
  return clippingParents2.filter(function(clippingParent) {
    return isElement$1(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== "body";
  });
}
function getClippingRect(element, boundary, rootBoundary, strategy) {
  var mainClippingParents = boundary === "clippingParents" ? getClippingParents(element) : [].concat(boundary);
  var clippingParents2 = [].concat(mainClippingParents, [rootBoundary]);
  var firstClippingParent = clippingParents2[0];
  var clippingRect = clippingParents2.reduce(function(accRect, clippingParent) {
    var rect = getClientRectFromMixedType(element, clippingParent, strategy);
    accRect.top = max(rect.top, accRect.top);
    accRect.right = min(rect.right, accRect.right);
    accRect.bottom = min(rect.bottom, accRect.bottom);
    accRect.left = max(rect.left, accRect.left);
    return accRect;
  }, getClientRectFromMixedType(element, firstClippingParent, strategy));
  clippingRect.width = clippingRect.right - clippingRect.left;
  clippingRect.height = clippingRect.bottom - clippingRect.top;
  clippingRect.x = clippingRect.left;
  clippingRect.y = clippingRect.top;
  return clippingRect;
}
function computeOffsets(_ref) {
  var reference2 = _ref.reference, element = _ref.element, placement = _ref.placement;
  var basePlacement = placement ? getBasePlacement(placement) : null;
  var variation = placement ? getVariation(placement) : null;
  var commonX = reference2.x + reference2.width / 2 - element.width / 2;
  var commonY = reference2.y + reference2.height / 2 - element.height / 2;
  var offsets;
  switch (basePlacement) {
    case top:
      offsets = {
        x: commonX,
        y: reference2.y - element.height
      };
      break;
    case bottom:
      offsets = {
        x: commonX,
        y: reference2.y + reference2.height
      };
      break;
    case right:
      offsets = {
        x: reference2.x + reference2.width,
        y: commonY
      };
      break;
    case left:
      offsets = {
        x: reference2.x - element.width,
        y: commonY
      };
      break;
    default:
      offsets = {
        x: reference2.x,
        y: reference2.y
      };
  }
  var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;
  if (mainAxis != null) {
    var len = mainAxis === "y" ? "height" : "width";
    switch (variation) {
      case start:
        offsets[mainAxis] = offsets[mainAxis] - (reference2[len] / 2 - element[len] / 2);
        break;
      case end:
        offsets[mainAxis] = offsets[mainAxis] + (reference2[len] / 2 - element[len] / 2);
        break;
    }
  }
  return offsets;
}
function detectOverflow(state, options) {
  if (options === void 0) {
    options = {};
  }
  var _options = options, _options$placement = _options.placement, placement = _options$placement === void 0 ? state.placement : _options$placement, _options$strategy = _options.strategy, strategy = _options$strategy === void 0 ? state.strategy : _options$strategy, _options$boundary = _options.boundary, boundary = _options$boundary === void 0 ? clippingParents : _options$boundary, _options$rootBoundary = _options.rootBoundary, rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary, _options$elementConte = _options.elementContext, elementContext = _options$elementConte === void 0 ? popper : _options$elementConte, _options$altBoundary = _options.altBoundary, altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary, _options$padding = _options.padding, padding = _options$padding === void 0 ? 0 : _options$padding;
  var paddingObject = mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
  var altContext = elementContext === popper ? reference : popper;
  var popperRect = state.rects.popper;
  var element = state.elements[altBoundary ? altContext : elementContext];
  var clippingClientRect = getClippingRect(isElement$1(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary, strategy);
  var referenceClientRect = getBoundingClientRect(state.elements.reference);
  var popperOffsets2 = computeOffsets({
    reference: referenceClientRect,
    element: popperRect,
    placement
  });
  var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets2));
  var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect;
  var overflowOffsets = {
    top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
    bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
    left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
    right: elementClientRect.right - clippingClientRect.right + paddingObject.right
  };
  var offsetData = state.modifiersData.offset;
  if (elementContext === popper && offsetData) {
    var offset2 = offsetData[placement];
    Object.keys(overflowOffsets).forEach(function(key) {
      var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
      var axis = [top, bottom].indexOf(key) >= 0 ? "y" : "x";
      overflowOffsets[key] += offset2[axis] * multiply;
    });
  }
  return overflowOffsets;
}
function computeAutoPlacement(state, options) {
  if (options === void 0) {
    options = {};
  }
  var _options = options, placement = _options.placement, boundary = _options.boundary, rootBoundary = _options.rootBoundary, padding = _options.padding, flipVariations = _options.flipVariations, _options$allowedAutoP = _options.allowedAutoPlacements, allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
  var variation = getVariation(placement);
  var placements$1 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function(placement2) {
    return getVariation(placement2) === variation;
  }) : basePlacements;
  var allowedPlacements = placements$1.filter(function(placement2) {
    return allowedAutoPlacements.indexOf(placement2) >= 0;
  });
  if (allowedPlacements.length === 0) {
    allowedPlacements = placements$1;
  }
  var overflows = allowedPlacements.reduce(function(acc, placement2) {
    acc[placement2] = detectOverflow(state, {
      placement: placement2,
      boundary,
      rootBoundary,
      padding
    })[getBasePlacement(placement2)];
    return acc;
  }, {});
  return Object.keys(overflows).sort(function(a, b) {
    return overflows[a] - overflows[b];
  });
}
function getExpandedFallbackPlacements(placement) {
  if (getBasePlacement(placement) === auto) {
    return [];
  }
  var oppositePlacement = getOppositePlacement(placement);
  return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
}
function flip(_ref) {
  var state = _ref.state, options = _ref.options, name = _ref.name;
  if (state.modifiersData[name]._skip) {
    return;
  }
  var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis, specifiedFallbackPlacements = options.fallbackPlacements, padding = options.padding, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, _options$flipVariatio = options.flipVariations, flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio, allowedAutoPlacements = options.allowedAutoPlacements;
  var preferredPlacement = state.options.placement;
  var basePlacement = getBasePlacement(preferredPlacement);
  var isBasePlacement = basePlacement === preferredPlacement;
  var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
  var placements2 = [preferredPlacement].concat(fallbackPlacements).reduce(function(acc, placement2) {
    return acc.concat(getBasePlacement(placement2) === auto ? computeAutoPlacement(state, {
      placement: placement2,
      boundary,
      rootBoundary,
      padding,
      flipVariations,
      allowedAutoPlacements
    }) : placement2);
  }, []);
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var checksMap = /* @__PURE__ */ new Map();
  var makeFallbackChecks = true;
  var firstFittingPlacement = placements2[0];
  for (var i = 0; i < placements2.length; i++) {
    var placement = placements2[i];
    var _basePlacement = getBasePlacement(placement);
    var isStartVariation = getVariation(placement) === start;
    var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
    var len = isVertical ? "width" : "height";
    var overflow = detectOverflow(state, {
      placement,
      boundary,
      rootBoundary,
      altBoundary,
      padding
    });
    var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;
    if (referenceRect[len] > popperRect[len]) {
      mainVariationSide = getOppositePlacement(mainVariationSide);
    }
    var altVariationSide = getOppositePlacement(mainVariationSide);
    var checks = [];
    if (checkMainAxis) {
      checks.push(overflow[_basePlacement] <= 0);
    }
    if (checkAltAxis) {
      checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
    }
    if (checks.every(function(check) {
      return check;
    })) {
      firstFittingPlacement = placement;
      makeFallbackChecks = false;
      break;
    }
    checksMap.set(placement, checks);
  }
  if (makeFallbackChecks) {
    var numberOfChecks = flipVariations ? 3 : 1;
    var _loop = function _loop2(_i2) {
      var fittingPlacement = placements2.find(function(placement2) {
        var checks2 = checksMap.get(placement2);
        if (checks2) {
          return checks2.slice(0, _i2).every(function(check) {
            return check;
          });
        }
      });
      if (fittingPlacement) {
        firstFittingPlacement = fittingPlacement;
        return "break";
      }
    };
    for (var _i = numberOfChecks; _i > 0; _i--) {
      var _ret = _loop(_i);
      if (_ret === "break") break;
    }
  }
  if (state.placement !== firstFittingPlacement) {
    state.modifiersData[name]._skip = true;
    state.placement = firstFittingPlacement;
    state.reset = true;
  }
}
const flip$1 = {
  name: "flip",
  enabled: true,
  phase: "main",
  fn: flip,
  requiresIfExists: ["offset"],
  data: {
    _skip: false
  }
};
function getSideOffsets(overflow, rect, preventedOffsets) {
  if (preventedOffsets === void 0) {
    preventedOffsets = {
      x: 0,
      y: 0
    };
  }
  return {
    top: overflow.top - rect.height - preventedOffsets.y,
    right: overflow.right - rect.width + preventedOffsets.x,
    bottom: overflow.bottom - rect.height + preventedOffsets.y,
    left: overflow.left - rect.width - preventedOffsets.x
  };
}
function isAnySideFullyClipped(overflow) {
  return [top, right, bottom, left].some(function(side) {
    return overflow[side] >= 0;
  });
}
function hide(_ref) {
  var state = _ref.state, name = _ref.name;
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var preventedOffsets = state.modifiersData.preventOverflow;
  var referenceOverflow = detectOverflow(state, {
    elementContext: "reference"
  });
  var popperAltOverflow = detectOverflow(state, {
    altBoundary: true
  });
  var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
  var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
  var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
  var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
  state.modifiersData[name] = {
    referenceClippingOffsets,
    popperEscapeOffsets,
    isReferenceHidden,
    hasPopperEscaped
  };
  state.attributes.popper = Object.assign({}, state.attributes.popper, {
    "data-popper-reference-hidden": isReferenceHidden,
    "data-popper-escaped": hasPopperEscaped
  });
}
const hide$1 = {
  name: "hide",
  enabled: true,
  phase: "main",
  requiresIfExists: ["preventOverflow"],
  fn: hide
};
function distanceAndSkiddingToXY(placement, rects, offset2) {
  var basePlacement = getBasePlacement(placement);
  var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;
  var _ref = typeof offset2 === "function" ? offset2(Object.assign({}, rects, {
    placement
  })) : offset2, skidding = _ref[0], distance = _ref[1];
  skidding = skidding || 0;
  distance = (distance || 0) * invertDistance;
  return [left, right].indexOf(basePlacement) >= 0 ? {
    x: distance,
    y: skidding
  } : {
    x: skidding,
    y: distance
  };
}
function offset(_ref2) {
  var state = _ref2.state, options = _ref2.options, name = _ref2.name;
  var _options$offset = options.offset, offset2 = _options$offset === void 0 ? [0, 0] : _options$offset;
  var data = placements.reduce(function(acc, placement) {
    acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset2);
    return acc;
  }, {});
  var _data$state$placement = data[state.placement], x = _data$state$placement.x, y = _data$state$placement.y;
  if (state.modifiersData.popperOffsets != null) {
    state.modifiersData.popperOffsets.x += x;
    state.modifiersData.popperOffsets.y += y;
  }
  state.modifiersData[name] = data;
}
const offset$1 = {
  name: "offset",
  enabled: true,
  phase: "main",
  requires: ["popperOffsets"],
  fn: offset
};
function popperOffsets(_ref) {
  var state = _ref.state, name = _ref.name;
  state.modifiersData[name] = computeOffsets({
    reference: state.rects.reference,
    element: state.rects.popper,
    placement: state.placement
  });
}
const popperOffsets$1 = {
  name: "popperOffsets",
  enabled: true,
  phase: "read",
  fn: popperOffsets,
  data: {}
};
function getAltAxis(axis) {
  return axis === "x" ? "y" : "x";
}
function preventOverflow(_ref) {
  var state = _ref.state, options = _ref.options, name = _ref.name;
  var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, padding = options.padding, _options$tether = options.tether, tether = _options$tether === void 0 ? true : _options$tether, _options$tetherOffset = options.tetherOffset, tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
  var overflow = detectOverflow(state, {
    boundary,
    rootBoundary,
    padding,
    altBoundary
  });
  var basePlacement = getBasePlacement(state.placement);
  var variation = getVariation(state.placement);
  var isBasePlacement = !variation;
  var mainAxis = getMainAxisFromPlacement(basePlacement);
  var altAxis = getAltAxis(mainAxis);
  var popperOffsets2 = state.modifiersData.popperOffsets;
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var tetherOffsetValue = typeof tetherOffset === "function" ? tetherOffset(Object.assign({}, state.rects, {
    placement: state.placement
  })) : tetherOffset;
  var normalizedTetherOffsetValue = typeof tetherOffsetValue === "number" ? {
    mainAxis: tetherOffsetValue,
    altAxis: tetherOffsetValue
  } : Object.assign({
    mainAxis: 0,
    altAxis: 0
  }, tetherOffsetValue);
  var offsetModifierState = state.modifiersData.offset ? state.modifiersData.offset[state.placement] : null;
  var data = {
    x: 0,
    y: 0
  };
  if (!popperOffsets2) {
    return;
  }
  if (checkMainAxis) {
    var _offsetModifierState$;
    var mainSide = mainAxis === "y" ? top : left;
    var altSide = mainAxis === "y" ? bottom : right;
    var len = mainAxis === "y" ? "height" : "width";
    var offset2 = popperOffsets2[mainAxis];
    var min$1 = offset2 + overflow[mainSide];
    var max$1 = offset2 - overflow[altSide];
    var additive = tether ? -popperRect[len] / 2 : 0;
    var minLen = variation === start ? referenceRect[len] : popperRect[len];
    var maxLen = variation === start ? -popperRect[len] : -referenceRect[len];
    var arrowElement = state.elements.arrow;
    var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
      width: 0,
      height: 0
    };
    var arrowPaddingObject = state.modifiersData["arrow#persistent"] ? state.modifiersData["arrow#persistent"].padding : getFreshSideObject();
    var arrowPaddingMin = arrowPaddingObject[mainSide];
    var arrowPaddingMax = arrowPaddingObject[altSide];
    var arrowLen = within(0, referenceRect[len], arrowRect[len]);
    var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis : minLen - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis;
    var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis : maxLen + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis;
    var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
    var clientOffset = arrowOffsetParent ? mainAxis === "y" ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
    var offsetModifierValue = (_offsetModifierState$ = offsetModifierState == null ? void 0 : offsetModifierState[mainAxis]) != null ? _offsetModifierState$ : 0;
    var tetherMin = offset2 + minOffset - offsetModifierValue - clientOffset;
    var tetherMax = offset2 + maxOffset - offsetModifierValue;
    var preventedOffset = within(tether ? min(min$1, tetherMin) : min$1, offset2, tether ? max(max$1, tetherMax) : max$1);
    popperOffsets2[mainAxis] = preventedOffset;
    data[mainAxis] = preventedOffset - offset2;
  }
  if (checkAltAxis) {
    var _offsetModifierState$2;
    var _mainSide = mainAxis === "x" ? top : left;
    var _altSide = mainAxis === "x" ? bottom : right;
    var _offset = popperOffsets2[altAxis];
    var _len = altAxis === "y" ? "height" : "width";
    var _min = _offset + overflow[_mainSide];
    var _max = _offset - overflow[_altSide];
    var isOriginSide = [top, left].indexOf(basePlacement) !== -1;
    var _offsetModifierValue = (_offsetModifierState$2 = offsetModifierState == null ? void 0 : offsetModifierState[altAxis]) != null ? _offsetModifierState$2 : 0;
    var _tetherMin = isOriginSide ? _min : _offset - referenceRect[_len] - popperRect[_len] - _offsetModifierValue + normalizedTetherOffsetValue.altAxis;
    var _tetherMax = isOriginSide ? _offset + referenceRect[_len] + popperRect[_len] - _offsetModifierValue - normalizedTetherOffsetValue.altAxis : _max;
    var _preventedOffset = tether && isOriginSide ? withinMaxClamp(_tetherMin, _offset, _tetherMax) : within(tether ? _tetherMin : _min, _offset, tether ? _tetherMax : _max);
    popperOffsets2[altAxis] = _preventedOffset;
    data[altAxis] = _preventedOffset - _offset;
  }
  state.modifiersData[name] = data;
}
const preventOverflow$1 = {
  name: "preventOverflow",
  enabled: true,
  phase: "main",
  fn: preventOverflow,
  requiresIfExists: ["offset"]
};
function getHTMLElementScroll(element) {
  return {
    scrollLeft: element.scrollLeft,
    scrollTop: element.scrollTop
  };
}
function getNodeScroll(node) {
  if (node === getWindow(node) || !isHTMLElement(node)) {
    return getWindowScroll(node);
  } else {
    return getHTMLElementScroll(node);
  }
}
function isElementScaled(element) {
  var rect = element.getBoundingClientRect();
  var scaleX = round(rect.width) / element.offsetWidth || 1;
  var scaleY = round(rect.height) / element.offsetHeight || 1;
  return scaleX !== 1 || scaleY !== 1;
}
function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  var isOffsetParentAnElement = isHTMLElement(offsetParent);
  var offsetParentIsScaled = isHTMLElement(offsetParent) && isElementScaled(offsetParent);
  var documentElement = getDocumentElement(offsetParent);
  var rect = getBoundingClientRect(elementOrVirtualElement, offsetParentIsScaled, isFixed);
  var scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  var offsets = {
    x: 0,
    y: 0
  };
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || // https://github.com/popperjs/popper-core/issues/1078
    isScrollParent(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isHTMLElement(offsetParent)) {
      offsets = getBoundingClientRect(offsetParent, true);
      offsets.x += offsetParent.clientLeft;
      offsets.y += offsetParent.clientTop;
    } else if (documentElement) {
      offsets.x = getWindowScrollBarX(documentElement);
    }
  }
  return {
    x: rect.left + scroll.scrollLeft - offsets.x,
    y: rect.top + scroll.scrollTop - offsets.y,
    width: rect.width,
    height: rect.height
  };
}
function order(modifiers) {
  var map = /* @__PURE__ */ new Map();
  var visited = /* @__PURE__ */ new Set();
  var result = [];
  modifiers.forEach(function(modifier) {
    map.set(modifier.name, modifier);
  });
  function sort(modifier) {
    visited.add(modifier.name);
    var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
    requires.forEach(function(dep) {
      if (!visited.has(dep)) {
        var depModifier = map.get(dep);
        if (depModifier) {
          sort(depModifier);
        }
      }
    });
    result.push(modifier);
  }
  modifiers.forEach(function(modifier) {
    if (!visited.has(modifier.name)) {
      sort(modifier);
    }
  });
  return result;
}
function orderModifiers(modifiers) {
  var orderedModifiers = order(modifiers);
  return modifierPhases.reduce(function(acc, phase) {
    return acc.concat(orderedModifiers.filter(function(modifier) {
      return modifier.phase === phase;
    }));
  }, []);
}
function debounce(fn2) {
  var pending;
  return function() {
    if (!pending) {
      pending = new Promise(function(resolve) {
        Promise.resolve().then(function() {
          pending = void 0;
          resolve(fn2());
        });
      });
    }
    return pending;
  };
}
function mergeByName(modifiers) {
  var merged = modifiers.reduce(function(merged2, current) {
    var existing = merged2[current.name];
    merged2[current.name] = existing ? Object.assign({}, existing, current, {
      options: Object.assign({}, existing.options, current.options),
      data: Object.assign({}, existing.data, current.data)
    }) : current;
    return merged2;
  }, {});
  return Object.keys(merged).map(function(key) {
    return merged[key];
  });
}
var DEFAULT_OPTIONS = {
  placement: "bottom",
  modifiers: [],
  strategy: "absolute"
};
function areValidElements() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  return !args.some(function(element) {
    return !(element && typeof element.getBoundingClientRect === "function");
  });
}
function popperGenerator(generatorOptions) {
  if (generatorOptions === void 0) {
    generatorOptions = {};
  }
  var _generatorOptions = generatorOptions, _generatorOptions$def = _generatorOptions.defaultModifiers, defaultModifiers2 = _generatorOptions$def === void 0 ? [] : _generatorOptions$def, _generatorOptions$def2 = _generatorOptions.defaultOptions, defaultOptions = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
  return function createPopper2(reference2, popper2, options) {
    if (options === void 0) {
      options = defaultOptions;
    }
    var state = {
      placement: "bottom",
      orderedModifiers: [],
      options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
      modifiersData: {},
      elements: {
        reference: reference2,
        popper: popper2
      },
      attributes: {},
      styles: {}
    };
    var effectCleanupFns = [];
    var isDestroyed = false;
    var instance = {
      state,
      setOptions: function setOptions(setOptionsAction) {
        var options2 = typeof setOptionsAction === "function" ? setOptionsAction(state.options) : setOptionsAction;
        cleanupModifierEffects();
        state.options = Object.assign({}, defaultOptions, state.options, options2);
        state.scrollParents = {
          reference: isElement$1(reference2) ? listScrollParents(reference2) : reference2.contextElement ? listScrollParents(reference2.contextElement) : [],
          popper: listScrollParents(popper2)
        };
        var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers2, state.options.modifiers)));
        state.orderedModifiers = orderedModifiers.filter(function(m) {
          return m.enabled;
        });
        runModifierEffects();
        return instance.update();
      },
      // Sync update – it will always be executed, even if not necessary. This
      // is useful for low frequency updates where sync behavior simplifies the
      // logic.
      // For high frequency updates (e.g. `resize` and `scroll` events), always
      // prefer the async Popper#update method
      forceUpdate: function forceUpdate() {
        if (isDestroyed) {
          return;
        }
        var _state$elements = state.elements, reference3 = _state$elements.reference, popper3 = _state$elements.popper;
        if (!areValidElements(reference3, popper3)) {
          return;
        }
        state.rects = {
          reference: getCompositeRect(reference3, getOffsetParent(popper3), state.options.strategy === "fixed"),
          popper: getLayoutRect(popper3)
        };
        state.reset = false;
        state.placement = state.options.placement;
        state.orderedModifiers.forEach(function(modifier) {
          return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
        });
        for (var index = 0; index < state.orderedModifiers.length; index++) {
          if (state.reset === true) {
            state.reset = false;
            index = -1;
            continue;
          }
          var _state$orderedModifie = state.orderedModifiers[index], fn2 = _state$orderedModifie.fn, _state$orderedModifie2 = _state$orderedModifie.options, _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2, name = _state$orderedModifie.name;
          if (typeof fn2 === "function") {
            state = fn2({
              state,
              options: _options,
              name,
              instance
            }) || state;
          }
        }
      },
      // Async and optimistically optimized update – it will not be executed if
      // not necessary (debounced to run at most once-per-tick)
      update: debounce(function() {
        return new Promise(function(resolve) {
          instance.forceUpdate();
          resolve(state);
        });
      }),
      destroy: function destroy() {
        cleanupModifierEffects();
        isDestroyed = true;
      }
    };
    if (!areValidElements(reference2, popper2)) {
      return instance;
    }
    instance.setOptions(options).then(function(state2) {
      if (!isDestroyed && options.onFirstUpdate) {
        options.onFirstUpdate(state2);
      }
    });
    function runModifierEffects() {
      state.orderedModifiers.forEach(function(_ref) {
        var name = _ref.name, _ref$options = _ref.options, options2 = _ref$options === void 0 ? {} : _ref$options, effect2 = _ref.effect;
        if (typeof effect2 === "function") {
          var cleanupFn = effect2({
            state,
            name,
            instance,
            options: options2
          });
          var noopFn = function noopFn2() {
          };
          effectCleanupFns.push(cleanupFn || noopFn);
        }
      });
    }
    function cleanupModifierEffects() {
      effectCleanupFns.forEach(function(fn2) {
        return fn2();
      });
      effectCleanupFns = [];
    }
    return instance;
  };
}
var createPopper$2 = /* @__PURE__ */ popperGenerator();
var defaultModifiers$1 = [eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1];
var createPopper$1 = /* @__PURE__ */ popperGenerator({
  defaultModifiers: defaultModifiers$1
});
var defaultModifiers = [eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1, offset$1, flip$1, preventOverflow$1, arrow$1, hide$1];
var createPopper = /* @__PURE__ */ popperGenerator({
  defaultModifiers
});
const Popper = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  afterMain,
  afterRead,
  afterWrite,
  applyStyles: applyStyles$1,
  arrow: arrow$1,
  auto,
  basePlacements,
  beforeMain,
  beforeRead,
  beforeWrite,
  bottom,
  clippingParents,
  computeStyles: computeStyles$1,
  createPopper,
  createPopperBase: createPopper$2,
  createPopperLite: createPopper$1,
  detectOverflow,
  end,
  eventListeners,
  flip: flip$1,
  hide: hide$1,
  left,
  main,
  modifierPhases,
  offset: offset$1,
  placements,
  popper,
  popperGenerator,
  popperOffsets: popperOffsets$1,
  preventOverflow: preventOverflow$1,
  read,
  reference,
  right,
  start,
  top,
  variationPlacements,
  viewport,
  write
}, Symbol.toStringTag, { value: "Module" }));
const elementMap = /* @__PURE__ */ new Map();
const Data = {
  set(element, key, instance) {
    if (!elementMap.has(element)) {
      elementMap.set(element, /* @__PURE__ */ new Map());
    }
    const instanceMap = elementMap.get(element);
    if (!instanceMap.has(key) && instanceMap.size !== 0) {
      console.error(`Bootstrap doesn't allow more than one instance per element. Bound instance: ${Array.from(instanceMap.keys())[0]}.`);
      return;
    }
    instanceMap.set(key, instance);
  },
  get(element, key) {
    if (elementMap.has(element)) {
      return elementMap.get(element).get(key) || null;
    }
    return null;
  },
  remove(element, key) {
    if (!elementMap.has(element)) {
      return;
    }
    const instanceMap = elementMap.get(element);
    instanceMap.delete(key);
    if (instanceMap.size === 0) {
      elementMap.delete(element);
    }
  }
};
const MAX_UID = 1e6;
const MILLISECONDS_MULTIPLIER = 1e3;
const TRANSITION_END = "transitionend";
const parseSelector = (selector) => {
  if (selector && window.CSS && window.CSS.escape) {
    selector = selector.replace(/#([^\s"#']+)/g, (match, id) => `#${CSS.escape(id)}`);
  }
  return selector;
};
const toType = (object) => {
  if (object === null || object === void 0) {
    return `${object}`;
  }
  return Object.prototype.toString.call(object).match(/\s([a-z]+)/i)[1].toLowerCase();
};
const getUID = (prefix) => {
  do {
    prefix += Math.floor(Math.random() * MAX_UID);
  } while (document.getElementById(prefix));
  return prefix;
};
const getTransitionDurationFromElement = (element) => {
  if (!element) {
    return 0;
  }
  let {
    transitionDuration,
    transitionDelay
  } = window.getComputedStyle(element);
  const floatTransitionDuration = Number.parseFloat(transitionDuration);
  const floatTransitionDelay = Number.parseFloat(transitionDelay);
  if (!floatTransitionDuration && !floatTransitionDelay) {
    return 0;
  }
  transitionDuration = transitionDuration.split(",")[0];
  transitionDelay = transitionDelay.split(",")[0];
  return (Number.parseFloat(transitionDuration) + Number.parseFloat(transitionDelay)) * MILLISECONDS_MULTIPLIER;
};
const triggerTransitionEnd = (element) => {
  element.dispatchEvent(new Event(TRANSITION_END));
};
const isElement = (object) => {
  if (!object || typeof object !== "object") {
    return false;
  }
  if (typeof object.jquery !== "undefined") {
    object = object[0];
  }
  return typeof object.nodeType !== "undefined";
};
const getElement = (object) => {
  if (isElement(object)) {
    return object.jquery ? object[0] : object;
  }
  if (typeof object === "string" && object.length > 0) {
    return document.querySelector(parseSelector(object));
  }
  return null;
};
const isVisible = (element) => {
  if (!isElement(element) || element.getClientRects().length === 0) {
    return false;
  }
  const elementIsVisible = getComputedStyle(element).getPropertyValue("visibility") === "visible";
  const closedDetails = element.closest("details:not([open])");
  if (!closedDetails) {
    return elementIsVisible;
  }
  if (closedDetails !== element) {
    const summary = element.closest("summary");
    if (summary && summary.parentNode !== closedDetails) {
      return false;
    }
    if (summary === null) {
      return false;
    }
  }
  return elementIsVisible;
};
const isDisabled = (element) => {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return true;
  }
  if (element.classList.contains("disabled")) {
    return true;
  }
  if (typeof element.disabled !== "undefined") {
    return element.disabled;
  }
  return element.hasAttribute("disabled") && element.getAttribute("disabled") !== "false";
};
const findShadowRoot = (element) => {
  if (!document.documentElement.attachShadow) {
    return null;
  }
  if (typeof element.getRootNode === "function") {
    const root = element.getRootNode();
    return root instanceof ShadowRoot ? root : null;
  }
  if (element instanceof ShadowRoot) {
    return element;
  }
  if (!element.parentNode) {
    return null;
  }
  return findShadowRoot(element.parentNode);
};
const noop = () => {
};
const reflow = (element) => {
  element.offsetHeight;
};
const getjQuery = () => {
  if (window.jQuery && !document.body.hasAttribute("data-bs-no-jquery")) {
    return window.jQuery;
  }
  return null;
};
const DOMContentLoadedCallbacks = [];
const onDOMContentLoaded = (callback) => {
  if (document.readyState === "loading") {
    if (!DOMContentLoadedCallbacks.length) {
      document.addEventListener("DOMContentLoaded", () => {
        for (const callback2 of DOMContentLoadedCallbacks) {
          callback2();
        }
      });
    }
    DOMContentLoadedCallbacks.push(callback);
  } else {
    callback();
  }
};
const isRTL = () => document.documentElement.dir === "rtl";
const defineJQueryPlugin = (plugin) => {
  onDOMContentLoaded(() => {
    const $ = getjQuery();
    if ($) {
      const name = plugin.NAME;
      const JQUERY_NO_CONFLICT = $.fn[name];
      $.fn[name] = plugin.jQueryInterface;
      $.fn[name].Constructor = plugin;
      $.fn[name].noConflict = () => {
        $.fn[name] = JQUERY_NO_CONFLICT;
        return plugin.jQueryInterface;
      };
    }
  });
};
const execute = (possibleCallback, args = [], defaultValue = possibleCallback) => {
  return typeof possibleCallback === "function" ? possibleCallback.call(...args) : defaultValue;
};
const executeAfterTransition = (callback, transitionElement, waitForTransition = true) => {
  if (!waitForTransition) {
    execute(callback);
    return;
  }
  const durationPadding = 5;
  const emulatedDuration = getTransitionDurationFromElement(transitionElement) + durationPadding;
  let called = false;
  const handler = ({
    target
  }) => {
    if (target !== transitionElement) {
      return;
    }
    called = true;
    transitionElement.removeEventListener(TRANSITION_END, handler);
    execute(callback);
  };
  transitionElement.addEventListener(TRANSITION_END, handler);
  setTimeout(() => {
    if (!called) {
      triggerTransitionEnd(transitionElement);
    }
  }, emulatedDuration);
};
const getNextActiveElement = (list, activeElement, shouldGetNext, isCycleAllowed) => {
  const listLength = list.length;
  let index = list.indexOf(activeElement);
  if (index === -1) {
    return !shouldGetNext && isCycleAllowed ? list[listLength - 1] : list[0];
  }
  index += shouldGetNext ? 1 : -1;
  if (isCycleAllowed) {
    index = (index + listLength) % listLength;
  }
  return list[Math.max(0, Math.min(index, listLength - 1))];
};
const namespaceRegex = /[^.]*(?=\..*)\.|.*/;
const stripNameRegex = /\..*/;
const stripUidRegex = /::\d+$/;
const eventRegistry = {};
let uidEvent = 1;
const customEvents = {
  mouseenter: "mouseover",
  mouseleave: "mouseout"
};
const nativeEvents = /* @__PURE__ */ new Set(["click", "dblclick", "mouseup", "mousedown", "contextmenu", "mousewheel", "DOMMouseScroll", "mouseover", "mouseout", "mousemove", "selectstart", "selectend", "keydown", "keypress", "keyup", "orientationchange", "touchstart", "touchmove", "touchend", "touchcancel", "pointerdown", "pointermove", "pointerup", "pointerleave", "pointercancel", "gesturestart", "gesturechange", "gestureend", "focus", "blur", "change", "reset", "select", "submit", "focusin", "focusout", "load", "unload", "beforeunload", "resize", "move", "DOMContentLoaded", "readystatechange", "error", "abort", "scroll"]);
function makeEventUid(element, uid) {
  return uid && `${uid}::${uidEvent++}` || element.uidEvent || uidEvent++;
}
function getElementEvents(element) {
  const uid = makeEventUid(element);
  element.uidEvent = uid;
  eventRegistry[uid] = eventRegistry[uid] || {};
  return eventRegistry[uid];
}
function bootstrapHandler(element, fn2) {
  return function handler(event) {
    hydrateObj(event, {
      delegateTarget: element
    });
    if (handler.oneOff) {
      EventHandler.off(element, event.type, fn2);
    }
    return fn2.apply(element, [event]);
  };
}
function bootstrapDelegationHandler(element, selector, fn2) {
  return function handler(event) {
    const domElements = element.querySelectorAll(selector);
    for (let {
      target
    } = event; target && target !== this; target = target.parentNode) {
      for (const domElement of domElements) {
        if (domElement !== target) {
          continue;
        }
        hydrateObj(event, {
          delegateTarget: target
        });
        if (handler.oneOff) {
          EventHandler.off(element, event.type, selector, fn2);
        }
        return fn2.apply(target, [event]);
      }
    }
  };
}
function findHandler(events, callable, delegationSelector = null) {
  return Object.values(events).find((event) => event.callable === callable && event.delegationSelector === delegationSelector);
}
function normalizeParameters(originalTypeEvent, handler, delegationFunction) {
  const isDelegated = typeof handler === "string";
  const callable = isDelegated ? delegationFunction : handler || delegationFunction;
  let typeEvent = getTypeEvent(originalTypeEvent);
  if (!nativeEvents.has(typeEvent)) {
    typeEvent = originalTypeEvent;
  }
  return [isDelegated, callable, typeEvent];
}
function addHandler(element, originalTypeEvent, handler, delegationFunction, oneOff) {
  if (typeof originalTypeEvent !== "string" || !element) {
    return;
  }
  let [isDelegated, callable, typeEvent] = normalizeParameters(originalTypeEvent, handler, delegationFunction);
  if (originalTypeEvent in customEvents) {
    const wrapFunction = (fn3) => {
      return function(event) {
        if (!event.relatedTarget || event.relatedTarget !== event.delegateTarget && !event.delegateTarget.contains(event.relatedTarget)) {
          return fn3.call(this, event);
        }
      };
    };
    callable = wrapFunction(callable);
  }
  const events = getElementEvents(element);
  const handlers = events[typeEvent] || (events[typeEvent] = {});
  const previousFunction = findHandler(handlers, callable, isDelegated ? handler : null);
  if (previousFunction) {
    previousFunction.oneOff = previousFunction.oneOff && oneOff;
    return;
  }
  const uid = makeEventUid(callable, originalTypeEvent.replace(namespaceRegex, ""));
  const fn2 = isDelegated ? bootstrapDelegationHandler(element, handler, callable) : bootstrapHandler(element, callable);
  fn2.delegationSelector = isDelegated ? handler : null;
  fn2.callable = callable;
  fn2.oneOff = oneOff;
  fn2.uidEvent = uid;
  handlers[uid] = fn2;
  element.addEventListener(typeEvent, fn2, isDelegated);
}
function removeHandler(element, events, typeEvent, handler, delegationSelector) {
  const fn2 = findHandler(events[typeEvent], handler, delegationSelector);
  if (!fn2) {
    return;
  }
  element.removeEventListener(typeEvent, fn2, Boolean(delegationSelector));
  delete events[typeEvent][fn2.uidEvent];
}
function removeNamespacedHandlers(element, events, typeEvent, namespace) {
  const storeElementEvent = events[typeEvent] || {};
  for (const [handlerKey, event] of Object.entries(storeElementEvent)) {
    if (handlerKey.includes(namespace)) {
      removeHandler(element, events, typeEvent, event.callable, event.delegationSelector);
    }
  }
}
function getTypeEvent(event) {
  event = event.replace(stripNameRegex, "");
  return customEvents[event] || event;
}
const EventHandler = {
  on(element, event, handler, delegationFunction) {
    addHandler(element, event, handler, delegationFunction, false);
  },
  one(element, event, handler, delegationFunction) {
    addHandler(element, event, handler, delegationFunction, true);
  },
  off(element, originalTypeEvent, handler, delegationFunction) {
    if (typeof originalTypeEvent !== "string" || !element) {
      return;
    }
    const [isDelegated, callable, typeEvent] = normalizeParameters(originalTypeEvent, handler, delegationFunction);
    const inNamespace = typeEvent !== originalTypeEvent;
    const events = getElementEvents(element);
    const storeElementEvent = events[typeEvent] || {};
    const isNamespace = originalTypeEvent.startsWith(".");
    if (typeof callable !== "undefined") {
      if (!Object.keys(storeElementEvent).length) {
        return;
      }
      removeHandler(element, events, typeEvent, callable, isDelegated ? handler : null);
      return;
    }
    if (isNamespace) {
      for (const elementEvent of Object.keys(events)) {
        removeNamespacedHandlers(element, events, elementEvent, originalTypeEvent.slice(1));
      }
    }
    for (const [keyHandlers, event] of Object.entries(storeElementEvent)) {
      const handlerKey = keyHandlers.replace(stripUidRegex, "");
      if (!inNamespace || originalTypeEvent.includes(handlerKey)) {
        removeHandler(element, events, typeEvent, event.callable, event.delegationSelector);
      }
    }
  },
  trigger(element, event, args) {
    if (typeof event !== "string" || !element) {
      return null;
    }
    const $ = getjQuery();
    const typeEvent = getTypeEvent(event);
    const inNamespace = event !== typeEvent;
    let jQueryEvent = null;
    let bubbles = true;
    let nativeDispatch = true;
    let defaultPrevented = false;
    if (inNamespace && $) {
      jQueryEvent = $.Event(event, args);
      $(element).trigger(jQueryEvent);
      bubbles = !jQueryEvent.isPropagationStopped();
      nativeDispatch = !jQueryEvent.isImmediatePropagationStopped();
      defaultPrevented = jQueryEvent.isDefaultPrevented();
    }
    const evt = hydrateObj(new Event(event, {
      bubbles,
      cancelable: true
    }), args);
    if (defaultPrevented) {
      evt.preventDefault();
    }
    if (nativeDispatch) {
      element.dispatchEvent(evt);
    }
    if (evt.defaultPrevented && jQueryEvent) {
      jQueryEvent.preventDefault();
    }
    return evt;
  }
};
function hydrateObj(obj, meta = {}) {
  for (const [key, value] of Object.entries(meta)) {
    try {
      obj[key] = value;
    } catch (_unused) {
      Object.defineProperty(obj, key, {
        configurable: true,
        get() {
          return value;
        }
      });
    }
  }
  return obj;
}
function normalizeData(value) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value === Number(value).toString()) {
    return Number(value);
  }
  if (value === "" || value === "null") {
    return null;
  }
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(decodeURIComponent(value));
  } catch (_unused) {
    return value;
  }
}
function normalizeDataKey(key) {
  return key.replace(/[A-Z]/g, (chr) => `-${chr.toLowerCase()}`);
}
const Manipulator = {
  setDataAttribute(element, key, value) {
    element.setAttribute(`data-bs-${normalizeDataKey(key)}`, value);
  },
  removeDataAttribute(element, key) {
    element.removeAttribute(`data-bs-${normalizeDataKey(key)}`);
  },
  getDataAttributes(element) {
    if (!element) {
      return {};
    }
    const attributes = {};
    const bsKeys = Object.keys(element.dataset).filter((key) => key.startsWith("bs") && !key.startsWith("bsConfig"));
    for (const key of bsKeys) {
      let pureKey = key.replace(/^bs/, "");
      pureKey = pureKey.charAt(0).toLowerCase() + pureKey.slice(1);
      attributes[pureKey] = normalizeData(element.dataset[key]);
    }
    return attributes;
  },
  getDataAttribute(element, key) {
    return normalizeData(element.getAttribute(`data-bs-${normalizeDataKey(key)}`));
  }
};
class Config {
  // Getters
  static get Default() {
    return {};
  }
  static get DefaultType() {
    return {};
  }
  static get NAME() {
    throw new Error('You have to implement the static method "NAME", for each component!');
  }
  _getConfig(config) {
    config = this._mergeConfigObj(config);
    config = this._configAfterMerge(config);
    this._typeCheckConfig(config);
    return config;
  }
  _configAfterMerge(config) {
    return config;
  }
  _mergeConfigObj(config, element) {
    const jsonConfig = isElement(element) ? Manipulator.getDataAttribute(element, "config") : {};
    return {
      ...this.constructor.Default,
      ...typeof jsonConfig === "object" ? jsonConfig : {},
      ...isElement(element) ? Manipulator.getDataAttributes(element) : {},
      ...typeof config === "object" ? config : {}
    };
  }
  _typeCheckConfig(config, configTypes = this.constructor.DefaultType) {
    for (const [property, expectedTypes] of Object.entries(configTypes)) {
      const value = config[property];
      const valueType = isElement(value) ? "element" : toType(value);
      if (!new RegExp(expectedTypes).test(valueType)) {
        throw new TypeError(`${this.constructor.NAME.toUpperCase()}: Option "${property}" provided type "${valueType}" but expected type "${expectedTypes}".`);
      }
    }
  }
}
const VERSION = "5.3.8";
class BaseComponent extends Config {
  constructor(element, config) {
    super();
    element = getElement(element);
    if (!element) {
      return;
    }
    this._element = element;
    this._config = this._getConfig(config);
    Data.set(this._element, this.constructor.DATA_KEY, this);
  }
  // Public
  dispose() {
    Data.remove(this._element, this.constructor.DATA_KEY);
    EventHandler.off(this._element, this.constructor.EVENT_KEY);
    for (const propertyName of Object.getOwnPropertyNames(this)) {
      this[propertyName] = null;
    }
  }
  // Private
  _queueCallback(callback, element, isAnimated = true) {
    executeAfterTransition(callback, element, isAnimated);
  }
  _getConfig(config) {
    config = this._mergeConfigObj(config, this._element);
    config = this._configAfterMerge(config);
    this._typeCheckConfig(config);
    return config;
  }
  // Static
  static getInstance(element) {
    return Data.get(getElement(element), this.DATA_KEY);
  }
  static getOrCreateInstance(element, config = {}) {
    return this.getInstance(element) || new this(element, typeof config === "object" ? config : null);
  }
  static get VERSION() {
    return VERSION;
  }
  static get DATA_KEY() {
    return `bs.${this.NAME}`;
  }
  static get EVENT_KEY() {
    return `.${this.DATA_KEY}`;
  }
  static eventName(name) {
    return `${name}${this.EVENT_KEY}`;
  }
}
const getSelector = (element) => {
  let selector = element.getAttribute("data-bs-target");
  if (!selector || selector === "#") {
    let hrefAttribute = element.getAttribute("href");
    if (!hrefAttribute || !hrefAttribute.includes("#") && !hrefAttribute.startsWith(".")) {
      return null;
    }
    if (hrefAttribute.includes("#") && !hrefAttribute.startsWith("#")) {
      hrefAttribute = `#${hrefAttribute.split("#")[1]}`;
    }
    selector = hrefAttribute && hrefAttribute !== "#" ? hrefAttribute.trim() : null;
  }
  return selector ? selector.split(",").map((sel) => parseSelector(sel)).join(",") : null;
};
const SelectorEngine = {
  find(selector, element = document.documentElement) {
    return [].concat(...Element.prototype.querySelectorAll.call(element, selector));
  },
  findOne(selector, element = document.documentElement) {
    return Element.prototype.querySelector.call(element, selector);
  },
  children(element, selector) {
    return [].concat(...element.children).filter((child) => child.matches(selector));
  },
  parents(element, selector) {
    const parents = [];
    let ancestor = element.parentNode.closest(selector);
    while (ancestor) {
      parents.push(ancestor);
      ancestor = ancestor.parentNode.closest(selector);
    }
    return parents;
  },
  prev(element, selector) {
    let previous = element.previousElementSibling;
    while (previous) {
      if (previous.matches(selector)) {
        return [previous];
      }
      previous = previous.previousElementSibling;
    }
    return [];
  },
  // TODO: this is now unused; remove later along with prev()
  next(element, selector) {
    let next = element.nextElementSibling;
    while (next) {
      if (next.matches(selector)) {
        return [next];
      }
      next = next.nextElementSibling;
    }
    return [];
  },
  focusableChildren(element) {
    const focusables = ["a", "button", "input", "textarea", "select", "details", "[tabindex]", '[contenteditable="true"]'].map((selector) => `${selector}:not([tabindex^="-"])`).join(",");
    return this.find(focusables, element).filter((el) => !isDisabled(el) && isVisible(el));
  },
  getSelectorFromElement(element) {
    const selector = getSelector(element);
    if (selector) {
      return SelectorEngine.findOne(selector) ? selector : null;
    }
    return null;
  },
  getElementFromSelector(element) {
    const selector = getSelector(element);
    return selector ? SelectorEngine.findOne(selector) : null;
  },
  getMultipleElementsFromSelector(element) {
    const selector = getSelector(element);
    return selector ? SelectorEngine.find(selector) : [];
  }
};
const enableDismissTrigger = (component, method = "hide") => {
  const clickEvent = `click.dismiss${component.EVENT_KEY}`;
  const name = component.NAME;
  EventHandler.on(document, clickEvent, `[data-bs-dismiss="${name}"]`, function(event) {
    if (["A", "AREA"].includes(this.tagName)) {
      event.preventDefault();
    }
    if (isDisabled(this)) {
      return;
    }
    const target = SelectorEngine.getElementFromSelector(this) || this.closest(`.${name}`);
    const instance = component.getOrCreateInstance(target);
    instance[method]();
  });
};
const NAME$f = "alert";
const DATA_KEY$a = "bs.alert";
const EVENT_KEY$b = `.${DATA_KEY$a}`;
const EVENT_CLOSE = `close${EVENT_KEY$b}`;
const EVENT_CLOSED = `closed${EVENT_KEY$b}`;
const CLASS_NAME_FADE$5 = "fade";
const CLASS_NAME_SHOW$8 = "show";
class Alert extends BaseComponent {
  // Getters
  static get NAME() {
    return NAME$f;
  }
  // Public
  close() {
    const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE);
    if (closeEvent.defaultPrevented) {
      return;
    }
    this._element.classList.remove(CLASS_NAME_SHOW$8);
    const isAnimated = this._element.classList.contains(CLASS_NAME_FADE$5);
    this._queueCallback(() => this._destroyElement(), this._element, isAnimated);
  }
  // Private
  _destroyElement() {
    this._element.remove();
    EventHandler.trigger(this._element, EVENT_CLOSED);
    this.dispose();
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = Alert.getOrCreateInstance(this);
      if (typeof config !== "string") {
        return;
      }
      if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config](this);
    });
  }
}
enableDismissTrigger(Alert, "close");
defineJQueryPlugin(Alert);
const NAME$e = "button";
const DATA_KEY$9 = "bs.button";
const EVENT_KEY$a = `.${DATA_KEY$9}`;
const DATA_API_KEY$6 = ".data-api";
const CLASS_NAME_ACTIVE$3 = "active";
const SELECTOR_DATA_TOGGLE$5 = '[data-bs-toggle="button"]';
const EVENT_CLICK_DATA_API$6 = `click${EVENT_KEY$a}${DATA_API_KEY$6}`;
class Button extends BaseComponent {
  // Getters
  static get NAME() {
    return NAME$e;
  }
  // Public
  toggle() {
    this._element.setAttribute("aria-pressed", this._element.classList.toggle(CLASS_NAME_ACTIVE$3));
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = Button.getOrCreateInstance(this);
      if (config === "toggle") {
        data[config]();
      }
    });
  }
}
EventHandler.on(document, EVENT_CLICK_DATA_API$6, SELECTOR_DATA_TOGGLE$5, (event) => {
  event.preventDefault();
  const button = event.target.closest(SELECTOR_DATA_TOGGLE$5);
  const data = Button.getOrCreateInstance(button);
  data.toggle();
});
defineJQueryPlugin(Button);
const NAME$d = "swipe";
const EVENT_KEY$9 = ".bs.swipe";
const EVENT_TOUCHSTART = `touchstart${EVENT_KEY$9}`;
const EVENT_TOUCHMOVE = `touchmove${EVENT_KEY$9}`;
const EVENT_TOUCHEND = `touchend${EVENT_KEY$9}`;
const EVENT_POINTERDOWN = `pointerdown${EVENT_KEY$9}`;
const EVENT_POINTERUP = `pointerup${EVENT_KEY$9}`;
const POINTER_TYPE_TOUCH = "touch";
const POINTER_TYPE_PEN = "pen";
const CLASS_NAME_POINTER_EVENT = "pointer-event";
const SWIPE_THRESHOLD = 40;
const Default$c = {
  endCallback: null,
  leftCallback: null,
  rightCallback: null
};
const DefaultType$c = {
  endCallback: "(function|null)",
  leftCallback: "(function|null)",
  rightCallback: "(function|null)"
};
class Swipe extends Config {
  constructor(element, config) {
    super();
    this._element = element;
    if (!element || !Swipe.isSupported()) {
      return;
    }
    this._config = this._getConfig(config);
    this._deltaX = 0;
    this._supportPointerEvents = Boolean(window.PointerEvent);
    this._initEvents();
  }
  // Getters
  static get Default() {
    return Default$c;
  }
  static get DefaultType() {
    return DefaultType$c;
  }
  static get NAME() {
    return NAME$d;
  }
  // Public
  dispose() {
    EventHandler.off(this._element, EVENT_KEY$9);
  }
  // Private
  _start(event) {
    if (!this._supportPointerEvents) {
      this._deltaX = event.touches[0].clientX;
      return;
    }
    if (this._eventIsPointerPenTouch(event)) {
      this._deltaX = event.clientX;
    }
  }
  _end(event) {
    if (this._eventIsPointerPenTouch(event)) {
      this._deltaX = event.clientX - this._deltaX;
    }
    this._handleSwipe();
    execute(this._config.endCallback);
  }
  _move(event) {
    this._deltaX = event.touches && event.touches.length > 1 ? 0 : event.touches[0].clientX - this._deltaX;
  }
  _handleSwipe() {
    const absDeltaX = Math.abs(this._deltaX);
    if (absDeltaX <= SWIPE_THRESHOLD) {
      return;
    }
    const direction = absDeltaX / this._deltaX;
    this._deltaX = 0;
    if (!direction) {
      return;
    }
    execute(direction > 0 ? this._config.rightCallback : this._config.leftCallback);
  }
  _initEvents() {
    if (this._supportPointerEvents) {
      EventHandler.on(this._element, EVENT_POINTERDOWN, (event) => this._start(event));
      EventHandler.on(this._element, EVENT_POINTERUP, (event) => this._end(event));
      this._element.classList.add(CLASS_NAME_POINTER_EVENT);
    } else {
      EventHandler.on(this._element, EVENT_TOUCHSTART, (event) => this._start(event));
      EventHandler.on(this._element, EVENT_TOUCHMOVE, (event) => this._move(event));
      EventHandler.on(this._element, EVENT_TOUCHEND, (event) => this._end(event));
    }
  }
  _eventIsPointerPenTouch(event) {
    return this._supportPointerEvents && (event.pointerType === POINTER_TYPE_PEN || event.pointerType === POINTER_TYPE_TOUCH);
  }
  // Static
  static isSupported() {
    return "ontouchstart" in document.documentElement || navigator.maxTouchPoints > 0;
  }
}
const NAME$c = "carousel";
const DATA_KEY$8 = "bs.carousel";
const EVENT_KEY$8 = `.${DATA_KEY$8}`;
const DATA_API_KEY$5 = ".data-api";
const ARROW_LEFT_KEY$1 = "ArrowLeft";
const ARROW_RIGHT_KEY$1 = "ArrowRight";
const TOUCHEVENT_COMPAT_WAIT = 500;
const ORDER_NEXT = "next";
const ORDER_PREV = "prev";
const DIRECTION_LEFT = "left";
const DIRECTION_RIGHT = "right";
const EVENT_SLIDE = `slide${EVENT_KEY$8}`;
const EVENT_SLID = `slid${EVENT_KEY$8}`;
const EVENT_KEYDOWN$1 = `keydown${EVENT_KEY$8}`;
const EVENT_MOUSEENTER$1 = `mouseenter${EVENT_KEY$8}`;
const EVENT_MOUSELEAVE$1 = `mouseleave${EVENT_KEY$8}`;
const EVENT_DRAG_START = `dragstart${EVENT_KEY$8}`;
const EVENT_LOAD_DATA_API$3 = `load${EVENT_KEY$8}${DATA_API_KEY$5}`;
const EVENT_CLICK_DATA_API$5 = `click${EVENT_KEY$8}${DATA_API_KEY$5}`;
const CLASS_NAME_CAROUSEL = "carousel";
const CLASS_NAME_ACTIVE$2 = "active";
const CLASS_NAME_SLIDE = "slide";
const CLASS_NAME_END = "carousel-item-end";
const CLASS_NAME_START = "carousel-item-start";
const CLASS_NAME_NEXT = "carousel-item-next";
const CLASS_NAME_PREV = "carousel-item-prev";
const SELECTOR_ACTIVE = ".active";
const SELECTOR_ITEM = ".carousel-item";
const SELECTOR_ACTIVE_ITEM = SELECTOR_ACTIVE + SELECTOR_ITEM;
const SELECTOR_ITEM_IMG = ".carousel-item img";
const SELECTOR_INDICATORS = ".carousel-indicators";
const SELECTOR_DATA_SLIDE = "[data-bs-slide], [data-bs-slide-to]";
const SELECTOR_DATA_RIDE = '[data-bs-ride="carousel"]';
const KEY_TO_DIRECTION = {
  [ARROW_LEFT_KEY$1]: DIRECTION_RIGHT,
  [ARROW_RIGHT_KEY$1]: DIRECTION_LEFT
};
const Default$b = {
  interval: 5e3,
  keyboard: true,
  pause: "hover",
  ride: false,
  touch: true,
  wrap: true
};
const DefaultType$b = {
  interval: "(number|boolean)",
  // TODO:v6 remove boolean support
  keyboard: "boolean",
  pause: "(string|boolean)",
  ride: "(boolean|string)",
  touch: "boolean",
  wrap: "boolean"
};
class Carousel extends BaseComponent {
  constructor(element, config) {
    super(element, config);
    this._interval = null;
    this._activeElement = null;
    this._isSliding = false;
    this.touchTimeout = null;
    this._swipeHelper = null;
    this._indicatorsElement = SelectorEngine.findOne(SELECTOR_INDICATORS, this._element);
    this._addEventListeners();
    if (this._config.ride === CLASS_NAME_CAROUSEL) {
      this.cycle();
    }
  }
  // Getters
  static get Default() {
    return Default$b;
  }
  static get DefaultType() {
    return DefaultType$b;
  }
  static get NAME() {
    return NAME$c;
  }
  // Public
  next() {
    this._slide(ORDER_NEXT);
  }
  nextWhenVisible() {
    if (!document.hidden && isVisible(this._element)) {
      this.next();
    }
  }
  prev() {
    this._slide(ORDER_PREV);
  }
  pause() {
    if (this._isSliding) {
      triggerTransitionEnd(this._element);
    }
    this._clearInterval();
  }
  cycle() {
    this._clearInterval();
    this._updateInterval();
    this._interval = setInterval(() => this.nextWhenVisible(), this._config.interval);
  }
  _maybeEnableCycle() {
    if (!this._config.ride) {
      return;
    }
    if (this._isSliding) {
      EventHandler.one(this._element, EVENT_SLID, () => this.cycle());
      return;
    }
    this.cycle();
  }
  to(index) {
    const items = this._getItems();
    if (index > items.length - 1 || index < 0) {
      return;
    }
    if (this._isSliding) {
      EventHandler.one(this._element, EVENT_SLID, () => this.to(index));
      return;
    }
    const activeIndex = this._getItemIndex(this._getActive());
    if (activeIndex === index) {
      return;
    }
    const order2 = index > activeIndex ? ORDER_NEXT : ORDER_PREV;
    this._slide(order2, items[index]);
  }
  dispose() {
    if (this._swipeHelper) {
      this._swipeHelper.dispose();
    }
    super.dispose();
  }
  // Private
  _configAfterMerge(config) {
    config.defaultInterval = config.interval;
    return config;
  }
  _addEventListeners() {
    if (this._config.keyboard) {
      EventHandler.on(this._element, EVENT_KEYDOWN$1, (event) => this._keydown(event));
    }
    if (this._config.pause === "hover") {
      EventHandler.on(this._element, EVENT_MOUSEENTER$1, () => this.pause());
      EventHandler.on(this._element, EVENT_MOUSELEAVE$1, () => this._maybeEnableCycle());
    }
    if (this._config.touch && Swipe.isSupported()) {
      this._addTouchEventListeners();
    }
  }
  _addTouchEventListeners() {
    for (const img of SelectorEngine.find(SELECTOR_ITEM_IMG, this._element)) {
      EventHandler.on(img, EVENT_DRAG_START, (event) => event.preventDefault());
    }
    const endCallBack = () => {
      if (this._config.pause !== "hover") {
        return;
      }
      this.pause();
      if (this.touchTimeout) {
        clearTimeout(this.touchTimeout);
      }
      this.touchTimeout = setTimeout(() => this._maybeEnableCycle(), TOUCHEVENT_COMPAT_WAIT + this._config.interval);
    };
    const swipeConfig = {
      leftCallback: () => this._slide(this._directionToOrder(DIRECTION_LEFT)),
      rightCallback: () => this._slide(this._directionToOrder(DIRECTION_RIGHT)),
      endCallback: endCallBack
    };
    this._swipeHelper = new Swipe(this._element, swipeConfig);
  }
  _keydown(event) {
    if (/input|textarea/i.test(event.target.tagName)) {
      return;
    }
    const direction = KEY_TO_DIRECTION[event.key];
    if (direction) {
      event.preventDefault();
      this._slide(this._directionToOrder(direction));
    }
  }
  _getItemIndex(element) {
    return this._getItems().indexOf(element);
  }
  _setActiveIndicatorElement(index) {
    if (!this._indicatorsElement) {
      return;
    }
    const activeIndicator = SelectorEngine.findOne(SELECTOR_ACTIVE, this._indicatorsElement);
    activeIndicator.classList.remove(CLASS_NAME_ACTIVE$2);
    activeIndicator.removeAttribute("aria-current");
    const newActiveIndicator = SelectorEngine.findOne(`[data-bs-slide-to="${index}"]`, this._indicatorsElement);
    if (newActiveIndicator) {
      newActiveIndicator.classList.add(CLASS_NAME_ACTIVE$2);
      newActiveIndicator.setAttribute("aria-current", "true");
    }
  }
  _updateInterval() {
    const element = this._activeElement || this._getActive();
    if (!element) {
      return;
    }
    const elementInterval = Number.parseInt(element.getAttribute("data-bs-interval"), 10);
    this._config.interval = elementInterval || this._config.defaultInterval;
  }
  _slide(order2, element = null) {
    if (this._isSliding) {
      return;
    }
    const activeElement = this._getActive();
    const isNext = order2 === ORDER_NEXT;
    const nextElement = element || getNextActiveElement(this._getItems(), activeElement, isNext, this._config.wrap);
    if (nextElement === activeElement) {
      return;
    }
    const nextElementIndex = this._getItemIndex(nextElement);
    const triggerEvent = (eventName) => {
      return EventHandler.trigger(this._element, eventName, {
        relatedTarget: nextElement,
        direction: this._orderToDirection(order2),
        from: this._getItemIndex(activeElement),
        to: nextElementIndex
      });
    };
    const slideEvent = triggerEvent(EVENT_SLIDE);
    if (slideEvent.defaultPrevented) {
      return;
    }
    if (!activeElement || !nextElement) {
      return;
    }
    const isCycling = Boolean(this._interval);
    this.pause();
    this._isSliding = true;
    this._setActiveIndicatorElement(nextElementIndex);
    this._activeElement = nextElement;
    const directionalClassName = isNext ? CLASS_NAME_START : CLASS_NAME_END;
    const orderClassName = isNext ? CLASS_NAME_NEXT : CLASS_NAME_PREV;
    nextElement.classList.add(orderClassName);
    reflow(nextElement);
    activeElement.classList.add(directionalClassName);
    nextElement.classList.add(directionalClassName);
    const completeCallBack = () => {
      nextElement.classList.remove(directionalClassName, orderClassName);
      nextElement.classList.add(CLASS_NAME_ACTIVE$2);
      activeElement.classList.remove(CLASS_NAME_ACTIVE$2, orderClassName, directionalClassName);
      this._isSliding = false;
      triggerEvent(EVENT_SLID);
    };
    this._queueCallback(completeCallBack, activeElement, this._isAnimated());
    if (isCycling) {
      this.cycle();
    }
  }
  _isAnimated() {
    return this._element.classList.contains(CLASS_NAME_SLIDE);
  }
  _getActive() {
    return SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element);
  }
  _getItems() {
    return SelectorEngine.find(SELECTOR_ITEM, this._element);
  }
  _clearInterval() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }
  _directionToOrder(direction) {
    if (isRTL()) {
      return direction === DIRECTION_LEFT ? ORDER_PREV : ORDER_NEXT;
    }
    return direction === DIRECTION_LEFT ? ORDER_NEXT : ORDER_PREV;
  }
  _orderToDirection(order2) {
    if (isRTL()) {
      return order2 === ORDER_PREV ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
    return order2 === ORDER_PREV ? DIRECTION_RIGHT : DIRECTION_LEFT;
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = Carousel.getOrCreateInstance(this, config);
      if (typeof config === "number") {
        data.to(config);
        return;
      }
      if (typeof config === "string") {
        if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config]();
      }
    });
  }
}
EventHandler.on(document, EVENT_CLICK_DATA_API$5, SELECTOR_DATA_SLIDE, function(event) {
  const target = SelectorEngine.getElementFromSelector(this);
  if (!target || !target.classList.contains(CLASS_NAME_CAROUSEL)) {
    return;
  }
  event.preventDefault();
  const carousel = Carousel.getOrCreateInstance(target);
  const slideIndex = this.getAttribute("data-bs-slide-to");
  if (slideIndex) {
    carousel.to(slideIndex);
    carousel._maybeEnableCycle();
    return;
  }
  if (Manipulator.getDataAttribute(this, "slide") === "next") {
    carousel.next();
    carousel._maybeEnableCycle();
    return;
  }
  carousel.prev();
  carousel._maybeEnableCycle();
});
EventHandler.on(window, EVENT_LOAD_DATA_API$3, () => {
  const carousels = SelectorEngine.find(SELECTOR_DATA_RIDE);
  for (const carousel of carousels) {
    Carousel.getOrCreateInstance(carousel);
  }
});
defineJQueryPlugin(Carousel);
const NAME$b = "collapse";
const DATA_KEY$7 = "bs.collapse";
const EVENT_KEY$7 = `.${DATA_KEY$7}`;
const DATA_API_KEY$4 = ".data-api";
const EVENT_SHOW$6 = `show${EVENT_KEY$7}`;
const EVENT_SHOWN$6 = `shown${EVENT_KEY$7}`;
const EVENT_HIDE$6 = `hide${EVENT_KEY$7}`;
const EVENT_HIDDEN$6 = `hidden${EVENT_KEY$7}`;
const EVENT_CLICK_DATA_API$4 = `click${EVENT_KEY$7}${DATA_API_KEY$4}`;
const CLASS_NAME_SHOW$7 = "show";
const CLASS_NAME_COLLAPSE = "collapse";
const CLASS_NAME_COLLAPSING = "collapsing";
const CLASS_NAME_COLLAPSED = "collapsed";
const CLASS_NAME_DEEPER_CHILDREN = `:scope .${CLASS_NAME_COLLAPSE} .${CLASS_NAME_COLLAPSE}`;
const CLASS_NAME_HORIZONTAL = "collapse-horizontal";
const WIDTH = "width";
const HEIGHT = "height";
const SELECTOR_ACTIVES = ".collapse.show, .collapse.collapsing";
const SELECTOR_DATA_TOGGLE$4 = '[data-bs-toggle="collapse"]';
const Default$a = {
  parent: null,
  toggle: true
};
const DefaultType$a = {
  parent: "(null|element)",
  toggle: "boolean"
};
class Collapse extends BaseComponent {
  constructor(element, config) {
    super(element, config);
    this._isTransitioning = false;
    this._triggerArray = [];
    const toggleList = SelectorEngine.find(SELECTOR_DATA_TOGGLE$4);
    for (const elem of toggleList) {
      const selector = SelectorEngine.getSelectorFromElement(elem);
      const filterElement = SelectorEngine.find(selector).filter((foundElement) => foundElement === this._element);
      if (selector !== null && filterElement.length) {
        this._triggerArray.push(elem);
      }
    }
    this._initializeChildren();
    if (!this._config.parent) {
      this._addAriaAndCollapsedClass(this._triggerArray, this._isShown());
    }
    if (this._config.toggle) {
      this.toggle();
    }
  }
  // Getters
  static get Default() {
    return Default$a;
  }
  static get DefaultType() {
    return DefaultType$a;
  }
  static get NAME() {
    return NAME$b;
  }
  // Public
  toggle() {
    if (this._isShown()) {
      this.hide();
    } else {
      this.show();
    }
  }
  show() {
    if (this._isTransitioning || this._isShown()) {
      return;
    }
    let activeChildren = [];
    if (this._config.parent) {
      activeChildren = this._getFirstLevelChildren(SELECTOR_ACTIVES).filter((element) => element !== this._element).map((element) => Collapse.getOrCreateInstance(element, {
        toggle: false
      }));
    }
    if (activeChildren.length && activeChildren[0]._isTransitioning) {
      return;
    }
    const startEvent = EventHandler.trigger(this._element, EVENT_SHOW$6);
    if (startEvent.defaultPrevented) {
      return;
    }
    for (const activeInstance of activeChildren) {
      activeInstance.hide();
    }
    const dimension = this._getDimension();
    this._element.classList.remove(CLASS_NAME_COLLAPSE);
    this._element.classList.add(CLASS_NAME_COLLAPSING);
    this._element.style[dimension] = 0;
    this._addAriaAndCollapsedClass(this._triggerArray, true);
    this._isTransitioning = true;
    const complete = () => {
      this._isTransitioning = false;
      this._element.classList.remove(CLASS_NAME_COLLAPSING);
      this._element.classList.add(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);
      this._element.style[dimension] = "";
      EventHandler.trigger(this._element, EVENT_SHOWN$6);
    };
    const capitalizedDimension = dimension[0].toUpperCase() + dimension.slice(1);
    const scrollSize = `scroll${capitalizedDimension}`;
    this._queueCallback(complete, this._element, true);
    this._element.style[dimension] = `${this._element[scrollSize]}px`;
  }
  hide() {
    if (this._isTransitioning || !this._isShown()) {
      return;
    }
    const startEvent = EventHandler.trigger(this._element, EVENT_HIDE$6);
    if (startEvent.defaultPrevented) {
      return;
    }
    const dimension = this._getDimension();
    this._element.style[dimension] = `${this._element.getBoundingClientRect()[dimension]}px`;
    reflow(this._element);
    this._element.classList.add(CLASS_NAME_COLLAPSING);
    this._element.classList.remove(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);
    for (const trigger of this._triggerArray) {
      const element = SelectorEngine.getElementFromSelector(trigger);
      if (element && !this._isShown(element)) {
        this._addAriaAndCollapsedClass([trigger], false);
      }
    }
    this._isTransitioning = true;
    const complete = () => {
      this._isTransitioning = false;
      this._element.classList.remove(CLASS_NAME_COLLAPSING);
      this._element.classList.add(CLASS_NAME_COLLAPSE);
      EventHandler.trigger(this._element, EVENT_HIDDEN$6);
    };
    this._element.style[dimension] = "";
    this._queueCallback(complete, this._element, true);
  }
  // Private
  _isShown(element = this._element) {
    return element.classList.contains(CLASS_NAME_SHOW$7);
  }
  _configAfterMerge(config) {
    config.toggle = Boolean(config.toggle);
    config.parent = getElement(config.parent);
    return config;
  }
  _getDimension() {
    return this._element.classList.contains(CLASS_NAME_HORIZONTAL) ? WIDTH : HEIGHT;
  }
  _initializeChildren() {
    if (!this._config.parent) {
      return;
    }
    const children = this._getFirstLevelChildren(SELECTOR_DATA_TOGGLE$4);
    for (const element of children) {
      const selected = SelectorEngine.getElementFromSelector(element);
      if (selected) {
        this._addAriaAndCollapsedClass([element], this._isShown(selected));
      }
    }
  }
  _getFirstLevelChildren(selector) {
    const children = SelectorEngine.find(CLASS_NAME_DEEPER_CHILDREN, this._config.parent);
    return SelectorEngine.find(selector, this._config.parent).filter((element) => !children.includes(element));
  }
  _addAriaAndCollapsedClass(triggerArray, isOpen) {
    if (!triggerArray.length) {
      return;
    }
    for (const element of triggerArray) {
      element.classList.toggle(CLASS_NAME_COLLAPSED, !isOpen);
      element.setAttribute("aria-expanded", isOpen);
    }
  }
  // Static
  static jQueryInterface(config) {
    const _config = {};
    if (typeof config === "string" && /show|hide/.test(config)) {
      _config.toggle = false;
    }
    return this.each(function() {
      const data = Collapse.getOrCreateInstance(this, _config);
      if (typeof config === "string") {
        if (typeof data[config] === "undefined") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config]();
      }
    });
  }
}
EventHandler.on(document, EVENT_CLICK_DATA_API$4, SELECTOR_DATA_TOGGLE$4, function(event) {
  if (event.target.tagName === "A" || event.delegateTarget && event.delegateTarget.tagName === "A") {
    event.preventDefault();
  }
  for (const element of SelectorEngine.getMultipleElementsFromSelector(this)) {
    Collapse.getOrCreateInstance(element, {
      toggle: false
    }).toggle();
  }
});
defineJQueryPlugin(Collapse);
const NAME$a = "dropdown";
const DATA_KEY$6 = "bs.dropdown";
const EVENT_KEY$6 = `.${DATA_KEY$6}`;
const DATA_API_KEY$3 = ".data-api";
const ESCAPE_KEY$2 = "Escape";
const TAB_KEY$1 = "Tab";
const ARROW_UP_KEY$1 = "ArrowUp";
const ARROW_DOWN_KEY$1 = "ArrowDown";
const RIGHT_MOUSE_BUTTON = 2;
const EVENT_HIDE$5 = `hide${EVENT_KEY$6}`;
const EVENT_HIDDEN$5 = `hidden${EVENT_KEY$6}`;
const EVENT_SHOW$5 = `show${EVENT_KEY$6}`;
const EVENT_SHOWN$5 = `shown${EVENT_KEY$6}`;
const EVENT_CLICK_DATA_API$3 = `click${EVENT_KEY$6}${DATA_API_KEY$3}`;
const EVENT_KEYDOWN_DATA_API = `keydown${EVENT_KEY$6}${DATA_API_KEY$3}`;
const EVENT_KEYUP_DATA_API = `keyup${EVENT_KEY$6}${DATA_API_KEY$3}`;
const CLASS_NAME_SHOW$6 = "show";
const CLASS_NAME_DROPUP = "dropup";
const CLASS_NAME_DROPEND = "dropend";
const CLASS_NAME_DROPSTART = "dropstart";
const CLASS_NAME_DROPUP_CENTER = "dropup-center";
const CLASS_NAME_DROPDOWN_CENTER = "dropdown-center";
const SELECTOR_DATA_TOGGLE$3 = '[data-bs-toggle="dropdown"]:not(.disabled):not(:disabled)';
const SELECTOR_DATA_TOGGLE_SHOWN = `${SELECTOR_DATA_TOGGLE$3}.${CLASS_NAME_SHOW$6}`;
const SELECTOR_MENU = ".dropdown-menu";
const SELECTOR_NAVBAR = ".navbar";
const SELECTOR_NAVBAR_NAV = ".navbar-nav";
const SELECTOR_VISIBLE_ITEMS = ".dropdown-menu .dropdown-item:not(.disabled):not(:disabled)";
const PLACEMENT_TOP = isRTL() ? "top-end" : "top-start";
const PLACEMENT_TOPEND = isRTL() ? "top-start" : "top-end";
const PLACEMENT_BOTTOM = isRTL() ? "bottom-end" : "bottom-start";
const PLACEMENT_BOTTOMEND = isRTL() ? "bottom-start" : "bottom-end";
const PLACEMENT_RIGHT = isRTL() ? "left-start" : "right-start";
const PLACEMENT_LEFT = isRTL() ? "right-start" : "left-start";
const PLACEMENT_TOPCENTER = "top";
const PLACEMENT_BOTTOMCENTER = "bottom";
const Default$9 = {
  autoClose: true,
  boundary: "clippingParents",
  display: "dynamic",
  offset: [0, 2],
  popperConfig: null,
  reference: "toggle"
};
const DefaultType$9 = {
  autoClose: "(boolean|string)",
  boundary: "(string|element)",
  display: "string",
  offset: "(array|string|function)",
  popperConfig: "(null|object|function)",
  reference: "(string|element|object)"
};
class Dropdown extends BaseComponent {
  constructor(element, config) {
    super(element, config);
    this._popper = null;
    this._parent = this._element.parentNode;
    this._menu = SelectorEngine.next(this._element, SELECTOR_MENU)[0] || SelectorEngine.prev(this._element, SELECTOR_MENU)[0] || SelectorEngine.findOne(SELECTOR_MENU, this._parent);
    this._inNavbar = this._detectNavbar();
  }
  // Getters
  static get Default() {
    return Default$9;
  }
  static get DefaultType() {
    return DefaultType$9;
  }
  static get NAME() {
    return NAME$a;
  }
  // Public
  toggle() {
    return this._isShown() ? this.hide() : this.show();
  }
  show() {
    if (isDisabled(this._element) || this._isShown()) {
      return;
    }
    const relatedTarget = {
      relatedTarget: this._element
    };
    const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$5, relatedTarget);
    if (showEvent.defaultPrevented) {
      return;
    }
    this._createPopper();
    if ("ontouchstart" in document.documentElement && !this._parent.closest(SELECTOR_NAVBAR_NAV)) {
      for (const element of [].concat(...document.body.children)) {
        EventHandler.on(element, "mouseover", noop);
      }
    }
    this._element.focus();
    this._element.setAttribute("aria-expanded", true);
    this._menu.classList.add(CLASS_NAME_SHOW$6);
    this._element.classList.add(CLASS_NAME_SHOW$6);
    EventHandler.trigger(this._element, EVENT_SHOWN$5, relatedTarget);
  }
  hide() {
    if (isDisabled(this._element) || !this._isShown()) {
      return;
    }
    const relatedTarget = {
      relatedTarget: this._element
    };
    this._completeHide(relatedTarget);
  }
  dispose() {
    if (this._popper) {
      this._popper.destroy();
    }
    super.dispose();
  }
  update() {
    this._inNavbar = this._detectNavbar();
    if (this._popper) {
      this._popper.update();
    }
  }
  // Private
  _completeHide(relatedTarget) {
    const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$5, relatedTarget);
    if (hideEvent.defaultPrevented) {
      return;
    }
    if ("ontouchstart" in document.documentElement) {
      for (const element of [].concat(...document.body.children)) {
        EventHandler.off(element, "mouseover", noop);
      }
    }
    if (this._popper) {
      this._popper.destroy();
    }
    this._menu.classList.remove(CLASS_NAME_SHOW$6);
    this._element.classList.remove(CLASS_NAME_SHOW$6);
    this._element.setAttribute("aria-expanded", "false");
    Manipulator.removeDataAttribute(this._menu, "popper");
    EventHandler.trigger(this._element, EVENT_HIDDEN$5, relatedTarget);
  }
  _getConfig(config) {
    config = super._getConfig(config);
    if (typeof config.reference === "object" && !isElement(config.reference) && typeof config.reference.getBoundingClientRect !== "function") {
      throw new TypeError(`${NAME$a.toUpperCase()}: Option "reference" provided type "object" without a required "getBoundingClientRect" method.`);
    }
    return config;
  }
  _createPopper() {
    if (typeof Popper === "undefined") {
      throw new TypeError("Bootstrap's dropdowns require Popper (https://popper.js.org/docs/v2/)");
    }
    let referenceElement = this._element;
    if (this._config.reference === "parent") {
      referenceElement = this._parent;
    } else if (isElement(this._config.reference)) {
      referenceElement = getElement(this._config.reference);
    } else if (typeof this._config.reference === "object") {
      referenceElement = this._config.reference;
    }
    const popperConfig = this._getPopperConfig();
    this._popper = createPopper(referenceElement, this._menu, popperConfig);
  }
  _isShown() {
    return this._menu.classList.contains(CLASS_NAME_SHOW$6);
  }
  _getPlacement() {
    const parentDropdown = this._parent;
    if (parentDropdown.classList.contains(CLASS_NAME_DROPEND)) {
      return PLACEMENT_RIGHT;
    }
    if (parentDropdown.classList.contains(CLASS_NAME_DROPSTART)) {
      return PLACEMENT_LEFT;
    }
    if (parentDropdown.classList.contains(CLASS_NAME_DROPUP_CENTER)) {
      return PLACEMENT_TOPCENTER;
    }
    if (parentDropdown.classList.contains(CLASS_NAME_DROPDOWN_CENTER)) {
      return PLACEMENT_BOTTOMCENTER;
    }
    const isEnd = getComputedStyle(this._menu).getPropertyValue("--bs-position").trim() === "end";
    if (parentDropdown.classList.contains(CLASS_NAME_DROPUP)) {
      return isEnd ? PLACEMENT_TOPEND : PLACEMENT_TOP;
    }
    return isEnd ? PLACEMENT_BOTTOMEND : PLACEMENT_BOTTOM;
  }
  _detectNavbar() {
    return this._element.closest(SELECTOR_NAVBAR) !== null;
  }
  _getOffset() {
    const {
      offset: offset2
    } = this._config;
    if (typeof offset2 === "string") {
      return offset2.split(",").map((value) => Number.parseInt(value, 10));
    }
    if (typeof offset2 === "function") {
      return (popperData) => offset2(popperData, this._element);
    }
    return offset2;
  }
  _getPopperConfig() {
    const defaultBsPopperConfig = {
      placement: this._getPlacement(),
      modifiers: [{
        name: "preventOverflow",
        options: {
          boundary: this._config.boundary
        }
      }, {
        name: "offset",
        options: {
          offset: this._getOffset()
        }
      }]
    };
    if (this._inNavbar || this._config.display === "static") {
      Manipulator.setDataAttribute(this._menu, "popper", "static");
      defaultBsPopperConfig.modifiers = [{
        name: "applyStyles",
        enabled: false
      }];
    }
    return {
      ...defaultBsPopperConfig,
      ...execute(this._config.popperConfig, [void 0, defaultBsPopperConfig])
    };
  }
  _selectMenuItem({
    key,
    target
  }) {
    const items = SelectorEngine.find(SELECTOR_VISIBLE_ITEMS, this._menu).filter((element) => isVisible(element));
    if (!items.length) {
      return;
    }
    getNextActiveElement(items, target, key === ARROW_DOWN_KEY$1, !items.includes(target)).focus();
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = Dropdown.getOrCreateInstance(this, config);
      if (typeof config !== "string") {
        return;
      }
      if (typeof data[config] === "undefined") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config]();
    });
  }
  static clearMenus(event) {
    if (event.button === RIGHT_MOUSE_BUTTON || event.type === "keyup" && event.key !== TAB_KEY$1) {
      return;
    }
    const openToggles = SelectorEngine.find(SELECTOR_DATA_TOGGLE_SHOWN);
    for (const toggle of openToggles) {
      const context = Dropdown.getInstance(toggle);
      if (!context || context._config.autoClose === false) {
        continue;
      }
      const composedPath = event.composedPath();
      const isMenuTarget = composedPath.includes(context._menu);
      if (composedPath.includes(context._element) || context._config.autoClose === "inside" && !isMenuTarget || context._config.autoClose === "outside" && isMenuTarget) {
        continue;
      }
      if (context._menu.contains(event.target) && (event.type === "keyup" && event.key === TAB_KEY$1 || /input|select|option|textarea|form/i.test(event.target.tagName))) {
        continue;
      }
      const relatedTarget = {
        relatedTarget: context._element
      };
      if (event.type === "click") {
        relatedTarget.clickEvent = event;
      }
      context._completeHide(relatedTarget);
    }
  }
  static dataApiKeydownHandler(event) {
    const isInput = /input|textarea/i.test(event.target.tagName);
    const isEscapeEvent = event.key === ESCAPE_KEY$2;
    const isUpOrDownEvent = [ARROW_UP_KEY$1, ARROW_DOWN_KEY$1].includes(event.key);
    if (!isUpOrDownEvent && !isEscapeEvent) {
      return;
    }
    if (isInput && !isEscapeEvent) {
      return;
    }
    event.preventDefault();
    const getToggleButton = this.matches(SELECTOR_DATA_TOGGLE$3) ? this : SelectorEngine.prev(this, SELECTOR_DATA_TOGGLE$3)[0] || SelectorEngine.next(this, SELECTOR_DATA_TOGGLE$3)[0] || SelectorEngine.findOne(SELECTOR_DATA_TOGGLE$3, event.delegateTarget.parentNode);
    const instance = Dropdown.getOrCreateInstance(getToggleButton);
    if (isUpOrDownEvent) {
      event.stopPropagation();
      instance.show();
      instance._selectMenuItem(event);
      return;
    }
    if (instance._isShown()) {
      event.stopPropagation();
      instance.hide();
      getToggleButton.focus();
    }
  }
}
EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_DATA_TOGGLE$3, Dropdown.dataApiKeydownHandler);
EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_MENU, Dropdown.dataApiKeydownHandler);
EventHandler.on(document, EVENT_CLICK_DATA_API$3, Dropdown.clearMenus);
EventHandler.on(document, EVENT_KEYUP_DATA_API, Dropdown.clearMenus);
EventHandler.on(document, EVENT_CLICK_DATA_API$3, SELECTOR_DATA_TOGGLE$3, function(event) {
  event.preventDefault();
  Dropdown.getOrCreateInstance(this).toggle();
});
defineJQueryPlugin(Dropdown);
const NAME$9 = "backdrop";
const CLASS_NAME_FADE$4 = "fade";
const CLASS_NAME_SHOW$5 = "show";
const EVENT_MOUSEDOWN = `mousedown.bs.${NAME$9}`;
const Default$8 = {
  className: "modal-backdrop",
  clickCallback: null,
  isAnimated: false,
  isVisible: true,
  // if false, we use the backdrop helper without adding any element to the dom
  rootElement: "body"
  // give the choice to place backdrop under different elements
};
const DefaultType$8 = {
  className: "string",
  clickCallback: "(function|null)",
  isAnimated: "boolean",
  isVisible: "boolean",
  rootElement: "(element|string)"
};
class Backdrop extends Config {
  constructor(config) {
    super();
    this._config = this._getConfig(config);
    this._isAppended = false;
    this._element = null;
  }
  // Getters
  static get Default() {
    return Default$8;
  }
  static get DefaultType() {
    return DefaultType$8;
  }
  static get NAME() {
    return NAME$9;
  }
  // Public
  show(callback) {
    if (!this._config.isVisible) {
      execute(callback);
      return;
    }
    this._append();
    const element = this._getElement();
    if (this._config.isAnimated) {
      reflow(element);
    }
    element.classList.add(CLASS_NAME_SHOW$5);
    this._emulateAnimation(() => {
      execute(callback);
    });
  }
  hide(callback) {
    if (!this._config.isVisible) {
      execute(callback);
      return;
    }
    this._getElement().classList.remove(CLASS_NAME_SHOW$5);
    this._emulateAnimation(() => {
      this.dispose();
      execute(callback);
    });
  }
  dispose() {
    if (!this._isAppended) {
      return;
    }
    EventHandler.off(this._element, EVENT_MOUSEDOWN);
    this._element.remove();
    this._isAppended = false;
  }
  // Private
  _getElement() {
    if (!this._element) {
      const backdrop = document.createElement("div");
      backdrop.className = this._config.className;
      if (this._config.isAnimated) {
        backdrop.classList.add(CLASS_NAME_FADE$4);
      }
      this._element = backdrop;
    }
    return this._element;
  }
  _configAfterMerge(config) {
    config.rootElement = getElement(config.rootElement);
    return config;
  }
  _append() {
    if (this._isAppended) {
      return;
    }
    const element = this._getElement();
    this._config.rootElement.append(element);
    EventHandler.on(element, EVENT_MOUSEDOWN, () => {
      execute(this._config.clickCallback);
    });
    this._isAppended = true;
  }
  _emulateAnimation(callback) {
    executeAfterTransition(callback, this._getElement(), this._config.isAnimated);
  }
}
const NAME$8 = "focustrap";
const DATA_KEY$5 = "bs.focustrap";
const EVENT_KEY$5 = `.${DATA_KEY$5}`;
const EVENT_FOCUSIN$2 = `focusin${EVENT_KEY$5}`;
const EVENT_KEYDOWN_TAB = `keydown.tab${EVENT_KEY$5}`;
const TAB_KEY = "Tab";
const TAB_NAV_FORWARD = "forward";
const TAB_NAV_BACKWARD = "backward";
const Default$7 = {
  autofocus: true,
  trapElement: null
  // The element to trap focus inside of
};
const DefaultType$7 = {
  autofocus: "boolean",
  trapElement: "element"
};
class FocusTrap extends Config {
  constructor(config) {
    super();
    this._config = this._getConfig(config);
    this._isActive = false;
    this._lastTabNavDirection = null;
  }
  // Getters
  static get Default() {
    return Default$7;
  }
  static get DefaultType() {
    return DefaultType$7;
  }
  static get NAME() {
    return NAME$8;
  }
  // Public
  activate() {
    if (this._isActive) {
      return;
    }
    if (this._config.autofocus) {
      this._config.trapElement.focus();
    }
    EventHandler.off(document, EVENT_KEY$5);
    EventHandler.on(document, EVENT_FOCUSIN$2, (event) => this._handleFocusin(event));
    EventHandler.on(document, EVENT_KEYDOWN_TAB, (event) => this._handleKeydown(event));
    this._isActive = true;
  }
  deactivate() {
    if (!this._isActive) {
      return;
    }
    this._isActive = false;
    EventHandler.off(document, EVENT_KEY$5);
  }
  // Private
  _handleFocusin(event) {
    const {
      trapElement
    } = this._config;
    if (event.target === document || event.target === trapElement || trapElement.contains(event.target)) {
      return;
    }
    const elements = SelectorEngine.focusableChildren(trapElement);
    if (elements.length === 0) {
      trapElement.focus();
    } else if (this._lastTabNavDirection === TAB_NAV_BACKWARD) {
      elements[elements.length - 1].focus();
    } else {
      elements[0].focus();
    }
  }
  _handleKeydown(event) {
    if (event.key !== TAB_KEY) {
      return;
    }
    this._lastTabNavDirection = event.shiftKey ? TAB_NAV_BACKWARD : TAB_NAV_FORWARD;
  }
}
const SELECTOR_FIXED_CONTENT = ".fixed-top, .fixed-bottom, .is-fixed, .sticky-top";
const SELECTOR_STICKY_CONTENT = ".sticky-top";
const PROPERTY_PADDING = "padding-right";
const PROPERTY_MARGIN = "margin-right";
class ScrollBarHelper {
  constructor() {
    this._element = document.body;
  }
  // Public
  getWidth() {
    const documentWidth = document.documentElement.clientWidth;
    return Math.abs(window.innerWidth - documentWidth);
  }
  hide() {
    const width = this.getWidth();
    this._disableOverFlow();
    this._setElementAttributes(this._element, PROPERTY_PADDING, (calculatedValue) => calculatedValue + width);
    this._setElementAttributes(SELECTOR_FIXED_CONTENT, PROPERTY_PADDING, (calculatedValue) => calculatedValue + width);
    this._setElementAttributes(SELECTOR_STICKY_CONTENT, PROPERTY_MARGIN, (calculatedValue) => calculatedValue - width);
  }
  reset() {
    this._resetElementAttributes(this._element, "overflow");
    this._resetElementAttributes(this._element, PROPERTY_PADDING);
    this._resetElementAttributes(SELECTOR_FIXED_CONTENT, PROPERTY_PADDING);
    this._resetElementAttributes(SELECTOR_STICKY_CONTENT, PROPERTY_MARGIN);
  }
  isOverflowing() {
    return this.getWidth() > 0;
  }
  // Private
  _disableOverFlow() {
    this._saveInitialAttribute(this._element, "overflow");
    this._element.style.overflow = "hidden";
  }
  _setElementAttributes(selector, styleProperty, callback) {
    const scrollbarWidth = this.getWidth();
    const manipulationCallBack = (element) => {
      if (element !== this._element && window.innerWidth > element.clientWidth + scrollbarWidth) {
        return;
      }
      this._saveInitialAttribute(element, styleProperty);
      const calculatedValue = window.getComputedStyle(element).getPropertyValue(styleProperty);
      element.style.setProperty(styleProperty, `${callback(Number.parseFloat(calculatedValue))}px`);
    };
    this._applyManipulationCallback(selector, manipulationCallBack);
  }
  _saveInitialAttribute(element, styleProperty) {
    const actualValue = element.style.getPropertyValue(styleProperty);
    if (actualValue) {
      Manipulator.setDataAttribute(element, styleProperty, actualValue);
    }
  }
  _resetElementAttributes(selector, styleProperty) {
    const manipulationCallBack = (element) => {
      const value = Manipulator.getDataAttribute(element, styleProperty);
      if (value === null) {
        element.style.removeProperty(styleProperty);
        return;
      }
      Manipulator.removeDataAttribute(element, styleProperty);
      element.style.setProperty(styleProperty, value);
    };
    this._applyManipulationCallback(selector, manipulationCallBack);
  }
  _applyManipulationCallback(selector, callBack) {
    if (isElement(selector)) {
      callBack(selector);
      return;
    }
    for (const sel of SelectorEngine.find(selector, this._element)) {
      callBack(sel);
    }
  }
}
const NAME$7 = "modal";
const DATA_KEY$4 = "bs.modal";
const EVENT_KEY$4 = `.${DATA_KEY$4}`;
const DATA_API_KEY$2 = ".data-api";
const ESCAPE_KEY$1 = "Escape";
const EVENT_HIDE$4 = `hide${EVENT_KEY$4}`;
const EVENT_HIDE_PREVENTED$1 = `hidePrevented${EVENT_KEY$4}`;
const EVENT_HIDDEN$4 = `hidden${EVENT_KEY$4}`;
const EVENT_SHOW$4 = `show${EVENT_KEY$4}`;
const EVENT_SHOWN$4 = `shown${EVENT_KEY$4}`;
const EVENT_RESIZE$1 = `resize${EVENT_KEY$4}`;
const EVENT_CLICK_DISMISS = `click.dismiss${EVENT_KEY$4}`;
const EVENT_MOUSEDOWN_DISMISS = `mousedown.dismiss${EVENT_KEY$4}`;
const EVENT_KEYDOWN_DISMISS$1 = `keydown.dismiss${EVENT_KEY$4}`;
const EVENT_CLICK_DATA_API$2 = `click${EVENT_KEY$4}${DATA_API_KEY$2}`;
const CLASS_NAME_OPEN = "modal-open";
const CLASS_NAME_FADE$3 = "fade";
const CLASS_NAME_SHOW$4 = "show";
const CLASS_NAME_STATIC = "modal-static";
const OPEN_SELECTOR$1 = ".modal.show";
const SELECTOR_DIALOG = ".modal-dialog";
const SELECTOR_MODAL_BODY = ".modal-body";
const SELECTOR_DATA_TOGGLE$2 = '[data-bs-toggle="modal"]';
const Default$6 = {
  backdrop: true,
  focus: true,
  keyboard: true
};
const DefaultType$6 = {
  backdrop: "(boolean|string)",
  focus: "boolean",
  keyboard: "boolean"
};
class Modal extends BaseComponent {
  constructor(element, config) {
    super(element, config);
    this._dialog = SelectorEngine.findOne(SELECTOR_DIALOG, this._element);
    this._backdrop = this._initializeBackDrop();
    this._focustrap = this._initializeFocusTrap();
    this._isShown = false;
    this._isTransitioning = false;
    this._scrollBar = new ScrollBarHelper();
    this._addEventListeners();
  }
  // Getters
  static get Default() {
    return Default$6;
  }
  static get DefaultType() {
    return DefaultType$6;
  }
  static get NAME() {
    return NAME$7;
  }
  // Public
  toggle(relatedTarget) {
    return this._isShown ? this.hide() : this.show(relatedTarget);
  }
  show(relatedTarget) {
    if (this._isShown || this._isTransitioning) {
      return;
    }
    const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$4, {
      relatedTarget
    });
    if (showEvent.defaultPrevented) {
      return;
    }
    this._isShown = true;
    this._isTransitioning = true;
    this._scrollBar.hide();
    document.body.classList.add(CLASS_NAME_OPEN);
    this._adjustDialog();
    this._backdrop.show(() => this._showElement(relatedTarget));
  }
  hide() {
    if (!this._isShown || this._isTransitioning) {
      return;
    }
    const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$4);
    if (hideEvent.defaultPrevented) {
      return;
    }
    this._isShown = false;
    this._isTransitioning = true;
    this._focustrap.deactivate();
    this._element.classList.remove(CLASS_NAME_SHOW$4);
    this._queueCallback(() => this._hideModal(), this._element, this._isAnimated());
  }
  dispose() {
    EventHandler.off(window, EVENT_KEY$4);
    EventHandler.off(this._dialog, EVENT_KEY$4);
    this._backdrop.dispose();
    this._focustrap.deactivate();
    super.dispose();
  }
  handleUpdate() {
    this._adjustDialog();
  }
  // Private
  _initializeBackDrop() {
    return new Backdrop({
      isVisible: Boolean(this._config.backdrop),
      // 'static' option will be translated to true, and booleans will keep their value,
      isAnimated: this._isAnimated()
    });
  }
  _initializeFocusTrap() {
    return new FocusTrap({
      trapElement: this._element
    });
  }
  _showElement(relatedTarget) {
    if (!document.body.contains(this._element)) {
      document.body.append(this._element);
    }
    this._element.style.display = "block";
    this._element.removeAttribute("aria-hidden");
    this._element.setAttribute("aria-modal", true);
    this._element.setAttribute("role", "dialog");
    this._element.scrollTop = 0;
    const modalBody = SelectorEngine.findOne(SELECTOR_MODAL_BODY, this._dialog);
    if (modalBody) {
      modalBody.scrollTop = 0;
    }
    reflow(this._element);
    this._element.classList.add(CLASS_NAME_SHOW$4);
    const transitionComplete = () => {
      if (this._config.focus) {
        this._focustrap.activate();
      }
      this._isTransitioning = false;
      EventHandler.trigger(this._element, EVENT_SHOWN$4, {
        relatedTarget
      });
    };
    this._queueCallback(transitionComplete, this._dialog, this._isAnimated());
  }
  _addEventListeners() {
    EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS$1, (event) => {
      if (event.key !== ESCAPE_KEY$1) {
        return;
      }
      if (this._config.keyboard) {
        this.hide();
        return;
      }
      this._triggerBackdropTransition();
    });
    EventHandler.on(window, EVENT_RESIZE$1, () => {
      if (this._isShown && !this._isTransitioning) {
        this._adjustDialog();
      }
    });
    EventHandler.on(this._element, EVENT_MOUSEDOWN_DISMISS, (event) => {
      EventHandler.one(this._element, EVENT_CLICK_DISMISS, (event2) => {
        if (this._element !== event.target || this._element !== event2.target) {
          return;
        }
        if (this._config.backdrop === "static") {
          this._triggerBackdropTransition();
          return;
        }
        if (this._config.backdrop) {
          this.hide();
        }
      });
    });
  }
  _hideModal() {
    this._element.style.display = "none";
    this._element.setAttribute("aria-hidden", true);
    this._element.removeAttribute("aria-modal");
    this._element.removeAttribute("role");
    this._isTransitioning = false;
    this._backdrop.hide(() => {
      document.body.classList.remove(CLASS_NAME_OPEN);
      this._resetAdjustments();
      this._scrollBar.reset();
      EventHandler.trigger(this._element, EVENT_HIDDEN$4);
    });
  }
  _isAnimated() {
    return this._element.classList.contains(CLASS_NAME_FADE$3);
  }
  _triggerBackdropTransition() {
    const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED$1);
    if (hideEvent.defaultPrevented) {
      return;
    }
    const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
    const initialOverflowY = this._element.style.overflowY;
    if (initialOverflowY === "hidden" || this._element.classList.contains(CLASS_NAME_STATIC)) {
      return;
    }
    if (!isModalOverflowing) {
      this._element.style.overflowY = "hidden";
    }
    this._element.classList.add(CLASS_NAME_STATIC);
    this._queueCallback(() => {
      this._element.classList.remove(CLASS_NAME_STATIC);
      this._queueCallback(() => {
        this._element.style.overflowY = initialOverflowY;
      }, this._dialog);
    }, this._dialog);
    this._element.focus();
  }
  /**
   * The following methods are used to handle overflowing modals
   */
  _adjustDialog() {
    const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
    const scrollbarWidth = this._scrollBar.getWidth();
    const isBodyOverflowing = scrollbarWidth > 0;
    if (isBodyOverflowing && !isModalOverflowing) {
      const property = isRTL() ? "paddingLeft" : "paddingRight";
      this._element.style[property] = `${scrollbarWidth}px`;
    }
    if (!isBodyOverflowing && isModalOverflowing) {
      const property = isRTL() ? "paddingRight" : "paddingLeft";
      this._element.style[property] = `${scrollbarWidth}px`;
    }
  }
  _resetAdjustments() {
    this._element.style.paddingLeft = "";
    this._element.style.paddingRight = "";
  }
  // Static
  static jQueryInterface(config, relatedTarget) {
    return this.each(function() {
      const data = Modal.getOrCreateInstance(this, config);
      if (typeof config !== "string") {
        return;
      }
      if (typeof data[config] === "undefined") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config](relatedTarget);
    });
  }
}
EventHandler.on(document, EVENT_CLICK_DATA_API$2, SELECTOR_DATA_TOGGLE$2, function(event) {
  const target = SelectorEngine.getElementFromSelector(this);
  if (["A", "AREA"].includes(this.tagName)) {
    event.preventDefault();
  }
  EventHandler.one(target, EVENT_SHOW$4, (showEvent) => {
    if (showEvent.defaultPrevented) {
      return;
    }
    EventHandler.one(target, EVENT_HIDDEN$4, () => {
      if (isVisible(this)) {
        this.focus();
      }
    });
  });
  const alreadyOpen = SelectorEngine.findOne(OPEN_SELECTOR$1);
  if (alreadyOpen) {
    Modal.getInstance(alreadyOpen).hide();
  }
  const data = Modal.getOrCreateInstance(target);
  data.toggle(this);
});
enableDismissTrigger(Modal);
defineJQueryPlugin(Modal);
const NAME$6 = "offcanvas";
const DATA_KEY$3 = "bs.offcanvas";
const EVENT_KEY$3 = `.${DATA_KEY$3}`;
const DATA_API_KEY$1 = ".data-api";
const EVENT_LOAD_DATA_API$2 = `load${EVENT_KEY$3}${DATA_API_KEY$1}`;
const ESCAPE_KEY = "Escape";
const CLASS_NAME_SHOW$3 = "show";
const CLASS_NAME_SHOWING$1 = "showing";
const CLASS_NAME_HIDING = "hiding";
const CLASS_NAME_BACKDROP = "offcanvas-backdrop";
const OPEN_SELECTOR = ".offcanvas.show";
const EVENT_SHOW$3 = `show${EVENT_KEY$3}`;
const EVENT_SHOWN$3 = `shown${EVENT_KEY$3}`;
const EVENT_HIDE$3 = `hide${EVENT_KEY$3}`;
const EVENT_HIDE_PREVENTED = `hidePrevented${EVENT_KEY$3}`;
const EVENT_HIDDEN$3 = `hidden${EVENT_KEY$3}`;
const EVENT_RESIZE = `resize${EVENT_KEY$3}`;
const EVENT_CLICK_DATA_API$1 = `click${EVENT_KEY$3}${DATA_API_KEY$1}`;
const EVENT_KEYDOWN_DISMISS = `keydown.dismiss${EVENT_KEY$3}`;
const SELECTOR_DATA_TOGGLE$1 = '[data-bs-toggle="offcanvas"]';
const Default$5 = {
  backdrop: true,
  keyboard: true,
  scroll: false
};
const DefaultType$5 = {
  backdrop: "(boolean|string)",
  keyboard: "boolean",
  scroll: "boolean"
};
class Offcanvas extends BaseComponent {
  constructor(element, config) {
    super(element, config);
    this._isShown = false;
    this._backdrop = this._initializeBackDrop();
    this._focustrap = this._initializeFocusTrap();
    this._addEventListeners();
  }
  // Getters
  static get Default() {
    return Default$5;
  }
  static get DefaultType() {
    return DefaultType$5;
  }
  static get NAME() {
    return NAME$6;
  }
  // Public
  toggle(relatedTarget) {
    return this._isShown ? this.hide() : this.show(relatedTarget);
  }
  show(relatedTarget) {
    if (this._isShown) {
      return;
    }
    const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$3, {
      relatedTarget
    });
    if (showEvent.defaultPrevented) {
      return;
    }
    this._isShown = true;
    this._backdrop.show();
    if (!this._config.scroll) {
      new ScrollBarHelper().hide();
    }
    this._element.setAttribute("aria-modal", true);
    this._element.setAttribute("role", "dialog");
    this._element.classList.add(CLASS_NAME_SHOWING$1);
    const completeCallBack = () => {
      if (!this._config.scroll || this._config.backdrop) {
        this._focustrap.activate();
      }
      this._element.classList.add(CLASS_NAME_SHOW$3);
      this._element.classList.remove(CLASS_NAME_SHOWING$1);
      EventHandler.trigger(this._element, EVENT_SHOWN$3, {
        relatedTarget
      });
    };
    this._queueCallback(completeCallBack, this._element, true);
  }
  hide() {
    if (!this._isShown) {
      return;
    }
    const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$3);
    if (hideEvent.defaultPrevented) {
      return;
    }
    this._focustrap.deactivate();
    this._element.blur();
    this._isShown = false;
    this._element.classList.add(CLASS_NAME_HIDING);
    this._backdrop.hide();
    const completeCallback = () => {
      this._element.classList.remove(CLASS_NAME_SHOW$3, CLASS_NAME_HIDING);
      this._element.removeAttribute("aria-modal");
      this._element.removeAttribute("role");
      if (!this._config.scroll) {
        new ScrollBarHelper().reset();
      }
      EventHandler.trigger(this._element, EVENT_HIDDEN$3);
    };
    this._queueCallback(completeCallback, this._element, true);
  }
  dispose() {
    this._backdrop.dispose();
    this._focustrap.deactivate();
    super.dispose();
  }
  // Private
  _initializeBackDrop() {
    const clickCallback = () => {
      if (this._config.backdrop === "static") {
        EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED);
        return;
      }
      this.hide();
    };
    const isVisible2 = Boolean(this._config.backdrop);
    return new Backdrop({
      className: CLASS_NAME_BACKDROP,
      isVisible: isVisible2,
      isAnimated: true,
      rootElement: this._element.parentNode,
      clickCallback: isVisible2 ? clickCallback : null
    });
  }
  _initializeFocusTrap() {
    return new FocusTrap({
      trapElement: this._element
    });
  }
  _addEventListeners() {
    EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS, (event) => {
      if (event.key !== ESCAPE_KEY) {
        return;
      }
      if (this._config.keyboard) {
        this.hide();
        return;
      }
      EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED);
    });
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = Offcanvas.getOrCreateInstance(this, config);
      if (typeof config !== "string") {
        return;
      }
      if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config](this);
    });
  }
}
EventHandler.on(document, EVENT_CLICK_DATA_API$1, SELECTOR_DATA_TOGGLE$1, function(event) {
  const target = SelectorEngine.getElementFromSelector(this);
  if (["A", "AREA"].includes(this.tagName)) {
    event.preventDefault();
  }
  if (isDisabled(this)) {
    return;
  }
  EventHandler.one(target, EVENT_HIDDEN$3, () => {
    if (isVisible(this)) {
      this.focus();
    }
  });
  const alreadyOpen = SelectorEngine.findOne(OPEN_SELECTOR);
  if (alreadyOpen && alreadyOpen !== target) {
    Offcanvas.getInstance(alreadyOpen).hide();
  }
  const data = Offcanvas.getOrCreateInstance(target);
  data.toggle(this);
});
EventHandler.on(window, EVENT_LOAD_DATA_API$2, () => {
  for (const selector of SelectorEngine.find(OPEN_SELECTOR)) {
    Offcanvas.getOrCreateInstance(selector).show();
  }
});
EventHandler.on(window, EVENT_RESIZE, () => {
  for (const element of SelectorEngine.find("[aria-modal][class*=show][class*=offcanvas-]")) {
    if (getComputedStyle(element).position !== "fixed") {
      Offcanvas.getOrCreateInstance(element).hide();
    }
  }
});
enableDismissTrigger(Offcanvas);
defineJQueryPlugin(Offcanvas);
const ARIA_ATTRIBUTE_PATTERN = /^aria-[\w-]*$/i;
const DefaultAllowlist = {
  // Global attributes allowed on any supplied element below.
  "*": ["class", "dir", "id", "lang", "role", ARIA_ATTRIBUTE_PATTERN],
  a: ["target", "href", "title", "rel"],
  area: [],
  b: [],
  br: [],
  col: [],
  code: [],
  dd: [],
  div: [],
  dl: [],
  dt: [],
  em: [],
  hr: [],
  h1: [],
  h2: [],
  h3: [],
  h4: [],
  h5: [],
  h6: [],
  i: [],
  img: ["src", "srcset", "alt", "title", "width", "height"],
  li: [],
  ol: [],
  p: [],
  pre: [],
  s: [],
  small: [],
  span: [],
  sub: [],
  sup: [],
  strong: [],
  u: [],
  ul: []
};
const uriAttributes = /* @__PURE__ */ new Set(["background", "cite", "href", "itemtype", "longdesc", "poster", "src", "xlink:href"]);
const SAFE_URL_PATTERN = /^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:/?#]*(?:[/?#]|$))/i;
const allowedAttribute = (attribute, allowedAttributeList) => {
  const attributeName = attribute.nodeName.toLowerCase();
  if (allowedAttributeList.includes(attributeName)) {
    if (uriAttributes.has(attributeName)) {
      return Boolean(SAFE_URL_PATTERN.test(attribute.nodeValue));
    }
    return true;
  }
  return allowedAttributeList.filter((attributeRegex) => attributeRegex instanceof RegExp).some((regex) => regex.test(attributeName));
};
function sanitizeHtml(unsafeHtml, allowList, sanitizeFunction) {
  if (!unsafeHtml.length) {
    return unsafeHtml;
  }
  if (sanitizeFunction && typeof sanitizeFunction === "function") {
    return sanitizeFunction(unsafeHtml);
  }
  const domParser = new window.DOMParser();
  const createdDocument = domParser.parseFromString(unsafeHtml, "text/html");
  const elements = [].concat(...createdDocument.body.querySelectorAll("*"));
  for (const element of elements) {
    const elementName = element.nodeName.toLowerCase();
    if (!Object.keys(allowList).includes(elementName)) {
      element.remove();
      continue;
    }
    const attributeList = [].concat(...element.attributes);
    const allowedAttributes = [].concat(allowList["*"] || [], allowList[elementName] || []);
    for (const attribute of attributeList) {
      if (!allowedAttribute(attribute, allowedAttributes)) {
        element.removeAttribute(attribute.nodeName);
      }
    }
  }
  return createdDocument.body.innerHTML;
}
const NAME$5 = "TemplateFactory";
const Default$4 = {
  allowList: DefaultAllowlist,
  content: {},
  // { selector : text ,  selector2 : text2 , }
  extraClass: "",
  html: false,
  sanitize: true,
  sanitizeFn: null,
  template: "<div></div>"
};
const DefaultType$4 = {
  allowList: "object",
  content: "object",
  extraClass: "(string|function)",
  html: "boolean",
  sanitize: "boolean",
  sanitizeFn: "(null|function)",
  template: "string"
};
const DefaultContentType = {
  entry: "(string|element|function|null)",
  selector: "(string|element)"
};
class TemplateFactory extends Config {
  constructor(config) {
    super();
    this._config = this._getConfig(config);
  }
  // Getters
  static get Default() {
    return Default$4;
  }
  static get DefaultType() {
    return DefaultType$4;
  }
  static get NAME() {
    return NAME$5;
  }
  // Public
  getContent() {
    return Object.values(this._config.content).map((config) => this._resolvePossibleFunction(config)).filter(Boolean);
  }
  hasContent() {
    return this.getContent().length > 0;
  }
  changeContent(content) {
    this._checkContent(content);
    this._config.content = {
      ...this._config.content,
      ...content
    };
    return this;
  }
  toHtml() {
    const templateWrapper = document.createElement("div");
    templateWrapper.innerHTML = this._maybeSanitize(this._config.template);
    for (const [selector, text] of Object.entries(this._config.content)) {
      this._setContent(templateWrapper, text, selector);
    }
    const template = templateWrapper.children[0];
    const extraClass = this._resolvePossibleFunction(this._config.extraClass);
    if (extraClass) {
      template.classList.add(...extraClass.split(" "));
    }
    return template;
  }
  // Private
  _typeCheckConfig(config) {
    super._typeCheckConfig(config);
    this._checkContent(config.content);
  }
  _checkContent(arg) {
    for (const [selector, content] of Object.entries(arg)) {
      super._typeCheckConfig({
        selector,
        entry: content
      }, DefaultContentType);
    }
  }
  _setContent(template, content, selector) {
    const templateElement = SelectorEngine.findOne(selector, template);
    if (!templateElement) {
      return;
    }
    content = this._resolvePossibleFunction(content);
    if (!content) {
      templateElement.remove();
      return;
    }
    if (isElement(content)) {
      this._putElementInTemplate(getElement(content), templateElement);
      return;
    }
    if (this._config.html) {
      templateElement.innerHTML = this._maybeSanitize(content);
      return;
    }
    templateElement.textContent = content;
  }
  _maybeSanitize(arg) {
    return this._config.sanitize ? sanitizeHtml(arg, this._config.allowList, this._config.sanitizeFn) : arg;
  }
  _resolvePossibleFunction(arg) {
    return execute(arg, [void 0, this]);
  }
  _putElementInTemplate(element, templateElement) {
    if (this._config.html) {
      templateElement.innerHTML = "";
      templateElement.append(element);
      return;
    }
    templateElement.textContent = element.textContent;
  }
}
const NAME$4 = "tooltip";
const DISALLOWED_ATTRIBUTES = /* @__PURE__ */ new Set(["sanitize", "allowList", "sanitizeFn"]);
const CLASS_NAME_FADE$2 = "fade";
const CLASS_NAME_MODAL = "modal";
const CLASS_NAME_SHOW$2 = "show";
const SELECTOR_TOOLTIP_INNER = ".tooltip-inner";
const SELECTOR_MODAL = `.${CLASS_NAME_MODAL}`;
const EVENT_MODAL_HIDE = "hide.bs.modal";
const TRIGGER_HOVER = "hover";
const TRIGGER_FOCUS = "focus";
const TRIGGER_CLICK = "click";
const TRIGGER_MANUAL = "manual";
const EVENT_HIDE$2 = "hide";
const EVENT_HIDDEN$2 = "hidden";
const EVENT_SHOW$2 = "show";
const EVENT_SHOWN$2 = "shown";
const EVENT_INSERTED = "inserted";
const EVENT_CLICK$1 = "click";
const EVENT_FOCUSIN$1 = "focusin";
const EVENT_FOCUSOUT$1 = "focusout";
const EVENT_MOUSEENTER = "mouseenter";
const EVENT_MOUSELEAVE = "mouseleave";
const AttachmentMap = {
  AUTO: "auto",
  TOP: "top",
  RIGHT: isRTL() ? "left" : "right",
  BOTTOM: "bottom",
  LEFT: isRTL() ? "right" : "left"
};
const Default$3 = {
  allowList: DefaultAllowlist,
  animation: true,
  boundary: "clippingParents",
  container: false,
  customClass: "",
  delay: 0,
  fallbackPlacements: ["top", "right", "bottom", "left"],
  html: false,
  offset: [0, 6],
  placement: "top",
  popperConfig: null,
  sanitize: true,
  sanitizeFn: null,
  selector: false,
  template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
  title: "",
  trigger: "hover focus"
};
const DefaultType$3 = {
  allowList: "object",
  animation: "boolean",
  boundary: "(string|element)",
  container: "(string|element|boolean)",
  customClass: "(string|function)",
  delay: "(number|object)",
  fallbackPlacements: "array",
  html: "boolean",
  offset: "(array|string|function)",
  placement: "(string|function)",
  popperConfig: "(null|object|function)",
  sanitize: "boolean",
  sanitizeFn: "(null|function)",
  selector: "(string|boolean)",
  template: "string",
  title: "(string|element|function)",
  trigger: "string"
};
class Tooltip extends BaseComponent {
  constructor(element, config) {
    if (typeof Popper === "undefined") {
      throw new TypeError("Bootstrap's tooltips require Popper (https://popper.js.org/docs/v2/)");
    }
    super(element, config);
    this._isEnabled = true;
    this._timeout = 0;
    this._isHovered = null;
    this._activeTrigger = {};
    this._popper = null;
    this._templateFactory = null;
    this._newContent = null;
    this.tip = null;
    this._setListeners();
    if (!this._config.selector) {
      this._fixTitle();
    }
  }
  // Getters
  static get Default() {
    return Default$3;
  }
  static get DefaultType() {
    return DefaultType$3;
  }
  static get NAME() {
    return NAME$4;
  }
  // Public
  enable() {
    this._isEnabled = true;
  }
  disable() {
    this._isEnabled = false;
  }
  toggleEnabled() {
    this._isEnabled = !this._isEnabled;
  }
  toggle() {
    if (!this._isEnabled) {
      return;
    }
    if (this._isShown()) {
      this._leave();
      return;
    }
    this._enter();
  }
  dispose() {
    clearTimeout(this._timeout);
    EventHandler.off(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);
    if (this._element.getAttribute("data-bs-original-title")) {
      this._element.setAttribute("title", this._element.getAttribute("data-bs-original-title"));
    }
    this._disposePopper();
    super.dispose();
  }
  show() {
    if (this._element.style.display === "none") {
      throw new Error("Please use show on visible elements");
    }
    if (!(this._isWithContent() && this._isEnabled)) {
      return;
    }
    const showEvent = EventHandler.trigger(this._element, this.constructor.eventName(EVENT_SHOW$2));
    const shadowRoot = findShadowRoot(this._element);
    const isInTheDom = (shadowRoot || this._element.ownerDocument.documentElement).contains(this._element);
    if (showEvent.defaultPrevented || !isInTheDom) {
      return;
    }
    this._disposePopper();
    const tip = this._getTipElement();
    this._element.setAttribute("aria-describedby", tip.getAttribute("id"));
    const {
      container
    } = this._config;
    if (!this._element.ownerDocument.documentElement.contains(this.tip)) {
      container.append(tip);
      EventHandler.trigger(this._element, this.constructor.eventName(EVENT_INSERTED));
    }
    this._popper = this._createPopper(tip);
    tip.classList.add(CLASS_NAME_SHOW$2);
    if ("ontouchstart" in document.documentElement) {
      for (const element of [].concat(...document.body.children)) {
        EventHandler.on(element, "mouseover", noop);
      }
    }
    const complete = () => {
      EventHandler.trigger(this._element, this.constructor.eventName(EVENT_SHOWN$2));
      if (this._isHovered === false) {
        this._leave();
      }
      this._isHovered = false;
    };
    this._queueCallback(complete, this.tip, this._isAnimated());
  }
  hide() {
    if (!this._isShown()) {
      return;
    }
    const hideEvent = EventHandler.trigger(this._element, this.constructor.eventName(EVENT_HIDE$2));
    if (hideEvent.defaultPrevented) {
      return;
    }
    const tip = this._getTipElement();
    tip.classList.remove(CLASS_NAME_SHOW$2);
    if ("ontouchstart" in document.documentElement) {
      for (const element of [].concat(...document.body.children)) {
        EventHandler.off(element, "mouseover", noop);
      }
    }
    this._activeTrigger[TRIGGER_CLICK] = false;
    this._activeTrigger[TRIGGER_FOCUS] = false;
    this._activeTrigger[TRIGGER_HOVER] = false;
    this._isHovered = null;
    const complete = () => {
      if (this._isWithActiveTrigger()) {
        return;
      }
      if (!this._isHovered) {
        this._disposePopper();
      }
      this._element.removeAttribute("aria-describedby");
      EventHandler.trigger(this._element, this.constructor.eventName(EVENT_HIDDEN$2));
    };
    this._queueCallback(complete, this.tip, this._isAnimated());
  }
  update() {
    if (this._popper) {
      this._popper.update();
    }
  }
  // Protected
  _isWithContent() {
    return Boolean(this._getTitle());
  }
  _getTipElement() {
    if (!this.tip) {
      this.tip = this._createTipElement(this._newContent || this._getContentForTemplate());
    }
    return this.tip;
  }
  _createTipElement(content) {
    const tip = this._getTemplateFactory(content).toHtml();
    if (!tip) {
      return null;
    }
    tip.classList.remove(CLASS_NAME_FADE$2, CLASS_NAME_SHOW$2);
    tip.classList.add(`bs-${this.constructor.NAME}-auto`);
    const tipId = getUID(this.constructor.NAME).toString();
    tip.setAttribute("id", tipId);
    if (this._isAnimated()) {
      tip.classList.add(CLASS_NAME_FADE$2);
    }
    return tip;
  }
  setContent(content) {
    this._newContent = content;
    if (this._isShown()) {
      this._disposePopper();
      this.show();
    }
  }
  _getTemplateFactory(content) {
    if (this._templateFactory) {
      this._templateFactory.changeContent(content);
    } else {
      this._templateFactory = new TemplateFactory({
        ...this._config,
        // the `content` var has to be after `this._config`
        // to override config.content in case of popover
        content,
        extraClass: this._resolvePossibleFunction(this._config.customClass)
      });
    }
    return this._templateFactory;
  }
  _getContentForTemplate() {
    return {
      [SELECTOR_TOOLTIP_INNER]: this._getTitle()
    };
  }
  _getTitle() {
    return this._resolvePossibleFunction(this._config.title) || this._element.getAttribute("data-bs-original-title");
  }
  // Private
  _initializeOnDelegatedTarget(event) {
    return this.constructor.getOrCreateInstance(event.delegateTarget, this._getDelegateConfig());
  }
  _isAnimated() {
    return this._config.animation || this.tip && this.tip.classList.contains(CLASS_NAME_FADE$2);
  }
  _isShown() {
    return this.tip && this.tip.classList.contains(CLASS_NAME_SHOW$2);
  }
  _createPopper(tip) {
    const placement = execute(this._config.placement, [this, tip, this._element]);
    const attachment = AttachmentMap[placement.toUpperCase()];
    return createPopper(this._element, tip, this._getPopperConfig(attachment));
  }
  _getOffset() {
    const {
      offset: offset2
    } = this._config;
    if (typeof offset2 === "string") {
      return offset2.split(",").map((value) => Number.parseInt(value, 10));
    }
    if (typeof offset2 === "function") {
      return (popperData) => offset2(popperData, this._element);
    }
    return offset2;
  }
  _resolvePossibleFunction(arg) {
    return execute(arg, [this._element, this._element]);
  }
  _getPopperConfig(attachment) {
    const defaultBsPopperConfig = {
      placement: attachment,
      modifiers: [{
        name: "flip",
        options: {
          fallbackPlacements: this._config.fallbackPlacements
        }
      }, {
        name: "offset",
        options: {
          offset: this._getOffset()
        }
      }, {
        name: "preventOverflow",
        options: {
          boundary: this._config.boundary
        }
      }, {
        name: "arrow",
        options: {
          element: `.${this.constructor.NAME}-arrow`
        }
      }, {
        name: "preSetPlacement",
        enabled: true,
        phase: "beforeMain",
        fn: (data) => {
          this._getTipElement().setAttribute("data-popper-placement", data.state.placement);
        }
      }]
    };
    return {
      ...defaultBsPopperConfig,
      ...execute(this._config.popperConfig, [void 0, defaultBsPopperConfig])
    };
  }
  _setListeners() {
    const triggers = this._config.trigger.split(" ");
    for (const trigger of triggers) {
      if (trigger === "click") {
        EventHandler.on(this._element, this.constructor.eventName(EVENT_CLICK$1), this._config.selector, (event) => {
          const context = this._initializeOnDelegatedTarget(event);
          context._activeTrigger[TRIGGER_CLICK] = !(context._isShown() && context._activeTrigger[TRIGGER_CLICK]);
          context.toggle();
        });
      } else if (trigger !== TRIGGER_MANUAL) {
        const eventIn = trigger === TRIGGER_HOVER ? this.constructor.eventName(EVENT_MOUSEENTER) : this.constructor.eventName(EVENT_FOCUSIN$1);
        const eventOut = trigger === TRIGGER_HOVER ? this.constructor.eventName(EVENT_MOUSELEAVE) : this.constructor.eventName(EVENT_FOCUSOUT$1);
        EventHandler.on(this._element, eventIn, this._config.selector, (event) => {
          const context = this._initializeOnDelegatedTarget(event);
          context._activeTrigger[event.type === "focusin" ? TRIGGER_FOCUS : TRIGGER_HOVER] = true;
          context._enter();
        });
        EventHandler.on(this._element, eventOut, this._config.selector, (event) => {
          const context = this._initializeOnDelegatedTarget(event);
          context._activeTrigger[event.type === "focusout" ? TRIGGER_FOCUS : TRIGGER_HOVER] = context._element.contains(event.relatedTarget);
          context._leave();
        });
      }
    }
    this._hideModalHandler = () => {
      if (this._element) {
        this.hide();
      }
    };
    EventHandler.on(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);
  }
  _fixTitle() {
    const title = this._element.getAttribute("title");
    if (!title) {
      return;
    }
    if (!this._element.getAttribute("aria-label") && !this._element.textContent.trim()) {
      this._element.setAttribute("aria-label", title);
    }
    this._element.setAttribute("data-bs-original-title", title);
    this._element.removeAttribute("title");
  }
  _enter() {
    if (this._isShown() || this._isHovered) {
      this._isHovered = true;
      return;
    }
    this._isHovered = true;
    this._setTimeout(() => {
      if (this._isHovered) {
        this.show();
      }
    }, this._config.delay.show);
  }
  _leave() {
    if (this._isWithActiveTrigger()) {
      return;
    }
    this._isHovered = false;
    this._setTimeout(() => {
      if (!this._isHovered) {
        this.hide();
      }
    }, this._config.delay.hide);
  }
  _setTimeout(handler, timeout) {
    clearTimeout(this._timeout);
    this._timeout = setTimeout(handler, timeout);
  }
  _isWithActiveTrigger() {
    return Object.values(this._activeTrigger).includes(true);
  }
  _getConfig(config) {
    const dataAttributes = Manipulator.getDataAttributes(this._element);
    for (const dataAttribute of Object.keys(dataAttributes)) {
      if (DISALLOWED_ATTRIBUTES.has(dataAttribute)) {
        delete dataAttributes[dataAttribute];
      }
    }
    config = {
      ...dataAttributes,
      ...typeof config === "object" && config ? config : {}
    };
    config = this._mergeConfigObj(config);
    config = this._configAfterMerge(config);
    this._typeCheckConfig(config);
    return config;
  }
  _configAfterMerge(config) {
    config.container = config.container === false ? document.body : getElement(config.container);
    if (typeof config.delay === "number") {
      config.delay = {
        show: config.delay,
        hide: config.delay
      };
    }
    if (typeof config.title === "number") {
      config.title = config.title.toString();
    }
    if (typeof config.content === "number") {
      config.content = config.content.toString();
    }
    return config;
  }
  _getDelegateConfig() {
    const config = {};
    for (const [key, value] of Object.entries(this._config)) {
      if (this.constructor.Default[key] !== value) {
        config[key] = value;
      }
    }
    config.selector = false;
    config.trigger = "manual";
    return config;
  }
  _disposePopper() {
    if (this._popper) {
      this._popper.destroy();
      this._popper = null;
    }
    if (this.tip) {
      this.tip.remove();
      this.tip = null;
    }
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = Tooltip.getOrCreateInstance(this, config);
      if (typeof config !== "string") {
        return;
      }
      if (typeof data[config] === "undefined") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config]();
    });
  }
}
defineJQueryPlugin(Tooltip);
const NAME$3 = "popover";
const SELECTOR_TITLE = ".popover-header";
const SELECTOR_CONTENT = ".popover-body";
const Default$2 = {
  ...Tooltip.Default,
  content: "",
  offset: [0, 8],
  placement: "right",
  template: '<div class="popover" role="tooltip"><div class="popover-arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
  trigger: "click"
};
const DefaultType$2 = {
  ...Tooltip.DefaultType,
  content: "(null|string|element|function)"
};
class Popover extends Tooltip {
  // Getters
  static get Default() {
    return Default$2;
  }
  static get DefaultType() {
    return DefaultType$2;
  }
  static get NAME() {
    return NAME$3;
  }
  // Overrides
  _isWithContent() {
    return this._getTitle() || this._getContent();
  }
  // Private
  _getContentForTemplate() {
    return {
      [SELECTOR_TITLE]: this._getTitle(),
      [SELECTOR_CONTENT]: this._getContent()
    };
  }
  _getContent() {
    return this._resolvePossibleFunction(this._config.content);
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = Popover.getOrCreateInstance(this, config);
      if (typeof config !== "string") {
        return;
      }
      if (typeof data[config] === "undefined") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config]();
    });
  }
}
defineJQueryPlugin(Popover);
const NAME$2 = "scrollspy";
const DATA_KEY$2 = "bs.scrollspy";
const EVENT_KEY$2 = `.${DATA_KEY$2}`;
const DATA_API_KEY = ".data-api";
const EVENT_ACTIVATE = `activate${EVENT_KEY$2}`;
const EVENT_CLICK = `click${EVENT_KEY$2}`;
const EVENT_LOAD_DATA_API$1 = `load${EVENT_KEY$2}${DATA_API_KEY}`;
const CLASS_NAME_DROPDOWN_ITEM = "dropdown-item";
const CLASS_NAME_ACTIVE$1 = "active";
const SELECTOR_DATA_SPY = '[data-bs-spy="scroll"]';
const SELECTOR_TARGET_LINKS = "[href]";
const SELECTOR_NAV_LIST_GROUP = ".nav, .list-group";
const SELECTOR_NAV_LINKS = ".nav-link";
const SELECTOR_NAV_ITEMS = ".nav-item";
const SELECTOR_LIST_ITEMS = ".list-group-item";
const SELECTOR_LINK_ITEMS = `${SELECTOR_NAV_LINKS}, ${SELECTOR_NAV_ITEMS} > ${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}`;
const SELECTOR_DROPDOWN = ".dropdown";
const SELECTOR_DROPDOWN_TOGGLE$1 = ".dropdown-toggle";
const Default$1 = {
  offset: null,
  // TODO: v6 @deprecated, keep it for backwards compatibility reasons
  rootMargin: "0px 0px -25%",
  smoothScroll: false,
  target: null,
  threshold: [0.1, 0.5, 1]
};
const DefaultType$1 = {
  offset: "(number|null)",
  // TODO v6 @deprecated, keep it for backwards compatibility reasons
  rootMargin: "string",
  smoothScroll: "boolean",
  target: "element",
  threshold: "array"
};
class ScrollSpy extends BaseComponent {
  constructor(element, config) {
    super(element, config);
    this._targetLinks = /* @__PURE__ */ new Map();
    this._observableSections = /* @__PURE__ */ new Map();
    this._rootElement = getComputedStyle(this._element).overflowY === "visible" ? null : this._element;
    this._activeTarget = null;
    this._observer = null;
    this._previousScrollData = {
      visibleEntryTop: 0,
      parentScrollTop: 0
    };
    this.refresh();
  }
  // Getters
  static get Default() {
    return Default$1;
  }
  static get DefaultType() {
    return DefaultType$1;
  }
  static get NAME() {
    return NAME$2;
  }
  // Public
  refresh() {
    this._initializeTargetsAndObservables();
    this._maybeEnableSmoothScroll();
    if (this._observer) {
      this._observer.disconnect();
    } else {
      this._observer = this._getNewObserver();
    }
    for (const section of this._observableSections.values()) {
      this._observer.observe(section);
    }
  }
  dispose() {
    this._observer.disconnect();
    super.dispose();
  }
  // Private
  _configAfterMerge(config) {
    config.target = getElement(config.target) || document.body;
    config.rootMargin = config.offset ? `${config.offset}px 0px -30%` : config.rootMargin;
    if (typeof config.threshold === "string") {
      config.threshold = config.threshold.split(",").map((value) => Number.parseFloat(value));
    }
    return config;
  }
  _maybeEnableSmoothScroll() {
    if (!this._config.smoothScroll) {
      return;
    }
    EventHandler.off(this._config.target, EVENT_CLICK);
    EventHandler.on(this._config.target, EVENT_CLICK, SELECTOR_TARGET_LINKS, (event) => {
      const observableSection = this._observableSections.get(event.target.hash);
      if (observableSection) {
        event.preventDefault();
        const root = this._rootElement || window;
        const height = observableSection.offsetTop - this._element.offsetTop;
        if (root.scrollTo) {
          root.scrollTo({
            top: height,
            behavior: "smooth"
          });
          return;
        }
        root.scrollTop = height;
      }
    });
  }
  _getNewObserver() {
    const options = {
      root: this._rootElement,
      threshold: this._config.threshold,
      rootMargin: this._config.rootMargin
    };
    return new IntersectionObserver((entries) => this._observerCallback(entries), options);
  }
  // The logic of selection
  _observerCallback(entries) {
    const targetElement = (entry) => this._targetLinks.get(`#${entry.target.id}`);
    const activate = (entry) => {
      this._previousScrollData.visibleEntryTop = entry.target.offsetTop;
      this._process(targetElement(entry));
    };
    const parentScrollTop = (this._rootElement || document.documentElement).scrollTop;
    const userScrollsDown = parentScrollTop >= this._previousScrollData.parentScrollTop;
    this._previousScrollData.parentScrollTop = parentScrollTop;
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        this._activeTarget = null;
        this._clearActiveClass(targetElement(entry));
        continue;
      }
      const entryIsLowerThanPrevious = entry.target.offsetTop >= this._previousScrollData.visibleEntryTop;
      if (userScrollsDown && entryIsLowerThanPrevious) {
        activate(entry);
        if (!parentScrollTop) {
          return;
        }
        continue;
      }
      if (!userScrollsDown && !entryIsLowerThanPrevious) {
        activate(entry);
      }
    }
  }
  _initializeTargetsAndObservables() {
    this._targetLinks = /* @__PURE__ */ new Map();
    this._observableSections = /* @__PURE__ */ new Map();
    const targetLinks = SelectorEngine.find(SELECTOR_TARGET_LINKS, this._config.target);
    for (const anchor of targetLinks) {
      if (!anchor.hash || isDisabled(anchor)) {
        continue;
      }
      const observableSection = SelectorEngine.findOne(decodeURI(anchor.hash), this._element);
      if (isVisible(observableSection)) {
        this._targetLinks.set(decodeURI(anchor.hash), anchor);
        this._observableSections.set(anchor.hash, observableSection);
      }
    }
  }
  _process(target) {
    if (this._activeTarget === target) {
      return;
    }
    this._clearActiveClass(this._config.target);
    this._activeTarget = target;
    target.classList.add(CLASS_NAME_ACTIVE$1);
    this._activateParents(target);
    EventHandler.trigger(this._element, EVENT_ACTIVATE, {
      relatedTarget: target
    });
  }
  _activateParents(target) {
    if (target.classList.contains(CLASS_NAME_DROPDOWN_ITEM)) {
      SelectorEngine.findOne(SELECTOR_DROPDOWN_TOGGLE$1, target.closest(SELECTOR_DROPDOWN)).classList.add(CLASS_NAME_ACTIVE$1);
      return;
    }
    for (const listGroup of SelectorEngine.parents(target, SELECTOR_NAV_LIST_GROUP)) {
      for (const item of SelectorEngine.prev(listGroup, SELECTOR_LINK_ITEMS)) {
        item.classList.add(CLASS_NAME_ACTIVE$1);
      }
    }
  }
  _clearActiveClass(parent) {
    parent.classList.remove(CLASS_NAME_ACTIVE$1);
    const activeNodes = SelectorEngine.find(`${SELECTOR_TARGET_LINKS}.${CLASS_NAME_ACTIVE$1}`, parent);
    for (const node of activeNodes) {
      node.classList.remove(CLASS_NAME_ACTIVE$1);
    }
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = ScrollSpy.getOrCreateInstance(this, config);
      if (typeof config !== "string") {
        return;
      }
      if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config]();
    });
  }
}
EventHandler.on(window, EVENT_LOAD_DATA_API$1, () => {
  for (const spy of SelectorEngine.find(SELECTOR_DATA_SPY)) {
    ScrollSpy.getOrCreateInstance(spy);
  }
});
defineJQueryPlugin(ScrollSpy);
const NAME$1 = "tab";
const DATA_KEY$1 = "bs.tab";
const EVENT_KEY$1 = `.${DATA_KEY$1}`;
const EVENT_HIDE$1 = `hide${EVENT_KEY$1}`;
const EVENT_HIDDEN$1 = `hidden${EVENT_KEY$1}`;
const EVENT_SHOW$1 = `show${EVENT_KEY$1}`;
const EVENT_SHOWN$1 = `shown${EVENT_KEY$1}`;
const EVENT_CLICK_DATA_API = `click${EVENT_KEY$1}`;
const EVENT_KEYDOWN = `keydown${EVENT_KEY$1}`;
const EVENT_LOAD_DATA_API = `load${EVENT_KEY$1}`;
const ARROW_LEFT_KEY = "ArrowLeft";
const ARROW_RIGHT_KEY = "ArrowRight";
const ARROW_UP_KEY = "ArrowUp";
const ARROW_DOWN_KEY = "ArrowDown";
const HOME_KEY = "Home";
const END_KEY = "End";
const CLASS_NAME_ACTIVE = "active";
const CLASS_NAME_FADE$1 = "fade";
const CLASS_NAME_SHOW$1 = "show";
const CLASS_DROPDOWN = "dropdown";
const SELECTOR_DROPDOWN_TOGGLE = ".dropdown-toggle";
const SELECTOR_DROPDOWN_MENU = ".dropdown-menu";
const NOT_SELECTOR_DROPDOWN_TOGGLE = `:not(${SELECTOR_DROPDOWN_TOGGLE})`;
const SELECTOR_TAB_PANEL = '.list-group, .nav, [role="tablist"]';
const SELECTOR_OUTER = ".nav-item, .list-group-item";
const SELECTOR_INNER = `.nav-link${NOT_SELECTOR_DROPDOWN_TOGGLE}, .list-group-item${NOT_SELECTOR_DROPDOWN_TOGGLE}, [role="tab"]${NOT_SELECTOR_DROPDOWN_TOGGLE}`;
const SELECTOR_DATA_TOGGLE = '[data-bs-toggle="tab"], [data-bs-toggle="pill"], [data-bs-toggle="list"]';
const SELECTOR_INNER_ELEM = `${SELECTOR_INNER}, ${SELECTOR_DATA_TOGGLE}`;
const SELECTOR_DATA_TOGGLE_ACTIVE = `.${CLASS_NAME_ACTIVE}[data-bs-toggle="tab"], .${CLASS_NAME_ACTIVE}[data-bs-toggle="pill"], .${CLASS_NAME_ACTIVE}[data-bs-toggle="list"]`;
class Tab extends BaseComponent {
  constructor(element) {
    super(element);
    this._parent = this._element.closest(SELECTOR_TAB_PANEL);
    if (!this._parent) {
      return;
    }
    this._setInitialAttributes(this._parent, this._getChildren());
    EventHandler.on(this._element, EVENT_KEYDOWN, (event) => this._keydown(event));
  }
  // Getters
  static get NAME() {
    return NAME$1;
  }
  // Public
  show() {
    const innerElem = this._element;
    if (this._elemIsActive(innerElem)) {
      return;
    }
    const active = this._getActiveElem();
    const hideEvent = active ? EventHandler.trigger(active, EVENT_HIDE$1, {
      relatedTarget: innerElem
    }) : null;
    const showEvent = EventHandler.trigger(innerElem, EVENT_SHOW$1, {
      relatedTarget: active
    });
    if (showEvent.defaultPrevented || hideEvent && hideEvent.defaultPrevented) {
      return;
    }
    this._deactivate(active, innerElem);
    this._activate(innerElem, active);
  }
  // Private
  _activate(element, relatedElem) {
    if (!element) {
      return;
    }
    element.classList.add(CLASS_NAME_ACTIVE);
    this._activate(SelectorEngine.getElementFromSelector(element));
    const complete = () => {
      if (element.getAttribute("role") !== "tab") {
        element.classList.add(CLASS_NAME_SHOW$1);
        return;
      }
      element.removeAttribute("tabindex");
      element.setAttribute("aria-selected", true);
      this._toggleDropDown(element, true);
      EventHandler.trigger(element, EVENT_SHOWN$1, {
        relatedTarget: relatedElem
      });
    };
    this._queueCallback(complete, element, element.classList.contains(CLASS_NAME_FADE$1));
  }
  _deactivate(element, relatedElem) {
    if (!element) {
      return;
    }
    element.classList.remove(CLASS_NAME_ACTIVE);
    element.blur();
    this._deactivate(SelectorEngine.getElementFromSelector(element));
    const complete = () => {
      if (element.getAttribute("role") !== "tab") {
        element.classList.remove(CLASS_NAME_SHOW$1);
        return;
      }
      element.setAttribute("aria-selected", false);
      element.setAttribute("tabindex", "-1");
      this._toggleDropDown(element, false);
      EventHandler.trigger(element, EVENT_HIDDEN$1, {
        relatedTarget: relatedElem
      });
    };
    this._queueCallback(complete, element, element.classList.contains(CLASS_NAME_FADE$1));
  }
  _keydown(event) {
    if (![ARROW_LEFT_KEY, ARROW_RIGHT_KEY, ARROW_UP_KEY, ARROW_DOWN_KEY, HOME_KEY, END_KEY].includes(event.key)) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    const children = this._getChildren().filter((element) => !isDisabled(element));
    let nextActiveElement;
    if ([HOME_KEY, END_KEY].includes(event.key)) {
      nextActiveElement = children[event.key === HOME_KEY ? 0 : children.length - 1];
    } else {
      const isNext = [ARROW_RIGHT_KEY, ARROW_DOWN_KEY].includes(event.key);
      nextActiveElement = getNextActiveElement(children, event.target, isNext, true);
    }
    if (nextActiveElement) {
      nextActiveElement.focus({
        preventScroll: true
      });
      Tab.getOrCreateInstance(nextActiveElement).show();
    }
  }
  _getChildren() {
    return SelectorEngine.find(SELECTOR_INNER_ELEM, this._parent);
  }
  _getActiveElem() {
    return this._getChildren().find((child) => this._elemIsActive(child)) || null;
  }
  _setInitialAttributes(parent, children) {
    this._setAttributeIfNotExists(parent, "role", "tablist");
    for (const child of children) {
      this._setInitialAttributesOnChild(child);
    }
  }
  _setInitialAttributesOnChild(child) {
    child = this._getInnerElement(child);
    const isActive = this._elemIsActive(child);
    const outerElem = this._getOuterElement(child);
    child.setAttribute("aria-selected", isActive);
    if (outerElem !== child) {
      this._setAttributeIfNotExists(outerElem, "role", "presentation");
    }
    if (!isActive) {
      child.setAttribute("tabindex", "-1");
    }
    this._setAttributeIfNotExists(child, "role", "tab");
    this._setInitialAttributesOnTargetPanel(child);
  }
  _setInitialAttributesOnTargetPanel(child) {
    const target = SelectorEngine.getElementFromSelector(child);
    if (!target) {
      return;
    }
    this._setAttributeIfNotExists(target, "role", "tabpanel");
    if (child.id) {
      this._setAttributeIfNotExists(target, "aria-labelledby", `${child.id}`);
    }
  }
  _toggleDropDown(element, open) {
    const outerElem = this._getOuterElement(element);
    if (!outerElem.classList.contains(CLASS_DROPDOWN)) {
      return;
    }
    const toggle = (selector, className) => {
      const element2 = SelectorEngine.findOne(selector, outerElem);
      if (element2) {
        element2.classList.toggle(className, open);
      }
    };
    toggle(SELECTOR_DROPDOWN_TOGGLE, CLASS_NAME_ACTIVE);
    toggle(SELECTOR_DROPDOWN_MENU, CLASS_NAME_SHOW$1);
    outerElem.setAttribute("aria-expanded", open);
  }
  _setAttributeIfNotExists(element, attribute, value) {
    if (!element.hasAttribute(attribute)) {
      element.setAttribute(attribute, value);
    }
  }
  _elemIsActive(elem) {
    return elem.classList.contains(CLASS_NAME_ACTIVE);
  }
  // Try to get the inner element (usually the .nav-link)
  _getInnerElement(elem) {
    return elem.matches(SELECTOR_INNER_ELEM) ? elem : SelectorEngine.findOne(SELECTOR_INNER_ELEM, elem);
  }
  // Try to get the outer element (usually the .nav-item)
  _getOuterElement(elem) {
    return elem.closest(SELECTOR_OUTER) || elem;
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = Tab.getOrCreateInstance(this);
      if (typeof config !== "string") {
        return;
      }
      if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config]();
    });
  }
}
EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function(event) {
  if (["A", "AREA"].includes(this.tagName)) {
    event.preventDefault();
  }
  if (isDisabled(this)) {
    return;
  }
  Tab.getOrCreateInstance(this).show();
});
EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
  for (const element of SelectorEngine.find(SELECTOR_DATA_TOGGLE_ACTIVE)) {
    Tab.getOrCreateInstance(element);
  }
});
defineJQueryPlugin(Tab);
const NAME = "toast";
const DATA_KEY = "bs.toast";
const EVENT_KEY = `.${DATA_KEY}`;
const EVENT_MOUSEOVER = `mouseover${EVENT_KEY}`;
const EVENT_MOUSEOUT = `mouseout${EVENT_KEY}`;
const EVENT_FOCUSIN = `focusin${EVENT_KEY}`;
const EVENT_FOCUSOUT = `focusout${EVENT_KEY}`;
const EVENT_HIDE = `hide${EVENT_KEY}`;
const EVENT_HIDDEN = `hidden${EVENT_KEY}`;
const EVENT_SHOW = `show${EVENT_KEY}`;
const EVENT_SHOWN = `shown${EVENT_KEY}`;
const CLASS_NAME_FADE = "fade";
const CLASS_NAME_HIDE = "hide";
const CLASS_NAME_SHOW = "show";
const CLASS_NAME_SHOWING = "showing";
const DefaultType = {
  animation: "boolean",
  autohide: "boolean",
  delay: "number"
};
const Default = {
  animation: true,
  autohide: true,
  delay: 5e3
};
class Toast extends BaseComponent {
  constructor(element, config) {
    super(element, config);
    this._timeout = null;
    this._hasMouseInteraction = false;
    this._hasKeyboardInteraction = false;
    this._setListeners();
  }
  // Getters
  static get Default() {
    return Default;
  }
  static get DefaultType() {
    return DefaultType;
  }
  static get NAME() {
    return NAME;
  }
  // Public
  show() {
    const showEvent = EventHandler.trigger(this._element, EVENT_SHOW);
    if (showEvent.defaultPrevented) {
      return;
    }
    this._clearTimeout();
    if (this._config.animation) {
      this._element.classList.add(CLASS_NAME_FADE);
    }
    const complete = () => {
      this._element.classList.remove(CLASS_NAME_SHOWING);
      EventHandler.trigger(this._element, EVENT_SHOWN);
      this._maybeScheduleHide();
    };
    this._element.classList.remove(CLASS_NAME_HIDE);
    reflow(this._element);
    this._element.classList.add(CLASS_NAME_SHOW, CLASS_NAME_SHOWING);
    this._queueCallback(complete, this._element, this._config.animation);
  }
  hide() {
    if (!this.isShown()) {
      return;
    }
    const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE);
    if (hideEvent.defaultPrevented) {
      return;
    }
    const complete = () => {
      this._element.classList.add(CLASS_NAME_HIDE);
      this._element.classList.remove(CLASS_NAME_SHOWING, CLASS_NAME_SHOW);
      EventHandler.trigger(this._element, EVENT_HIDDEN);
    };
    this._element.classList.add(CLASS_NAME_SHOWING);
    this._queueCallback(complete, this._element, this._config.animation);
  }
  dispose() {
    this._clearTimeout();
    if (this.isShown()) {
      this._element.classList.remove(CLASS_NAME_SHOW);
    }
    super.dispose();
  }
  isShown() {
    return this._element.classList.contains(CLASS_NAME_SHOW);
  }
  // Private
  _maybeScheduleHide() {
    if (!this._config.autohide) {
      return;
    }
    if (this._hasMouseInteraction || this._hasKeyboardInteraction) {
      return;
    }
    this._timeout = setTimeout(() => {
      this.hide();
    }, this._config.delay);
  }
  _onInteraction(event, isInteracting) {
    switch (event.type) {
      case "mouseover":
      case "mouseout": {
        this._hasMouseInteraction = isInteracting;
        break;
      }
      case "focusin":
      case "focusout": {
        this._hasKeyboardInteraction = isInteracting;
        break;
      }
    }
    if (isInteracting) {
      this._clearTimeout();
      return;
    }
    const nextElement = event.relatedTarget;
    if (this._element === nextElement || this._element.contains(nextElement)) {
      return;
    }
    this._maybeScheduleHide();
  }
  _setListeners() {
    EventHandler.on(this._element, EVENT_MOUSEOVER, (event) => this._onInteraction(event, true));
    EventHandler.on(this._element, EVENT_MOUSEOUT, (event) => this._onInteraction(event, false));
    EventHandler.on(this._element, EVENT_FOCUSIN, (event) => this._onInteraction(event, true));
    EventHandler.on(this._element, EVENT_FOCUSOUT, (event) => this._onInteraction(event, false));
  }
  _clearTimeout() {
    clearTimeout(this._timeout);
    this._timeout = null;
  }
  // Static
  static jQueryInterface(config) {
    return this.each(function() {
      const data = Toast.getOrCreateInstance(this, config);
      if (typeof config === "string") {
        if (typeof data[config] === "undefined") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config](this);
      }
    });
  }
}
enableDismissTrigger(Toast);
defineJQueryPlugin(Toast);
const bootstrap = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Alert,
  Button,
  Carousel,
  Collapse,
  Dropdown,
  Modal,
  Offcanvas,
  Popover,
  ScrollSpy,
  Tab,
  Toast,
  Tooltip
}, Symbol.toStringTag, { value: "Module" }));
const storageKey$1 = "kroma-color-mode";
const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
function initializeContrastDropdown(bootstrap2) {
  const getStoredMode = () => {
    try {
      const storedMode = localStorage.getItem(storageKey$1);
      return storedMode === "light" || storedMode === "dark" || storedMode === "auto" ? storedMode : "auto";
    } catch {
      return "auto";
    }
  };
  const setColorMode = (mode) => {
    const selectedMode = mode === "light" || mode === "dark" || mode === "auto" ? mode : "auto";
    const effectiveMode = selectedMode === "auto" ? colorScheme.matches ? "dark" : "light" : selectedMode;
    document.documentElement.setAttribute("data-bs-theme", effectiveMode);
    try {
      localStorage.setItem(storageKey$1, selectedMode);
    } catch {
    }
    const activeButton = document.querySelector(`[data-bs-theme-value="${selectedMode}"]`);
    const activeIcon = document.querySelector("#bd-theme .theme-icon-active use");
    const icon = activeButton?.querySelector("use");
    if (activeIcon && icon) activeIcon.setAttribute("href", icon.getAttribute("href") || "");
    document.querySelectorAll("[data-bs-theme-value]").forEach((button) => {
      const selected = button.dataset.bsThemeValue === selectedMode;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.querySelector(".ms-auto")?.classList.toggle("d-none", !selected);
    });
  };
  setColorMode(getStoredMode());
  document.querySelectorAll("[data-bs-theme-value]").forEach((button) => {
    button.addEventListener("click", () => {
      setColorMode(button.dataset.bsThemeValue || "auto");
      bootstrap2.Dropdown.getOrCreateInstance(document.querySelector("#bd-theme")).hide();
    });
  });
  colorScheme.addEventListener("change", () => {
    if (getStoredMode() === "auto") setColorMode("auto");
  });
}
const theme0 = "" + new URL("themes/dracula.css", import.meta.url).href;
const theme1 = "" + new URL("themes/kroma-entrepreneur.css", import.meta.url).href;
const themes = [
  { id: "dracula", label: "Dracula", stylesheet: theme0 },
  { id: "kroma-entrepreneur", label: "Kroma Entrepreneur", stylesheet: theme1 }
];
const storageKey = "kroma-theme-mode";
const themeAttribute = "data-kroma-theme";
function initializeThemeDropdown(bootstrap2) {
  const container = document.querySelector("[data-theme-dropdown]");
  if (!container) return;
  container.innerHTML = `
    <span class="text-body">Theme</span>
    <button class="btn btn-primary dropdown-toggle" type="button" data-theme-selector data-bs-toggle="dropdown" aria-expanded="false">
      <span id="kroma-theme-label">Theme</span>
    </button>
    <ul class="dropdown-menu dropdown-menu-end"></ul>
  `;
  const menu = container.querySelector(".dropdown-menu");
  const availableThemes = [{ id: "bootstrap", label: "Bootstrap", stylesheet: "" }, ...themes];
  availableThemes.forEach(({ id, label }) => {
    const item = document.createElement("li");
    item.innerHTML = `<button class="dropdown-item d-flex align-items-center" type="button" data-theme-value="${id}" aria-pressed="false">${label}<span class="ms-3"></span><svg class="bi ms-auto d-none" aria-hidden="true"><use href="#check2"></use></svg></button>`;
    menu.append(item);
  });
  const root = document.documentElement;
  const selector = document.querySelector("[data-theme-selector]");
  const labelElement = document.querySelector("#kroma-theme-label");
  const currentStylesheet = () => document.querySelector("#kroma-theme-stylesheet");
  let activeTheme = "bootstrap";
  let selection = 0;
  let pendingLink = null;
  const normalizeTheme = (theme) => availableThemes.some(({ id }) => id === theme) ? theme : "bootstrap";
  const getStoredTheme = () => {
    try {
      return normalizeTheme(localStorage.getItem(storageKey));
    } catch {
      return "bootstrap";
    }
  };
  const persistTheme = (theme) => {
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
    }
  };
  const updateControls = (theme) => {
    const themeLabel = availableThemes.find((item) => item.id === theme)?.label || theme;
    selector?.setAttribute("aria-label", `Theme: ${themeLabel}`);
    selector?.setAttribute("aria-busy", "false");
    if (labelElement) labelElement.textContent = themeLabel;
    document.querySelectorAll("[data-theme-value]").forEach((button) => {
      const selected = button.dataset.themeValue === theme;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.querySelector(".bi")?.classList.toggle("d-none", !selected);
    });
  };
  const setStatus = (status) => {
    container.dataset.themeState = status;
  };
  const clearPending = () => {
    pendingLink?.remove();
    pendingLink = null;
  };
  const commitTheme = (theme, nextStylesheet) => {
    const previousStylesheet = currentStylesheet();
    root.setAttribute(themeAttribute, theme);
    if (nextStylesheet) {
      nextStylesheet.media = "all";
      nextStylesheet.id = "kroma-theme-stylesheet";
      delete nextStylesheet.dataset.pendingKromaTheme;
      if (previousStylesheet && previousStylesheet !== nextStylesheet) previousStylesheet.remove();
    } else if (previousStylesheet) {
      previousStylesheet.removeAttribute("href");
    }
    pendingLink = null;
    activeTheme = theme;
    root.style.visibility = "";
    persistTheme(theme);
    updateControls(theme);
    setStatus("ready");
  };
  const failTheme = (theme, error) => {
    clearPending();
    root.style.visibility = "";
    console.error(`[kroma] Failed to load theme stylesheet "${theme}".`, error);
    persistTheme(activeTheme);
    updateControls(activeTheme);
    setStatus("error");
  };
  const usableStylesheet = (link) => {
    try {
      return (link.sheet?.cssRules.length ?? 0) > 0;
    } catch {
      return true;
    }
  };
  const setTheme = (theme, initial = false) => {
    const selectedTheme = normalizeTheme(theme);
    const request = ++selection;
    const stylesheet = availableThemes.find((item) => item.id === selectedTheme)?.stylesheet;
    if (pendingLink) clearPending();
    if (selectedTheme === activeTheme) {
      root.style.visibility = "";
      persistTheme(activeTheme);
      updateControls(activeTheme);
      setStatus("ready");
      return;
    }
    if (!stylesheet) {
      commitTheme(selectedTheme);
      return;
    }
    if (initial) root.style.visibility = "hidden";
    selector?.setAttribute("aria-busy", "true");
    setStatus("loading");
    const pending = document.createElement("link");
    pending.rel = "stylesheet";
    pending.href = stylesheet;
    pending.media = "print";
    pending.dataset.pendingKromaTheme = selectedTheme;
    pending.addEventListener("load", () => {
      if (request !== selection) {
        pending.remove();
        return;
      }
      if (!usableStylesheet(pending)) {
        failTheme(selectedTheme, new Error("Stylesheet loaded without usable rules"));
        pending.remove();
        return;
      }
      commitTheme(selectedTheme, pending);
    }, { once: true });
    pending.addEventListener("error", () => {
      if (request !== selection) {
        pending.remove();
        return;
      }
      failTheme(selectedTheme, new Error(`HTTP error while loading ${stylesheet}`));
      pending.remove();
    }, { once: true });
    pendingLink = pending;
    document.head.append(pending);
  };
  setTheme(getStoredTheme(), true);
  document.querySelectorAll("[data-theme-value]").forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(button.dataset.themeValue || "bootstrap");
      bootstrap2.Dropdown.getOrCreateInstance(button.closest(".dropdown")).hide();
    });
  });
}
const themeTokens = [
  {
    "id": "dracula",
    "primitiveShared": [
      {
        "name": "background",
        "value": "#282a36",
        "type": "color"
      },
      {
        "name": "current-line",
        "value": "#6272a4",
        "type": "color"
      },
      {
        "name": "selection",
        "value": "#44475a",
        "type": "color"
      },
      {
        "name": "foreground",
        "value": "#f8f8f2",
        "type": "color"
      },
      {
        "name": "red",
        "value": "#ff5555",
        "type": "color"
      },
      {
        "name": "orange",
        "value": "#ffb86c",
        "type": "color"
      },
      {
        "name": "yellow",
        "value": "#f1fa8c",
        "type": "color"
      },
      {
        "name": "green",
        "value": "#50fa7b",
        "type": "color"
      },
      {
        "name": "cyan",
        "value": "#8be9fd",
        "type": "color"
      },
      {
        "name": "purple",
        "value": "#bd93f9",
        "type": "color"
      },
      {
        "name": "pink",
        "value": "#ff79c6",
        "type": "color"
      },
      {
        "name": "background-deep",
        "value": "#21222c",
        "type": "color"
      },
      {
        "name": "background-raised",
        "value": "#343746",
        "type": "color"
      },
      {
        "name": "foreground-muted",
        "value": "#b9bbca",
        "type": "color"
      },
      {
        "name": "border",
        "value": "#44475a",
        "type": "color"
      },
      {
        "name": "font-family-system",
        "value": '(system-ui, -apple-system, "Segoe UI", sans-serif)',
        "type": "font-family"
      },
      {
        "name": "font-size-100",
        "value": "1rem",
        "type": "number"
      },
      {
        "name": "font-weight-400",
        "value": "400",
        "type": "number"
      },
      {
        "name": "font-weight-600",
        "value": "600",
        "type": "number"
      },
      {
        "name": "font-weight-700",
        "value": "700",
        "type": "number"
      },
      {
        "name": "line-height-normal",
        "value": "1.5",
        "type": "number"
      },
      {
        "name": "space-1",
        "value": "0.25rem",
        "type": "number"
      },
      {
        "name": "space-2",
        "value": "0.5rem",
        "type": "number"
      },
      {
        "name": "space-3",
        "value": "1rem",
        "type": "number"
      },
      {
        "name": "space-4",
        "value": "1.5rem",
        "type": "number"
      },
      {
        "name": "radius-sm",
        "value": "0.25rem",
        "type": "number"
      },
      {
        "name": "radius-md",
        "value": "0.375rem",
        "type": "number"
      },
      {
        "name": "radius-lg",
        "value": "0.5rem",
        "type": "number"
      },
      {
        "name": "shadow-1",
        "value": "(0 0.125rem 0.25rem rgba(33, 34, 44, 0.25))",
        "type": "font-family"
      },
      {
        "name": "shadow-2",
        "value": "(0 0.5rem 1rem rgba(33, 34, 44, 0.35))",
        "type": "font-family"
      },
      {
        "name": "duration-fast",
        "value": "120ms",
        "type": "number"
      },
      {
        "name": "duration-normal",
        "value": "200ms",
        "type": "number"
      },
      {
        "name": "easing-standard",
        "value": "cubic-bezier(0.2, 0, 0, 1)",
        "type": "string"
      },
      {
        "name": "easing-emphasized",
        "value": "cubic-bezier(0.2, 0, 0, 1)",
        "type": "string"
      }
    ],
    "primitiveLight": [
      {
        "name": "canvas",
        "value": "#f8f8f2",
        "type": "color"
      },
      {
        "name": "surface",
        "value": "#ffffff",
        "type": "color"
      },
      {
        "name": "surface-raised",
        "value": "#ededef",
        "type": "color"
      },
      {
        "name": "surface-accent",
        "value": "#f1ebff",
        "type": "color"
      },
      {
        "name": "text",
        "value": "#282a36",
        "type": "color"
      },
      {
        "name": "text-muted",
        "value": "#6272a4",
        "type": "color"
      },
      {
        "name": "border",
        "value": "#c8c9d4",
        "type": "color"
      },
      {
        "name": "primary",
        "value": "#7c4dcc",
        "type": "color"
      },
      {
        "name": "primary-hover",
        "value": "#6338ad",
        "type": "color"
      },
      {
        "name": "link",
        "value": "#087e9b",
        "type": "color"
      },
      {
        "name": "link-hover",
        "value": "#c2187a",
        "type": "color"
      },
      {
        "name": "success",
        "value": "#16833d",
        "type": "color"
      },
      {
        "name": "info",
        "value": "#087e9b",
        "type": "color"
      },
      {
        "name": "warning",
        "value": "#946c00",
        "type": "color"
      },
      {
        "name": "danger",
        "value": "#c62828",
        "type": "color"
      }
    ],
    "primitiveDark": [
      {
        "name": "background",
        "value": "#282a36",
        "type": "color"
      },
      {
        "name": "background-deep",
        "value": "#21222c",
        "type": "color"
      },
      {
        "name": "background-raised",
        "value": "#343746",
        "type": "color"
      },
      {
        "name": "foreground",
        "value": "#f8f8f2",
        "type": "color"
      },
      {
        "name": "foreground-muted",
        "value": "#b9bbca",
        "type": "color"
      },
      {
        "name": "border",
        "value": "#44475a",
        "type": "color"
      },
      {
        "name": "current-line",
        "value": "#6272a4",
        "type": "color"
      },
      {
        "name": "selection",
        "value": "#44475a",
        "type": "color"
      },
      {
        "name": "purple",
        "value": "#bd93f9",
        "type": "color"
      },
      {
        "name": "cyan",
        "value": "#8be9fd",
        "type": "color"
      },
      {
        "name": "green",
        "value": "#50fa7b",
        "type": "color"
      },
      {
        "name": "yellow",
        "value": "#f1fa8c",
        "type": "color"
      },
      {
        "name": "red",
        "value": "#ff5555",
        "type": "color"
      },
      {
        "name": "pink",
        "value": "#ff79c6",
        "type": "color"
      }
    ],
    "semanticLight": [
      {
        "name": "primary",
        "value": "#7c4dcc",
        "type": "color"
      },
      {
        "name": "link",
        "value": "#087e9b",
        "type": "color"
      },
      {
        "name": "success",
        "value": "#16833d",
        "type": "color"
      },
      {
        "name": "info",
        "value": "#087e9b",
        "type": "color"
      },
      {
        "name": "warning",
        "value": "#946c00",
        "type": "color"
      },
      {
        "name": "danger",
        "value": "#c62828",
        "type": "color"
      },
      {
        "name": "body",
        "value": "#f8f8f2",
        "type": "color"
      },
      {
        "name": "surface",
        "value": "#ffffff",
        "type": "color"
      },
      {
        "name": "content",
        "value": "#282a36",
        "type": "color"
      },
      {
        "name": "muted-content",
        "value": "#6272a4",
        "type": "color"
      },
      {
        "name": "border",
        "value": "#c8c9d4",
        "type": "color"
      }
    ],
    "semanticDark": [
      {
        "name": "primary",
        "value": "#bd93f9",
        "type": "color"
      },
      {
        "name": "link",
        "value": "#8be9fd",
        "type": "color"
      },
      {
        "name": "success",
        "value": "#50fa7b",
        "type": "color"
      },
      {
        "name": "info",
        "value": "#8be9fd",
        "type": "color"
      },
      {
        "name": "warning",
        "value": "#f1fa8c",
        "type": "color"
      },
      {
        "name": "danger",
        "value": "#ff5555",
        "type": "color"
      },
      {
        "name": "body",
        "value": "#282a36",
        "type": "color"
      },
      {
        "name": "surface",
        "value": "#343746",
        "type": "color"
      },
      {
        "name": "surface-subtle",
        "value": "#21222c",
        "type": "color"
      },
      {
        "name": "content",
        "value": "#f8f8f2",
        "type": "color"
      },
      {
        "name": "muted-content",
        "value": "#b9bbca",
        "type": "color"
      },
      {
        "name": "border",
        "value": "#44475a",
        "type": "color"
      }
    ]
  },
  {
    "id": "kroma-entrepreneur",
    "primitiveShared": [
      {
        "name": "green-600",
        "value": "#198754",
        "type": "color"
      },
      {
        "name": "cyan-500",
        "value": "#0dcaf0",
        "type": "color"
      },
      {
        "name": "yellow-500",
        "value": "#ffc107",
        "type": "color"
      },
      {
        "name": "yellow-800",
        "value": "#66520a",
        "type": "color"
      },
      {
        "name": "red-600",
        "value": "#dc3545",
        "type": "color"
      },
      {
        "name": "gray-100",
        "value": "#f8f9fa",
        "type": "color"
      },
      {
        "name": "gray-950",
        "value": "#010413",
        "type": "color"
      },
      {
        "name": "gray-300",
        "value": "#dee2e6",
        "type": "color"
      },
      {
        "name": "gray-500",
        "value": "#94a3b8",
        "type": "color"
      },
      {
        "name": "gray-600",
        "value": "#6c757d",
        "type": "color"
      },
      {
        "name": "gray-600-alt",
        "value": "#667085",
        "type": "color"
      },
      {
        "name": "gray-700",
        "value": "#64748b",
        "type": "color"
      },
      {
        "name": "gray-750",
        "value": "#334155",
        "type": "color"
      },
      {
        "name": "gray-800",
        "value": "#212529",
        "type": "color"
      },
      {
        "name": "gray-850",
        "value": "#111827",
        "type": "color"
      },
      {
        "name": "gray-900",
        "value": "#020617",
        "type": "color"
      },
      {
        "name": "black",
        "value": "#000000",
        "type": "color"
      },
      {
        "name": "white",
        "value": "#ffffff",
        "type": "color"
      },
      {
        "name": "opacity-hover",
        "value": "0.08",
        "type": "number"
      },
      {
        "name": "opacity-active",
        "value": "0.14",
        "type": "number"
      },
      {
        "name": "opacity-surface",
        "value": "0.26",
        "type": "number"
      },
      {
        "name": "opacity-focus",
        "value": "0.25",
        "type": "number"
      },
      {
        "name": "opacity-overlay",
        "value": "0.72",
        "type": "number"
      },
      {
        "name": "opacity-scrim",
        "value": "0.55",
        "type": "number"
      },
      {
        "name": "font-family-system",
        "value": '(system-ui, -apple-system, "Segoe UI", sans-serif)',
        "type": "font-family"
      },
      {
        "name": "font-size-100",
        "value": "1rem",
        "type": "number"
      },
      {
        "name": "font-weight-400",
        "value": "400",
        "type": "number"
      },
      {
        "name": "font-weight-600",
        "value": "600",
        "type": "number"
      },
      {
        "name": "font-weight-700",
        "value": "700",
        "type": "number"
      },
      {
        "name": "line-height-normal",
        "value": "1.5",
        "type": "number"
      },
      {
        "name": "space-1",
        "value": "0.25rem",
        "type": "number"
      },
      {
        "name": "space-2",
        "value": "0.5rem",
        "type": "number"
      },
      {
        "name": "space-3",
        "value": "1rem",
        "type": "number"
      },
      {
        "name": "space-4",
        "value": "1.5rem",
        "type": "number"
      },
      {
        "name": "radius-sm",
        "value": "0.25rem",
        "type": "number"
      },
      {
        "name": "radius-md",
        "value": "0.375rem",
        "type": "number"
      },
      {
        "name": "radius-lg",
        "value": "0.5rem",
        "type": "number"
      },
      {
        "name": "shadow-1",
        "value": "(0 0.125rem 0.25rem rgba(11, 10, 43, 0.12))",
        "type": "font-family"
      },
      {
        "name": "shadow-2",
        "value": "(0 0.5rem 1rem rgba(11, 10, 43, 0.12))",
        "type": "font-family"
      },
      {
        "name": "duration-fast",
        "value": "120ms",
        "type": "number"
      },
      {
        "name": "duration-normal",
        "value": "200ms",
        "type": "number"
      },
      {
        "name": "easing-standard",
        "value": "cubic-bezier(0.2, 0, 0, 1)",
        "type": "string"
      },
      {
        "name": "easing-emphasized",
        "value": "cubic-bezier(0.2, 0, 0, 1)",
        "type": "string"
      }
    ],
    "primitiveLight": [
      {
        "name": "blue-700",
        "value": "#0c3493",
        "type": "color"
      },
      {
        "name": "blue-300",
        "value": "#8eb5ff",
        "type": "color"
      },
      {
        "name": "blue-200",
        "value": "#b8d0fa",
        "type": "color"
      },
      {
        "name": "blue-100",
        "value": "#e8effc",
        "type": "color"
      }
    ],
    "primitiveDark": [
      {
        "name": "blue-dark-950",
        "value": "#040b20",
        "type": "color"
      },
      {
        "name": "blue-dark-900",
        "value": "#091a3d",
        "type": "color"
      },
      {
        "name": "blue-dark-850",
        "value": "#0d2450",
        "type": "color"
      },
      {
        "name": "blue-dark-800",
        "value": "#123064",
        "type": "color"
      },
      {
        "name": "blue-dark-750",
        "value": "#1b3d78",
        "type": "color"
      },
      {
        "name": "blue-dark-700",
        "value": "#285092",
        "type": "color"
      },
      {
        "name": "blue-dark-600",
        "value": "#3d6db8",
        "type": "color"
      },
      {
        "name": "blue-dark-300",
        "value": "#9fc1ff",
        "type": "color"
      },
      {
        "name": "blue-dark-200",
        "value": "#c4d9ff",
        "type": "color"
      }
    ],
    "semanticLight": [
      {
        "name": "primary",
        "value": "#0c3493",
        "type": "color"
      },
      {
        "name": "link",
        "value": "#0c3493",
        "type": "color"
      },
      {
        "name": "success",
        "value": "#198754",
        "type": "color"
      },
      {
        "name": "info",
        "value": "#0dcaf0",
        "type": "color"
      },
      {
        "name": "warning",
        "value": "#ffc107",
        "type": "color"
      },
      {
        "name": "danger",
        "value": "#dc3545",
        "type": "color"
      },
      {
        "name": "body",
        "value": "#f8f9fa",
        "type": "color"
      },
      {
        "name": "surface",
        "value": "#ffffff",
        "type": "color"
      },
      {
        "name": "content",
        "value": "#212529",
        "type": "color"
      },
      {
        "name": "muted-content",
        "value": "#6c757d",
        "type": "color"
      },
      {
        "name": "border",
        "value": "#dee2e6",
        "type": "color"
      }
    ],
    "semanticDark": [
      {
        "name": "primary",
        "value": "#285092",
        "type": "color"
      },
      {
        "name": "link",
        "value": "#9fc1ff",
        "type": "color"
      },
      {
        "name": "success",
        "value": "#198754",
        "type": "color"
      },
      {
        "name": "info",
        "value": "#0dcaf0",
        "type": "color"
      },
      {
        "name": "warning",
        "value": "#ffc107",
        "type": "color"
      },
      {
        "name": "danger",
        "value": "#dc3545",
        "type": "color"
      },
      {
        "name": "body",
        "value": "#040b20",
        "type": "color"
      },
      {
        "name": "surface",
        "value": "#091a3d",
        "type": "color"
      },
      {
        "name": "content",
        "value": "#c4d9ff",
        "type": "color"
      },
      {
        "name": "muted-content",
        "value": "#9fc1ff",
        "type": "color"
      },
      {
        "name": "border",
        "value": "#1b3d78",
        "type": "color"
      }
    ]
  }
];
function getTextColor(value) {
  const hex = value.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (!hex) return "#212529";
  const normalized = hex.length === 3 ? hex.split("").map((channel) => channel + channel).join("") : hex.slice(0, 6);
  const channels = [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16) / 255);
  const luminance = channels.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * luminance[0] + 0.7152 * luminance[1] + 0.0722 * luminance[2] < 0.45 ? "#ffffff" : "#212529";
}
function initializeColorTokenPalette() {
  const palette = document.querySelector("[data-theme-token-palette]");
  if (!palette) return;
  const renderTokens = () => {
    const theme = themeTokens.find((entry) => entry.id === document.documentElement.dataset.kromaTheme);
    const contrast = document.documentElement.dataset.bsTheme === "dark" ? "dark" : "light";
    const groups = theme ? contrast === "dark" ? [
      ["Primitive color tokens · dark", theme.primitiveDark],
      ["Semantic color tokens · dark", theme.semanticDark]
    ] : [
      ["Primitive color tokens · light", theme.primitiveLight],
      ["Semantic color tokens · light", theme.semanticLight]
    ] : [];
    palette.innerHTML = groups.map(([title, tokens]) => {
      const colors = tokens.filter((token) => token.type === "color");
      if (!colors.length) return "";
      return `
        <div class="col-12"><h4 class="h6 mt-3">${title}</h4></div>
        ${colors.map((token) => `
        <div class="col-6 col-md-3">
          <div class="bd-color-token" style="--bd-token-color: ${token.value}; --bd-token-text: ${getTextColor(token.value)}">
            <span>${token.name}</span>
            <code>${token.value}</code>
          </div>
        </div>`).join("")}`;
    }).join("");
  };
  renderTokens();
  new MutationObserver(renderTokens).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-kroma-theme", "data-bs-theme"]
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", renderTokens);
}
const scriptRel = "modulepreload";
const assetsURL = function(dep, importerUrl) {
  return new URL(dep, importerUrl).href;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    let allSettled = function(promises$2) {
      return Promise.all(promises$2.map((p) => Promise.resolve(p).then((value$1) => ({
        status: "fulfilled",
        value: value$1
      }), (reason) => ({
        status: "rejected",
        reason
      }))));
    };
    const links = document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = allSettled(deps.map((dep) => {
      dep = assetsURL(dep, importerUrl);
      if (dep in seen) return;
      seen[dep] = true;
      const isCss = dep.endsWith(".css");
      const cssSelector = isCss ? '[rel="stylesheet"]' : "";
      if (!!importerUrl) for (let i$1 = links.length - 1; i$1 >= 0; i$1--) {
        const link$1 = links[i$1];
        if (link$1.href === dep && (!isCss || link$1.rel === "stylesheet")) return;
      }
      else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
      const link = document.createElement("link");
      link.rel = isCss ? "stylesheet" : scriptRel;
      if (!isCss) link.as = "script";
      link.crossOrigin = "";
      link.href = dep;
      if (cspNonce) link.setAttribute("nonce", cspNonce);
      document.head.appendChild(link);
      if (isCss) return new Promise((res, rej) => {
        link.addEventListener("load", res);
        link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
      });
    }));
  }
  function handlePreloadError(err$2) {
    const e$1 = new Event("vite:preloadError", { cancelable: true });
    e$1.payload = err$2;
    window.dispatchEvent(e$1);
    if (!e$1.defaultPrevented) throw err$2;
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var build$1 = { exports: {} };
var build = build$1.exports;
var hasRequiredBuild;
function requireBuild() {
  if (hasRequiredBuild) return build$1.exports;
  hasRequiredBuild = 1;
  (function(module, exports) {
    !(function(t, e) {
      module.exports = e();
    })(build, function() {
      return (function() {
        var t = { 529: function(t2) {
          t2.exports = function(t3, e2) {
            return { value: t3, done: e2 };
          };
        }, 606: function(t2, e2, n2) {
          var r2 = n2(823), o = TypeError;
          t2.exports = function(t3, e3) {
            if (!delete t3[e3]) throw new o("Cannot delete property " + r2(e3) + " of " + r2(t3));
          };
        }, 837: function(t2) {
          var e2 = TypeError;
          t2.exports = function(t3) {
            if (t3 > 9007199254740991) throw new e2("Maximum allowed index exceeded");
            return t3;
          };
        }, 400: function(t2) {
          t2.exports = { CSSRuleList: 0, CSSStyleDeclaration: 0, CSSValueList: 0, ClientRectList: 0, DOMRectList: 0, DOMStringList: 0, DOMTokenList: 1, DataTransferItemList: 0, FileList: 0, HTMLAllCollection: 0, HTMLCollection: 0, HTMLFormElement: 0, HTMLSelectElement: 0, MediaList: 0, MimeTypeArray: 0, NamedNodeMap: 0, NodeList: 1, PaintRequestList: 0, Plugin: 0, PluginArray: 0, SVGLengthList: 0, SVGNumberList: 0, SVGPathSegList: 0, SVGPointList: 0, SVGStringList: 0, SVGTransformList: 0, SourceBufferList: 0, StyleSheetList: 0, TextTrackCueList: 0, TextTrackList: 0, TouchList: 0 };
        }, 117: function(t2) {
          t2.exports = function(t3) {
            return null == t3;
          };
        }, 269: function(t2) {
          t2.exports = Object.create ? /* @__PURE__ */ Object.create(null) : {};
        }, 741: function(t2) {
          var e2 = Math.ceil, n2 = Math.floor;
          t2.exports = Math.trunc || function(t3) {
            var r2 = +t3;
            return (r2 > 0 ? n2 : e2)(r2);
          };
        }, 717: function(t2, e2) {
          e2.f = Object.getOwnPropertySymbols;
        }, 823: function(t2) {
          var e2 = String;
          t2.exports = function(t3) {
            try {
              return e2(t3);
            } catch (t4) {
              return "Object";
            }
          };
        } }, e = {};
        function n(r2) {
          var o = e[r2];
          if (void 0 !== o) return o.exports;
          var i = e[r2] = { exports: {} };
          return t[r2](i, i.exports, n), i.exports;
        }
        n.cw = function(t2) {
          var e2;
          return function() {
            if (t2) {
              var n2 = t2;
              t2 = 0, e2 = { exports: {} }, n2.call(e2.exports, e2, e2.exports);
            }
            return e2.exports;
          };
        }, n.d = function(t2, e2) {
          for (var r2 in e2) n.o(e2, r2) && !n.o(t2, r2) && Object.defineProperty(t2, r2, { enumerable: true, get: e2[r2] });
        }, n.g = (function() {
          if ("object" == typeof globalThis) return globalThis;
          try {
            return this || new Function("return this")();
          } catch (t2) {
            if ("object" == typeof window) return window;
          }
        })(), n.o = function(t2, e2) {
          return Object.prototype.hasOwnProperty.call(t2, e2);
        }, n.r = function(t2) {
          "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(t2, "__esModule", { value: true });
        };
        var r = {};
        return (function() {
          n.r(r), n.d(r, { SimpleKeyboard: function() {
            return mr;
          }, default: function() {
            return br;
          } });
          var t2 = n.cw(function(t3) {
            var e3 = Et(), n2 = Ue(), r2 = TypeError;
            t3.exports = function(t4) {
              if (e3(t4)) return t4;
              throw new r2(n2(t4) + " is not a function");
            };
          }), e2 = n.cw(function(t3) {
            var e3 = St(), n2 = Ue(), r2 = TypeError;
            t3.exports = function(t4) {
              if (e3(t4)) return t4;
              throw new r2(n2(t4) + " is not a constructor");
            };
          }), o = n.cw(function(t3) {
            var e3 = At(), n2 = String, r2 = TypeError;
            t3.exports = function(t4) {
              if (e3(t4)) return t4;
              throw new r2("Can't set " + n2(t4) + " as a prototype");
            };
          }), i = n.cw(function(t3) {
            var e3 = Ye(), n2 = Jt(), r2 = Vt().f, o2 = e3("unscopables"), i2 = Array.prototype;
            void 0 === i2[o2] && r2(i2, o2, { configurable: true, value: n2(null) }), t3.exports = function(t4) {
              i2[o2][t4] = true;
            };
          }), a = n.cw(function(t3) {
            var e3 = ke().o;
            t3.exports = function(t4, n2, r2) {
              return n2 + (r2 && e3(t4, n2).length || 1);
            };
          }), s = n.cw(function(t3) {
            var e3 = Ct(), n2 = String, r2 = TypeError;
            t3.exports = function(t4) {
              if (e3(t4)) return t4;
              throw new r2(n2(t4) + " is not an object");
            };
          }), u = n.cw(function(t3) {
            var e3 = f().jJ, n2 = p()("forEach");
            t3.exports = n2 ? [].forEach : function(t4) {
              return e3(this, t4, arguments.length > 1 ? arguments[1] : void 0);
            };
          }), c = n.cw(function(t3) {
            var e3 = Z(), n2 = nt(), r2 = Le(), o2 = w(), i2 = xt(), a2 = St(), s2 = Ft(), u2 = M(), c2 = v(), l2 = ut(), f2 = ct(), d2 = jt(), p2 = K(), h2 = Array;
            t3.exports = function(t4) {
              var v2 = a2(this), y2 = arguments.length, g2 = y2 > 1 ? arguments[1] : void 0, m2 = void 0 !== g2;
              m2 && (g2 = e3(g2, y2 > 2 ? arguments[2] : void 0));
              var b2, w2, x2, O2, E2, S2, k2 = r2(t4), P2 = f2(k2), I2 = 0;
              if (!P2 || this === h2 && i2(P2)) for (b2 = s2(k2), w2 = v2 ? new this(b2) : h2(b2); b2 > I2; I2++) S2 = m2 ? g2(k2[I2], I2) : k2[I2], u2(w2, I2, S2);
              else for (w2 = v2 ? new this() : [], E2 = (O2 = l2(k2, P2)).next; !(x2 = n2(E2, O2)).done; I2++) {
                try {
                  p2(I2);
                } catch (t5) {
                  d2(O2, "throw", t5);
                }
                S2 = m2 ? o2(O2, g2, [x2.value, I2], true) : x2.value;
                try {
                  u2(w2, I2, S2);
                } catch (t5) {
                  d2(O2, "throw", t5);
                }
              }
              return c2(w2, I2), w2;
            };
          }), l = n.cw(function(t3) {
            var e3 = Te(), n2 = Ne(), r2 = Ft(), o2 = function(t4) {
              return function(o3, i2, a2) {
                var s2 = e3(o3), u2 = r2(s2);
                if (0 === u2) return !t4 && -1;
                var c2, l2 = n2(a2, u2);
                if (t4 && i2 != i2) {
                  for (; u2 > l2; ) if ((c2 = s2[l2++]) != c2) return true;
                } else for (; u2 > l2; l2++) if ((t4 || l2 in s2) && s2[l2] === i2) return t4 || l2 || 0;
                return !t4 && -1;
              };
            };
            t3.exports = { m: o2(true), q: o2(false) };
          }), f = n.cw(function(t3) {
            var e3 = Z(), n2 = gt(), r2 = Le(), o2 = Ft(), i2 = b(), a2 = M(), s2 = function(t4) {
              var s3 = 1 === t4, u2 = 2 === t4, c2 = 3 === t4, l2 = 4 === t4, f2 = 6 === t4, d2 = 7 === t4, p2 = 5 === t4 || f2;
              return function(h2, v2, y2) {
                for (var g2, m2, b2 = r2(h2), w2 = n2(b2), x2 = o2(w2), O2 = e3(v2, y2), E2 = 0, S2 = 0, k2 = s3 ? i2(h2, x2) : u2 || d2 ? i2(h2, 0) : void 0; x2 > E2; E2++) if ((p2 || E2 in w2) && (m2 = O2(g2 = w2[E2], E2, b2), t4)) if (s3) a2(k2, E2, m2);
                else if (m2) switch (t4) {
                  case 3:
                    return true;
                  case 5:
                    return g2;
                  case 6:
                    return E2;
                  case 2:
                    a2(k2, S2++, g2);
                }
                else switch (t4) {
                  case 4:
                    return false;
                  case 7:
                    a2(k2, S2++, g2);
                }
                return f2 ? -1 : c2 || l2 ? l2 : k2;
              };
            };
            t3.exports = { jJ: s2(0), Tj: s2(1), pb: s2(2), some: s2(3), every: s2(4), find: s2(5), findIndex: s2(6), filterReject: s2(7) };
          }), d = n.cw(function(t3) {
            var e3 = W(), n2 = Ye(), r2 = V(), o2 = n2("species");
            t3.exports = function(t4) {
              return r2 >= 51 || !e3(function() {
                var e4 = [];
                return (e4.constructor = {})[o2] = function() {
                  return { foo: 1 };
                }, 1 !== e4[t4](Boolean).foo;
              });
            };
          }), p = n.cw(function(t3) {
            var e3 = W();
            t3.exports = function(t4, n2) {
              var r2 = [][t4];
              return !!r2 && e3(function() {
                r2.call(null, n2 || function() {
                  return 1;
                }, 1);
              });
            };
          }), h = n.cw(function(e3) {
            var n2 = t2(), r2 = Le(), o2 = gt(), i2 = Ft(), a2 = TypeError, s2 = "Reduce of empty array with no initial value", u2 = function(t3) {
              return function(e4, u3, c2, l2) {
                var f2 = r2(e4), d2 = o2(f2), p2 = i2(f2);
                if (n2(u3), 0 === p2 && c2 < 2) throw new a2(s2);
                var h2 = t3 ? p2 - 1 : 0, v2 = t3 ? -1 : 1;
                if (c2 < 2) for (; ; ) {
                  if (h2 in d2) {
                    l2 = d2[h2], h2 += v2;
                    break;
                  }
                  if (h2 += v2, t3 ? h2 < 0 : p2 <= h2) throw new a2(s2);
                }
                for (; t3 ? h2 >= 0 : p2 > h2; h2 += v2) h2 in d2 && (l2 = u3(l2, d2[h2], h2, f2));
                return l2;
              };
            };
            e3.exports = { k: u2(false), right: u2(true) };
          }), v = n.cw(function(t3) {
            var e3 = L(), n2 = Ot(), r2 = TypeError, o2 = Object.getOwnPropertyDescriptor, i2 = e3 && !(function() {
              if (void 0 !== this) return true;
              try {
                Object.defineProperty([], "length", { writable: false }).length = 1;
              } catch (t4) {
                return t4 instanceof TypeError;
              }
            })();
            t3.exports = i2 ? function(t4, e4) {
              if (n2(t4) && !o2(t4, "length").writable) throw new r2("Cannot set read only .length");
              return t4.length = e4;
            } : function(t4, e4) {
              return t4.length = e4;
            };
          }), y = n.cw(function(t3) {
            var e3 = at();
            t3.exports = e3([].slice);
          }), g = n.cw(function(t3) {
            var e3 = y(), n2 = Math.floor, r2 = function(t4, o2) {
              var i2 = t4.length;
              if (i2 < 8) for (var a2, s2, u2 = 1; u2 < i2; ) {
                for (s2 = u2, a2 = t4[u2]; s2 && o2(t4[s2 - 1], a2) > 0; ) t4[s2] = t4[--s2];
                s2 !== u2++ && (t4[s2] = a2);
              }
              else for (var c2 = n2(i2 / 2), l2 = r2(e3(t4, 0, c2), o2), f2 = r2(e3(t4, c2), o2), d2 = l2.length, p2 = f2.length, h2 = 0, v2 = 0; h2 < d2 || v2 < p2; ) t4[h2 + v2] = h2 < d2 && v2 < p2 ? o2(l2[h2], f2[v2]) <= 0 ? l2[h2++] : f2[v2++] : h2 < d2 ? l2[h2++] : f2[v2++];
              return t4;
            };
            t3.exports = r2;
          }), m = n.cw(function(t3) {
            var e3 = Ot(), n2 = St(), r2 = Ct(), o2 = Ye()("species"), i2 = Array;
            t3.exports = function(t4) {
              var a2;
              return e3(t4) && (a2 = t4.constructor, (n2(a2) && (a2 === i2 || e3(a2.prototype)) || r2(a2) && null === (a2 = a2[o2])) && (a2 = void 0)), void 0 === a2 ? i2 : a2;
            };
          }), b = n.cw(function(t3) {
            var e3 = m();
            t3.exports = function(t4, n2) {
              return new (e3(t4))(0 === n2 ? 0 : n2);
            };
          }), w = n.cw(function(t3) {
            var e3 = s(), n2 = jt();
            t3.exports = function(t4, r2, o2, i2) {
              try {
                return i2 ? r2(e3(o2)[0], o2[1]) : r2(o2);
              } catch (e4) {
                n2(t4, "throw", e4);
              }
            };
          }), x = n.cw(function(t3) {
            var e3 = Ye()("iterator"), n2 = false;
            try {
              var r2 = 0, o2 = { next: function() {
                return { done: !!r2++ };
              }, return: function() {
                n2 = true;
              } };
              o2[e3] = function() {
                return this;
              }, Array.from(o2, function() {
                throw 2;
              });
            } catch (t4) {
            }
            t3.exports = function(t4, r3) {
              try {
                if (!r3 && !n2) return false;
              } catch (t5) {
                return false;
              }
              var o3 = false;
              try {
                var i2 = {};
                i2[e3] = function() {
                  return { next: function() {
                    return { done: o3 = true };
                  } };
                }, t4(i2);
              } catch (t5) {
              }
              return o3;
            };
          }), O = n.cw(function(t3) {
            var e3 = at(), n2 = e3({}.toString), r2 = e3("".slice);
            t3.exports = function(t4) {
              return r2(n2(t4), 8, -1);
            };
          }), E = n.cw(function(t3) {
            var e3 = Fe(), n2 = Et(), r2 = O(), o2 = Ye()("toStringTag"), i2 = Object, a2 = "Arguments" === r2(/* @__PURE__ */ (function() {
              return arguments;
            })());
            t3.exports = e3 ? r2 : function(t4) {
              var e4, s2, u2;
              return void 0 === t4 ? "Undefined" : null === t4 ? "Null" : "string" == typeof (s2 = (function(t5, e5) {
                try {
                  return t5[e5];
                } catch (t6) {
                }
              })(e4 = i2(t4), o2)) ? s2 : a2 ? r2(e4) : "Object" === (u2 = r2(e4)) && n2(e4.callee) ? "Arguments" : u2;
            };
          }), S = n.cw(function(t3) {
            var e3 = pt(), n2 = ae(), r2 = zt(), o2 = Vt();
            t3.exports = function(t4, i2, a2) {
              for (var s2 = n2(i2), u2 = o2.f, c2 = r2.f, l2 = 0; l2 < s2.length; l2++) {
                var f2 = s2[l2];
                e3(t4, f2) || a2 && e3(a2, f2) || u2(t4, f2, c2(i2, f2));
              }
            };
          }), k = n.cw(function(t3) {
            var e3 = Ye()("match");
            t3.exports = function(t4) {
              var n2 = /./;
              try {
                "/./"[t4](n2);
              } catch (r2) {
                try {
                  return n2[e3] = false, "/./"[t4](n2);
                } catch (t5) {
                }
              }
              return false;
            };
          }), P = n.cw(function(t3) {
            var e3 = W();
            t3.exports = !e3(function() {
              function t4() {
              }
              return t4.prototype.constructor = null, Object.getPrototypeOf(new t4()) !== t4.prototype;
            });
          }), I = function() {
            return n(529);
          }, C = n.cw(function(t3) {
            var e3 = L(), n2 = Vt(), r2 = A();
            t3.exports = e3 ? function(t4, e4, o2) {
              return n2.f(t4, e4, r2(1, o2));
            } : function(t4, e4, n3) {
              return t4[e4] = n3, t4;
            };
          }), A = n.cw(function(t3) {
            t3.exports = function(t4, e3) {
              return { enumerable: !(1 & t4), configurable: !(2 & t4), writable: !(4 & t4), value: e3 };
            };
          }), M = n.cw(function(t3) {
            var e3 = L(), n2 = Vt(), r2 = A();
            t3.exports = function(t4, o2, i2) {
              e3 ? n2.f(t4, o2, r2(0, i2)) : t4[o2] = i2;
            };
          }), D = n.cw(function(t3) {
            var e3 = s(), n2 = ie(), r2 = TypeError;
            t3.exports = function(t4) {
              if (e3(this), "string" === t4 || "default" === t4) t4 = "string";
              else if ("number" !== t4) throw new r2("Incorrect hint");
              return n2(this, t4);
            };
          }), N = n.cw(function(t3) {
            var e3 = _t(), n2 = Vt();
            t3.exports = function(t4, r2, o2) {
              return o2.get && e3(o2.get, r2, { getter: true }), o2.set && e3(o2.set, r2, { setter: true }), n2.f(t4, r2, o2);
            };
          }), T = n.cw(function(t3) {
            var e3 = Et(), n2 = Vt(), r2 = _t(), o2 = j();
            t3.exports = function(t4, i2, a2, s2) {
              s2 || (s2 = {});
              var u2 = s2.enumerable, c2 = void 0 !== s2.name ? s2.name : i2;
              if (e3(a2) && r2(a2, c2, s2), s2.global) u2 ? t4[i2] = a2 : o2(i2, a2);
              else {
                try {
                  s2.unsafe ? t4[i2] && (u2 = true) : delete t4[i2];
                } catch (t5) {
                }
                u2 ? t4[i2] = a2 : n2.f(t4, i2, { value: a2, enumerable: false, configurable: !s2.nonConfigurable, writable: !s2.nonWritable });
              }
              return t4;
            };
          }), j = n.cw(function(t3) {
            var e3 = dt(), n2 = Object.defineProperty;
            t3.exports = function(t4, r2) {
              try {
                n2(e3, t4, { value: r2, configurable: true, writable: true });
              } catch (n3) {
                e3[t4] = r2;
              }
              return r2;
            };
          }), R = function() {
            return n(606);
          }, L = n.cw(function(t3) {
            var e3 = W();
            t3.exports = !e3(function() {
              return 7 !== Object.defineProperty({}, 1, { get: function() {
                return 7;
              } })[1];
            });
          }), B = n.cw(function(t3) {
            var e3 = dt(), n2 = Ct(), r2 = e3.document, o2 = n2(r2) && n2(r2.createElement);
            t3.exports = function(t4) {
              return o2 ? r2.createElement(t4) : {};
            };
          }), K = function() {
            return n(837);
          }, F = function() {
            return n(400);
          }, _ = n.cw(function(t3) {
            var e3 = B()("span").classList, n2 = e3 && e3.constructor && e3.constructor.prototype;
            t3.exports = n2 === Object.prototype ? void 0 : n2;
          }), U = n.cw(function(t3) {
            t3.exports = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
          }), H = n.cw(function(t3) {
            var e3 = G().match(/firefox\/(\d+)/i);
            t3.exports = !!e3 && +e3[1];
          }), $ = n.cw(function(t3) {
            var e3 = G();
            t3.exports = /MSIE|Trident/.test(e3);
          }), J = n.cw(function(t3) {
            var e3 = Y();
            t3.exports = "NODE" === e3;
          }), G = n.cw(function(t3) {
            var e3 = dt().navigator, n2 = e3 && e3.userAgent;
            t3.exports = n2 ? String(n2) : "";
          }), V = n.cw(function(t3) {
            var e3, n2, r2 = dt(), o2 = G(), i2 = r2.process, a2 = r2.Deno, s2 = i2 && i2.versions || a2 && a2.version, u2 = s2 && s2.v8;
            u2 && (n2 = (e3 = u2.split("."))[0] > 0 && e3[0] < 4 ? 1 : +(e3[0] + e3[1])), !n2 && o2 && (!(e3 = o2.match(/Edge\/(\d+)/)) || e3[1] >= 74) && (e3 = o2.match(/Chrome\/(\d+)/)) && (n2 = +e3[1]), t3.exports = n2;
          }), z = n.cw(function(t3) {
            var e3 = G().match(/AppleWebKit\/(\d+)\./);
            t3.exports = !!e3 && +e3[1];
          }), Y = n.cw(function(t3) {
            var e3 = dt(), n2 = G(), r2 = O(), o2 = function(t4) {
              return n2.slice(0, t4.length) === t4;
            };
            t3.exports = o2("Bun/") ? "BUN" : o2("Cloudflare-Workers") ? "CLOUDFLARE" : o2("Deno/") ? "DENO" : o2("Node.js/") ? "NODE" : e3.Bun && "string" == typeof Bun.version ? "BUN" : e3.Deno && "object" == typeof Deno.version ? "DENO" : "process" === r2(e3.process) ? "NODE" : e3.window && e3.document ? "BROWSER" : "REST";
          }), q = n.cw(function(t3) {
            var e3 = dt(), n2 = zt().f, r2 = C(), o2 = T(), i2 = j(), a2 = S(), s2 = kt();
            t3.exports = function(t4, u2) {
              var c2, l2, f2, d2, p2, h2 = t4.target, v2 = t4.global, y2 = t4.stat;
              if (c2 = v2 ? e3 : y2 ? e3[h2] || i2(h2, {}) : e3[h2] && e3[h2].prototype) for (l2 in u2) {
                if (d2 = u2[l2], f2 = t4.dontCallGetSet ? (p2 = n2(c2, l2)) && p2.value : c2[l2], !s2(v2 ? l2 : h2 + (y2 ? "." : "#") + l2, t4.forced) && void 0 !== f2) {
                  if (typeof d2 == typeof f2) continue;
                  a2(d2, f2);
                }
                (t4.sham || f2 && f2.sham) && r2(d2, "sham", true), o2(c2, l2, d2, t4);
              }
            };
          }), W = n.cw(function(t3) {
            t3.exports = function(t4) {
              try {
                return !!t4();
              } catch (t5) {
                return true;
              }
            };
          }), X = n.cw(function(t3) {
            kn();
            var e3 = nt(), n2 = T(), r2 = fe(), o2 = W(), i2 = Ye(), a2 = C(), s2 = i2("species"), u2 = RegExp.prototype;
            t3.exports = function(t4, c2, l2, f2) {
              var d2 = i2(t4), p2 = !o2(function() {
                var e4 = {};
                return e4[d2] = function() {
                  return 7;
                }, 7 !== ""[t4](e4);
              }), h2 = p2 && !o2(function() {
                var e4 = false, n3 = /a/;
                if ("split" === t4) {
                  var r3 = {};
                  r3[s2] = function() {
                    return n3;
                  }, (n3 = { constructor: r3, flags: "" })[d2] = /./[d2];
                }
                return n3.exec = function() {
                  return e4 = true, null;
                }, n3[d2](""), !e4;
              });
              if (!p2 || !h2 || l2) {
                var v2 = /./[d2], y2 = c2(d2, ""[t4], function(t5, n3, o3, i3, a3) {
                  var s3 = n3.exec;
                  return s3 === r2 || s3 === u2.exec ? p2 && !a3 ? { done: true, value: e3(v2, n3, o3, i3) } : { done: true, value: e3(t5, o3, n3, i3) } : { done: false };
                });
                n2(String.prototype, t4, y2[0]), n2(u2, d2, y2[1]);
              }
              f2 && a2(u2[d2], "sham", true);
            };
          }), Q = n.cw(function(t3) {
            var e3 = tt(), n2 = Function.prototype, r2 = n2.apply, o2 = n2.call;
            t3.exports = "object" == typeof Reflect && Reflect.apply || (e3 ? o2.bind(r2) : function() {
              return o2.apply(r2, arguments);
            });
          }), Z = n.cw(function(e3) {
            var n2 = it(), r2 = t2(), o2 = tt(), i2 = n2(n2.bind);
            e3.exports = function(t3, e4) {
              return r2(t3), void 0 === e4 ? t3 : o2 ? i2(t3, e4) : function() {
                return t3.apply(e4, arguments);
              };
            };
          }), tt = n.cw(function(t3) {
            var e3 = W();
            t3.exports = !e3(function() {
              var t4 = (function() {
              }).bind();
              return "function" != typeof t4 || t4.hasOwnProperty("prototype");
            });
          }), et = n.cw(function(e3) {
            var n2 = at(), r2 = t2(), o2 = Ct(), i2 = pt(), a2 = y(), s2 = tt(), u2 = Function, c2 = n2([].concat), l2 = n2([].join), f2 = {};
            e3.exports = s2 ? u2.bind : function(t3) {
              var e4 = r2(this), n3 = e4.prototype, s3 = a2(arguments, 1), d2 = function() {
                var n4 = c2(s3, a2(arguments));
                return this instanceof d2 ? (function(t4, e5, n5) {
                  if (!i2(f2, e5)) {
                    for (var r3 = [], o3 = 0; o3 < e5; o3++) r3[o3] = "a[" + o3 + "]";
                    f2[e5] = u2("C,a", "return new C(" + l2(r3, ",") + ")");
                  }
                  return f2[e5](t4, n5);
                })(e4, n4.length, n4) : e4.apply(t3, n4);
              };
              return o2(n3) && (d2.prototype = n3), d2;
            };
          }), nt = n.cw(function(t3) {
            var e3 = tt(), n2 = Function.prototype.call;
            t3.exports = e3 ? n2.bind(n2) : function() {
              return n2.apply(n2, arguments);
            };
          }), rt = n.cw(function(t3) {
            var e3 = L(), n2 = pt(), r2 = Function.prototype, o2 = e3 && Object.getOwnPropertyDescriptor, i2 = n2(r2, "name"), a2 = i2 && "something" === (function() {
            }).name, s2 = i2 && (!e3 || e3 && o2(r2, "name").configurable);
            t3.exports = { EXISTS: i2, PROPER: a2, CONFIGURABLE: s2 };
          }), ot = n.cw(function(e3) {
            var n2 = at(), r2 = t2();
            e3.exports = function(t3, e4, o2) {
              try {
                return n2(r2(Object.getOwnPropertyDescriptor(t3, e4)[o2]));
              } catch (t4) {
              }
            };
          }), it = n.cw(function(t3) {
            var e3 = O(), n2 = at();
            t3.exports = function(t4) {
              if ("Function" === e3(t4)) return n2(t4);
            };
          }), at = n.cw(function(t3) {
            var e3 = tt(), n2 = Function.prototype, r2 = n2.call, o2 = e3 && n2.bind.bind(r2, r2);
            t3.exports = e3 ? o2 : function(t4) {
              return function() {
                return r2.apply(t4, arguments);
              };
            };
          }), st = n.cw(function(t3) {
            var e3 = dt(), n2 = Et();
            t3.exports = function(t4, r2) {
              return arguments.length < 2 ? (o2 = e3[t4], n2(o2) ? o2 : void 0) : e3[t4] && e3[t4][r2];
              var o2;
            };
          }), ut = n.cw(function(t3) {
            var e3 = nt(), n2 = Et(), r2 = s(), o2 = Ue(), i2 = ct(), a2 = TypeError;
            t3.exports = function(t4, s2) {
              var u2 = arguments.length < 2 ? i2(t4) : s2;
              if (n2(u2)) return r2(e3(u2, t4));
              throw new a2(o2(t4) + " is not iterable");
            };
          }), ct = n.cw(function(t3) {
            var e3 = O(), n2 = It(), r2 = lt(), o2 = Ye()("iterator"), i2 = Array.prototype;
            t3.exports = function(t4) {
              if (!n2(t4)) return r2(t4, o2) || r2(t4, "@@iterator") || ("Arguments" === e3(t4) ? i2[o2] : void 0);
            };
          }), lt = n.cw(function(e3) {
            var n2 = t2(), r2 = It();
            e3.exports = function(t3, e4) {
              var o2 = t3[e4];
              return r2(o2) ? void 0 : n2(o2);
            };
          }), ft = n.cw(function(t3) {
            var e3 = at(), n2 = Le(), r2 = Math.floor, o2 = e3("".charAt), i2 = e3("".replace), a2 = e3("".slice), s2 = /\$([$&'`]|\d{1,2}|<[^>]*>)/g, u2 = /\$([$&'`]|\d{1,2})/g;
            t3.exports = function(t4, e4, c2, l2, f2, d2) {
              var p2 = c2 + t4.length, h2 = l2.length, v2 = u2;
              return void 0 !== f2 && (f2 = n2(f2), v2 = s2), i2(d2, v2, function(n3, i3) {
                var s3;
                switch (o2(i3, 0)) {
                  case "$":
                    return "$";
                  case "&":
                    return t4;
                  case "`":
                    return a2(e4, 0, c2);
                  case "'":
                    return a2(e4, p2);
                  case "<":
                    s3 = f2[a2(i3, 1, -1)];
                    break;
                  default:
                    var u3 = +i3;
                    if (0 === u3) return n3;
                    if (u3 > h2) {
                      var d3 = r2(u3 / 10);
                      return 0 === d3 ? n3 : d3 <= h2 ? void 0 === l2[d3 - 1] ? o2(i3, 1) : l2[d3 - 1] + o2(i3, 1) : n3;
                    }
                    s3 = l2[u3 - 1];
                }
                return void 0 === s3 ? "" : s3;
              });
            };
          }), dt = n.cw(function(t3) {
            var e3 = function(t4) {
              return t4 && t4.Math === Math && t4;
            };
            t3.exports = e3("object" == typeof globalThis && globalThis) || e3("object" == typeof window && window) || e3("object" == typeof self && self) || e3("object" == typeof n.g && n.g) || e3("object" == typeof this && this) || /* @__PURE__ */ (function() {
              return this;
            })() || Function("return this")();
          }), pt = n.cw(function(t3) {
            var e3 = at(), n2 = Le(), r2 = e3({}.hasOwnProperty);
            t3.exports = Object.hasOwn || function(t4, e4) {
              return r2(n2(t4), e4);
            };
          }), ht = n.cw(function(t3) {
            t3.exports = {};
          }), vt = n.cw(function(t3) {
            var e3 = st();
            t3.exports = e3("document", "documentElement");
          }), yt = n.cw(function(t3) {
            var e3 = L(), n2 = W(), r2 = B();
            t3.exports = !e3 && !n2(function() {
              return 7 !== Object.defineProperty(r2("div"), "a", { get: function() {
                return 7;
              } }).a;
            });
          }), gt = n.cw(function(t3) {
            var e3 = at(), n2 = W(), r2 = O(), o2 = Object, i2 = e3("".split);
            t3.exports = n2(function() {
              return !o2("z").propertyIsEnumerable(0);
            }) ? function(t4) {
              return "String" === r2(t4) ? i2(t4, "") : o2(t4);
            } : o2;
          }), mt = n.cw(function(t3) {
            var e3 = Et(), n2 = Ct(), r2 = re();
            t3.exports = function(t4, o2, i2) {
              var a2, s2;
              return r2 && e3(a2 = o2.constructor) && a2 !== i2 && n2(s2 = a2.prototype) && s2 !== i2.prototype && r2(t4, s2), t4;
            };
          }), bt = n.cw(function(t3) {
            var e3 = at(), n2 = Et(), r2 = Oe(), o2 = e3(Function.toString);
            n2(r2.inspectSource) || (r2.inspectSource = function(t4) {
              return o2(t4);
            }), t3.exports = r2.inspectSource;
          }), wt = n.cw(function(t3) {
            var e3, n2, r2, o2 = Ge(), i2 = dt(), a2 = Ct(), s2 = C(), u2 = pt(), c2 = Oe(), l2 = xe(), f2 = ht(), d2 = "Object already initialized", p2 = i2.TypeError, h2 = i2.WeakMap;
            if (o2 || c2.state) {
              var v2 = c2.state || (c2.state = new h2());
              v2.get = v2.get, v2.has = v2.has, v2.set = v2.set, e3 = function(t4, e4) {
                if (v2.has(t4)) throw new p2(d2);
                return e4.facade = t4, v2.set(t4, e4), e4;
              }, n2 = function(t4) {
                return v2.get(t4) || {};
              }, r2 = function(t4) {
                return v2.has(t4);
              };
            } else {
              var y2 = l2("state");
              f2[y2] = true, e3 = function(t4, e4) {
                if (u2(t4, y2)) throw new p2(d2);
                return e4.facade = t4, s2(t4, y2, e4), e4;
              }, n2 = function(t4) {
                return u2(t4, y2) ? t4[y2] : {};
              }, r2 = function(t4) {
                return u2(t4, y2);
              };
            }
            t3.exports = { set: e3, get: n2, has: r2, enforce: function(t4) {
              return r2(t4) ? n2(t4) : e3(t4, {});
            }, getterFor: function(t4) {
              return function(e4) {
                var r3;
                if (!a2(e4) || (r3 = n2(e4)).type !== t4) throw new p2("Incompatible receiver, " + t4 + " required");
                return r3;
              };
            } };
          }), xt = n.cw(function(t3) {
            var e3 = Ye(), n2 = Kt(), r2 = e3("iterator"), o2 = Array.prototype;
            t3.exports = function(t4) {
              return void 0 !== t4 && (n2.Array === t4 || o2[r2] === t4);
            };
          }), Ot = n.cw(function(t3) {
            var e3 = O();
            t3.exports = Array.isArray || function(t4) {
              return "Array" === e3(t4);
            };
          }), Et = n.cw(function(t3) {
            var e3 = "object" == typeof document && document.all;
            t3.exports = void 0 === e3 && void 0 !== e3 ? function(t4) {
              return "function" == typeof t4 || t4 === e3;
            } : function(t4) {
              return "function" == typeof t4;
            };
          }), St = n.cw(function(t3) {
            var e3 = at(), n2 = W(), r2 = Et(), o2 = E(), i2 = st(), a2 = bt(), s2 = function() {
            }, u2 = i2("Reflect", "construct"), c2 = /^\s*(?:class|function)\b/, l2 = e3(c2.exec), f2 = !c2.test(s2), d2 = function(t4) {
              if (!r2(t4)) return false;
              try {
                return u2(s2, [], t4), true;
              } catch (t5) {
                return false;
              }
            }, p2 = function(t4) {
              if (!r2(t4)) return false;
              switch (o2(t4)) {
                case "AsyncFunction":
                case "GeneratorFunction":
                case "AsyncGeneratorFunction":
                  return false;
              }
              try {
                return f2 || !!l2(c2, a2(t4));
              } catch (t5) {
                return true;
              }
            };
            p2.sham = true, t3.exports = !u2 || n2(function() {
              var t4;
              return d2(d2.call) || !d2(Object) || !d2(function() {
                t4 = true;
              }) || t4;
            }) ? p2 : d2;
          }), kt = n.cw(function(t3) {
            var e3 = W(), n2 = Et(), r2 = /#|\.prototype\./, o2 = function(t4, r3) {
              var o3 = a2[i2(t4)];
              return o3 === u2 || o3 !== s2 && (n2(r3) ? e3(r3) : !!r3);
            }, i2 = o2.normalize = function(t4) {
              return String(t4).replace(r2, ".").toLowerCase();
            }, a2 = o2.data = {}, s2 = o2.NATIVE = "N", u2 = o2.POLYFILL = "P";
            t3.exports = o2;
          }), Pt = n.cw(function(t3) {
            var e3 = Ct(), n2 = Math.floor;
            t3.exports = Number.isInteger || function(t4) {
              return !e3(t4) && isFinite(t4) && n2(t4) === t4;
            };
          }), It = function() {
            return n(117);
          }, Ct = n.cw(function(t3) {
            var e3 = Et();
            t3.exports = function(t4) {
              return "object" == typeof t4 ? null !== t4 : e3(t4);
            };
          }), At = n.cw(function(t3) {
            var e3 = Ct();
            t3.exports = function(t4) {
              return e3(t4) || null === t4;
            };
          }), Mt = n.cw(function(t3) {
            t3.exports = false;
          }), Dt = n.cw(function(t3) {
            var e3 = Ct(), n2 = wt().get;
            t3.exports = function(t4) {
              if (!e3(t4)) return false;
              var r2 = n2(t4);
              return !!r2 && "RawJSON" === r2.type;
            };
          }), Nt = n.cw(function(t3) {
            var e3 = Ct(), n2 = O(), r2 = Ye()("match");
            t3.exports = function(t4) {
              var o2;
              return e3(t4) && (void 0 !== (o2 = t4[r2]) ? !!o2 : "RegExp" === n2(t4));
            };
          }), Tt = n.cw(function(t3) {
            var e3 = st(), n2 = Et(), r2 = Qt(), o2 = $e(), i2 = Object;
            t3.exports = o2 ? function(t4) {
              return "symbol" == typeof t4;
            } : function(t4) {
              var o3 = e3("Symbol");
              return n2(o3) && r2(o3.prototype, i2(t4));
            };
          }), jt = n.cw(function(t3) {
            var e3 = nt(), n2 = s(), r2 = lt();
            t3.exports = function(t4, o2, i2) {
              var a2, s2;
              n2(t4);
              try {
                if (!(a2 = r2(t4, "return"))) {
                  if ("throw" === o2) throw i2;
                  return i2;
                }
                a2 = e3(a2, t4);
              } catch (t5) {
                s2 = true, a2 = t5;
              }
              if ("throw" === o2) throw i2;
              if (s2) throw a2;
              return n2(a2), i2;
            };
          }), Rt = n.cw(function(t3) {
            var e3 = Bt().IteratorPrototype, n2 = Jt(), r2 = A(), o2 = we(), i2 = Kt(), a2 = function() {
              return this;
            };
            t3.exports = function(t4, s2, u2, c2) {
              var l2 = s2 + " Iterator";
              return t4.prototype = n2(e3, { next: r2(+!c2, u2) }), o2(t4, l2, false, true), i2[l2] = a2, t4;
            };
          }), Lt = n.cw(function(t3) {
            var e3 = q(), n2 = nt(), r2 = Mt(), o2 = rt(), i2 = Et(), a2 = Rt(), s2 = Xt(), u2 = re(), c2 = we(), l2 = C(), f2 = T(), d2 = Ye(), p2 = Kt(), h2 = Bt(), v2 = o2.PROPER, y2 = o2.CONFIGURABLE, g2 = h2.IteratorPrototype, m2 = h2.BUGGY_SAFARI_ITERATORS, b2 = d2("iterator"), w2 = "keys", x2 = "values", O2 = "entries", E2 = function() {
              return this;
            };
            t3.exports = function(t4, o3, d3, h3, S2, k2, P2) {
              a2(d3, o3, h3);
              var I2, C2, A2, M2 = function(t5) {
                if (t5 === S2 && R2) return R2;
                if (!m2 && t5 && t5 in T2) return T2[t5];
                switch (t5) {
                  case w2:
                  case x2:
                  case O2:
                    return function() {
                      return new d3(this, t5);
                    };
                }
                return function() {
                  return new d3(this);
                };
              }, D2 = o3 + " Iterator", N2 = false, T2 = t4.prototype, j2 = T2[b2] || T2["@@iterator"] || S2 && T2[S2], R2 = !m2 && j2 || M2(S2), L2 = "Array" === o3 && T2.entries || j2;
              if (L2 && (I2 = s2(L2.call(new t4()))) !== Object.prototype && I2.next && (r2 || s2(I2) === g2 || (u2 ? u2(I2, g2) : i2(I2[b2]) || f2(I2, b2, E2)), c2(I2, D2, true, true), r2 && (p2[D2] = E2)), v2 && S2 === x2 && j2 && j2.name !== x2 && (!r2 && y2 ? l2(T2, "name", x2) : (N2 = true, R2 = function() {
                return n2(j2, this);
              })), S2) if (C2 = { values: M2(x2), keys: k2 ? R2 : M2(w2), entries: M2(O2) }, P2) for (A2 in C2) (m2 || N2 || !(A2 in T2)) && f2(T2, A2, C2[A2]);
              else e3({ target: o3, proto: true, forced: m2 || N2 }, C2);
              return r2 && !P2 || T2[b2] === R2 || f2(T2, b2, R2, { name: S2 }), p2[o3] = R2, C2;
            };
          }), Bt = n.cw(function(t3) {
            var e3, n2, r2, o2 = W(), i2 = Et(), a2 = Ct(), s2 = Jt(), u2 = Xt(), c2 = T(), l2 = Ye(), f2 = Mt(), d2 = l2("iterator"), p2 = false;
            [].keys && ("next" in (r2 = [].keys()) ? (n2 = u2(u2(r2))) !== Object.prototype && (e3 = n2) : p2 = true), !a2(e3) || o2(function() {
              var t4 = {};
              return e3[d2].call(t4) !== t4;
            }) ? e3 = {} : f2 && (e3 = s2(e3)), i2(e3[d2]) || c2(e3, d2, function() {
              return this;
            }), t3.exports = { IteratorPrototype: e3, BUGGY_SAFARI_ITERATORS: p2 };
          }), Kt = function() {
            return n(269);
          }, Ft = n.cw(function(t3) {
            var e3 = Re();
            t3.exports = function(t4) {
              return e3(t4.length);
            };
          }), _t = n.cw(function(t3) {
            var e3 = at(), n2 = W(), r2 = Et(), o2 = pt(), i2 = L(), a2 = rt().CONFIGURABLE, s2 = bt(), u2 = wt(), c2 = u2.enforce, l2 = u2.get, f2 = String, d2 = Object.defineProperty, p2 = e3("".slice), h2 = e3("".replace), v2 = e3([].join), y2 = i2 && !n2(function() {
              return 8 !== d2(function() {
              }, "length", { value: 8 }).length;
            }), g2 = String(String).split("String"), m2 = t3.exports = function(t4, e4, n3) {
              "Symbol(" === p2(f2(e4), 0, 7) && (e4 = "[" + h2(f2(e4), /^Symbol\(([^)]*)\).*$/, "$1") + "]"), n3 && n3.getter && (e4 = "get " + e4), n3 && n3.setter && (e4 = "set " + e4), (!o2(t4, "name") || a2 && t4.name !== e4) && (i2 ? d2(t4, "name", { value: e4, configurable: true }) : t4.name = e4), y2 && n3 && o2(n3, "arity") && t4.length !== n3.arity && d2(t4, "length", { value: n3.arity });
              try {
                n3 && o2(n3, "constructor") && n3.constructor ? i2 && d2(t4, "prototype", { writable: false }) : t4.prototype && (t4.prototype = void 0);
              } catch (t5) {
              }
              var r3 = c2(t4);
              return o2(r3, "source") || (r3.source = v2(g2, "string" == typeof e4 ? e4 : "")), t4;
            };
            Function.prototype.toString = m2(function() {
              return r2(this) && l2(this).source || s2(this);
            }, "toString");
          }), Ut = n.cw(function(t3) {
            var e3 = W();
            t3.exports = !e3(function() {
              var t4 = "9007199254740993", e4 = JSON.rawJSON(t4);
              return !JSON.isRawJSON(e4) || JSON.stringify(e4) !== t4;
            });
          }), Ht = n.cw(function(t3) {
            var e3 = Nt(), n2 = TypeError;
            t3.exports = function(t4) {
              if (e3(t4)) throw new n2("The method doesn't accept regular expressions");
              return t4;
            };
          }), $t = n.cw(function(t3) {
            var e3 = L(), n2 = at(), r2 = nt(), o2 = W(), i2 = te(), a2 = Wt(), s2 = ee(), u2 = Le(), c2 = gt(), l2 = Object.assign, f2 = Object.defineProperty, d2 = n2([].concat);
            t3.exports = !l2 || o2(function() {
              if (e3 && 1 !== l2({ b: 1 }, l2(f2({}, "a", { enumerable: true, get: function() {
                f2(this, "b", { value: 3, enumerable: false });
              } }), { b: 2 })).b) return true;
              var t4 = {}, n3 = {}, r3 = /* @__PURE__ */ Symbol("assign detection"), o3 = "abcdefghijklmnopqrst";
              return t4[r3] = 7, o3.split("").forEach(function(t5) {
                n3[t5] = t5;
              }), 7 !== l2({}, t4)[r3] || i2(l2({}, n3)).join("") !== o3;
            }) ? function(t4, n3) {
              for (var o3 = u2(t4), l3 = arguments.length, f3 = 1, p2 = a2.f, h2 = s2.f; l3 > f3; ) for (var v2, y2 = c2(arguments[f3++]), g2 = p2 ? d2(i2(y2), p2(y2)) : i2(y2), m2 = g2.length, b2 = 0; m2 > b2; ) v2 = g2[b2++], e3 && !r2(h2, y2, v2) || (o3[v2] = y2[v2]);
              return o3;
            } : l2;
          }), Jt = n.cw(function(t3) {
            var e3, n2 = s(), r2 = Gt(), o2 = U(), i2 = ht(), a2 = vt(), u2 = B(), c2 = xe(), l2 = "prototype", f2 = "script", d2 = c2("IE_PROTO"), p2 = function() {
            }, h2 = function(t4) {
              return "<" + f2 + ">" + t4 + "</" + f2 + ">";
            }, v2 = function(t4) {
              t4.write(h2("")), t4.close();
              var e4 = t4.parentWindow.Object;
              return t4 = null, e4;
            }, y2 = function() {
              try {
                e3 = new ActiveXObject("htmlfile");
              } catch (t5) {
              }
              var t4, n3, r3;
              y2 = "undefined" != typeof document ? document.domain && e3 ? v2(e3) : (n3 = u2("iframe"), r3 = "java" + f2 + ":", n3.style.display = "none", a2.appendChild(n3), n3.src = String(r3), (t4 = n3.contentWindow.document).open(), t4.write(h2("document.F=Object")), t4.close(), t4.F) : v2(e3);
              for (var i3 = o2.length; i3--; ) delete y2[l2][o2[i3]];
              return y2();
            };
            i2[d2] = true, t3.exports = Object.create || function(t4, e4) {
              var o3;
              return null !== t4 ? (p2[l2] = n2(t4), o3 = new p2(), p2[l2] = null, o3[d2] = t4) : o3 = y2(), void 0 === e4 ? o3 : r2.f(o3, e4);
            };
          }), Gt = n.cw(function(t3, e3) {
            var n2 = L(), r2 = Je(), o2 = Vt(), i2 = s(), a2 = Te(), u2 = te();
            e3.f = n2 && !r2 ? Object.defineProperties : function(t4, e4) {
              i2(t4);
              for (var n3, r3 = a2(e4), s2 = u2(e4), c2 = s2.length, l2 = 0; c2 > l2; ) o2.f(t4, n3 = s2[l2++], r3[n3]);
              return t4;
            };
          }), Vt = n.cw(function(t3, e3) {
            var n2 = L(), r2 = yt(), o2 = Je(), i2 = s(), a2 = Ke(), u2 = TypeError, c2 = Object.defineProperty, l2 = Object.getOwnPropertyDescriptor, f2 = "enumerable", d2 = "configurable", p2 = "writable";
            e3.f = n2 ? o2 ? function(t4, e4, n3) {
              if (i2(t4), e4 = a2(e4), i2(n3), "function" == typeof t4 && "prototype" === e4 && "value" in n3 && p2 in n3 && !n3[p2]) {
                var r3 = l2(t4, e4);
                r3 && r3[p2] && (t4[e4] = n3.value, n3 = { configurable: d2 in n3 ? n3[d2] : r3[d2], enumerable: f2 in n3 ? n3[f2] : r3[f2], writable: false });
              }
              return c2(t4, e4, n3);
            } : c2 : function(t4, e4, n3) {
              if (i2(t4), e4 = a2(e4), i2(n3), r2) try {
                return c2(t4, e4, n3);
              } catch (t5) {
              }
              if ("get" in n3 || "set" in n3) throw new u2("Accessors not supported");
              return "value" in n3 && (t4[e4] = n3.value), t4;
            };
          }), zt = n.cw(function(t3, e3) {
            var n2 = L(), r2 = nt(), o2 = ee(), i2 = A(), a2 = Te(), s2 = Ke(), u2 = pt(), c2 = yt(), l2 = Object.getOwnPropertyDescriptor;
            e3.f = n2 ? l2 : function(t4, e4) {
              if (t4 = a2(t4), e4 = s2(e4), c2) try {
                return l2(t4, e4);
              } catch (t5) {
              }
              if (u2(t4, e4)) return i2(!r2(o2.f, t4, e4), t4[e4]);
            };
          }), Yt = n.cw(function(t3) {
            var e3 = O(), n2 = Te(), r2 = qt().f, o2 = y(), i2 = "object" == typeof window && window && Object.getOwnPropertyNames ? Object.getOwnPropertyNames(window) : [];
            t3.exports.f = function(t4) {
              return i2 && "Window" === e3(t4) ? (function(t5) {
                try {
                  return r2(t5);
                } catch (t6) {
                  return o2(i2);
                }
              })(t4) : r2(n2(t4));
            };
          }), qt = n.cw(function(t3, e3) {
            var n2 = Zt(), r2 = U().concat("length", "prototype");
            e3.f = Object.getOwnPropertyNames || function(t4) {
              return n2(t4, r2);
            };
          }), Wt = function() {
            return n(717);
          }, Xt = n.cw(function(t3) {
            var e3 = pt(), n2 = Et(), r2 = Le(), o2 = xe(), i2 = P(), a2 = o2("IE_PROTO"), s2 = Object, u2 = s2.prototype;
            t3.exports = i2 ? s2.getPrototypeOf : function(t4) {
              var o3 = r2(t4);
              if (e3(o3, a2)) return o3[a2];
              var i3 = o3.constructor;
              return n2(i3) && o3 instanceof i3 ? i3.prototype : o3 instanceof s2 ? u2 : null;
            };
          }), Qt = n.cw(function(t3) {
            var e3 = at();
            t3.exports = e3({}.isPrototypeOf);
          }), Zt = n.cw(function(t3) {
            var e3 = at(), n2 = pt(), r2 = Te(), o2 = l().q, i2 = ht(), a2 = e3([].push);
            t3.exports = function(t4, e4) {
              var s2, u2 = r2(t4), c2 = 0, l2 = [];
              for (s2 in u2) !n2(i2, s2) && n2(u2, s2) && a2(l2, s2);
              for (; e4.length > c2; ) n2(u2, s2 = e4[c2++]) && (~o2(l2, s2) || a2(l2, s2));
              return l2;
            };
          }), te = n.cw(function(t3) {
            var e3 = Zt(), n2 = U();
            t3.exports = Object.keys || function(t4) {
              return e3(t4, n2);
            };
          }), ee = n.cw(function(t3, e3) {
            var n2 = {}.propertyIsEnumerable, r2 = Object.getOwnPropertyDescriptor, o2 = r2 && !n2.call({ 1: 2 }, 1);
            e3.f = o2 ? function(t4) {
              var e4 = r2(this, t4);
              return !!e4 && e4.enumerable;
            } : n2;
          }), ne = n.cw(function(t3) {
            var e3 = Mt(), n2 = dt(), r2 = W(), o2 = z();
            t3.exports = e3 || !r2(function() {
              if (!(o2 && o2 < 535)) {
                var t4 = Math.random();
                __defineSetter__.call(null, t4, function() {
                }), delete n2[t4];
              }
            });
          }), re = n.cw(function(t3) {
            var e3 = ot(), n2 = Ct(), r2 = me(), i2 = o();
            t3.exports = Object.setPrototypeOf || ("__proto__" in {} ? (function() {
              var t4, o2 = false, a2 = {};
              try {
                (t4 = e3(Object.prototype, "__proto__", "set"))(a2, []), o2 = a2 instanceof Array;
              } catch (t5) {
              }
              return function(e4, a3) {
                return r2(e4), i2(a3), n2(e4) ? (o2 ? t4(e4, a3) : e4.__proto__ = a3, e4) : e4;
              };
            })() : void 0);
          }), oe = n.cw(function(t3) {
            var e3 = Fe(), n2 = E();
            t3.exports = e3 ? {}.toString : function() {
              return "[object " + n2(this) + "]";
            };
          }), ie = n.cw(function(t3) {
            var e3 = nt(), n2 = Et(), r2 = Ct(), o2 = TypeError;
            t3.exports = function(t4, i2) {
              var a2, s2;
              if ("string" === i2 && n2(a2 = t4.toString) && !r2(s2 = e3(a2, t4))) return s2;
              if (n2(a2 = t4.valueOf) && !r2(s2 = e3(a2, t4))) return s2;
              if ("string" !== i2 && n2(a2 = t4.toString) && !r2(s2 = e3(a2, t4))) return s2;
              throw new o2("Can't convert object to primitive value");
            };
          }), ae = n.cw(function(t3) {
            var e3 = st(), n2 = at(), r2 = qt(), o2 = Wt(), i2 = s(), a2 = n2([].concat);
            t3.exports = e3("Reflect", "ownKeys") || function(t4) {
              var e4 = r2.f(i2(t4)), n3 = o2.f;
              return n3 ? a2(e4, n3(t4)) : e4;
            };
          }), se = n.cw(function(t3) {
            var e3 = at(), n2 = pt(), r2 = SyntaxError, o2 = parseInt, i2 = String.fromCharCode, a2 = e3("".charAt), s2 = e3("".slice), u2 = e3(/./.exec), c2 = { '\\"': '"', "\\\\": "\\", "\\/": "/", "\\b": "\b", "\\f": "\f", "\\n": "\n", "\\r": "\r", "\\t": "	" }, l2 = /^[\da-f]{4}$/i, f2 = /^[\u0000-\u001F]$/;
            t3.exports = function(t4, e4) {
              for (var d2 = true, p2 = ""; e4 < t4.length; ) {
                var h2 = a2(t4, e4);
                if ("\\" === h2) {
                  var v2 = s2(t4, e4, e4 + 2);
                  if (n2(c2, v2)) p2 += c2[v2], e4 += 2;
                  else {
                    if ("\\u" !== v2) throw new r2('Unknown escape sequence: "' + v2 + '"');
                    var y2 = s2(t4, e4 += 2, e4 + 4);
                    if (!u2(l2, y2)) throw new r2("Bad Unicode escape at: " + e4);
                    p2 += i2(o2(y2, 16)), e4 += 4;
                  }
                } else {
                  if ('"' === h2) {
                    d2 = false, e4++;
                    break;
                  }
                  if (u2(f2, h2)) throw new r2("Bad control character in string literal at: " + e4);
                  p2 += h2, e4++;
                }
              }
              if (d2) throw new r2("Unterminated string at: " + e4);
              return { value: p2, end: e4 };
            };
          }), ue = n.cw(function(t3) {
            var e3 = dt();
            t3.exports = e3;
          }), ce = n.cw(function(t3) {
            var e3 = Vt().f;
            t3.exports = function(t4, n2, r2) {
              r2 in t4 || e3(t4, r2, { configurable: true, get: function() {
                return n2[r2];
              }, set: function(t5) {
                n2[r2] = t5;
              } });
            };
          }), le = n.cw(function(t3) {
            var e3 = nt(), n2 = s(), r2 = Et(), o2 = O(), i2 = fe(), a2 = TypeError;
            t3.exports = function(t4, s2) {
              var u2 = t4.exec;
              if (r2(u2)) {
                var c2 = e3(u2, t4, s2);
                return null !== c2 && n2(c2), c2;
              }
              if ("RegExp" === o2(t4)) return e3(i2, t4, s2);
              throw new a2("RegExp#exec called on incompatible receiver");
            };
          }), fe = n.cw(function(t3) {
            var e3, n2, r2 = nt(), o2 = at(), i2 = _e(), a2 = pe(), s2 = ve(), u2 = Ee(), c2 = Jt(), l2 = wt().get, f2 = ye(), d2 = ge(), p2 = u2("native-string-replace", String.prototype.replace), h2 = RegExp.prototype.exec, v2 = h2, y2 = o2("".charAt), g2 = o2("".indexOf), m2 = o2("".replace), b2 = o2("".slice), w2 = (n2 = /b*/g, r2(h2, e3 = /a/, "a"), r2(h2, n2, "a"), 0 !== e3.lastIndex || 0 !== n2.lastIndex), x2 = s2.BROKEN_CARET, O2 = void 0 !== /()??/.exec("")[1], E2 = function(t4, e4) {
              for (var n3 = t4.groups = c2(null), r3 = 0; r3 < e4.length; r3++) {
                var o3 = e4[r3];
                n3[o3[0]] = t4[o3[1]];
              }
            };
            (w2 || O2 || x2 || f2 || d2) && (v2 = function(t4) {
              var e4, n3, o3, s3 = this, u3 = l2(s3), c3 = i2(t4), f3 = u3.raw;
              if (f3) return f3.lastIndex = s3.lastIndex, e4 = r2(v2, f3, c3), s3.lastIndex = f3.lastIndex, e4 && u3.groups && E2(e4, u3.groups), e4;
              var d3 = u3.groups, S2 = x2 && s3.sticky, k2 = r2(a2, s3), P2 = s3.source, I2 = 0, C2 = c3;
              if (S2) {
                k2 = m2(k2, "y", ""), -1 === g2(k2, "g") && (k2 += "g"), C2 = b2(c3, s3.lastIndex);
                var A2 = s3.lastIndex > 0 && y2(c3, s3.lastIndex - 1);
                s3.lastIndex > 0 && (!s3.multiline || s3.multiline && "\n" !== A2 && "\r" !== A2 && "\u2028" !== A2 && "\u2029" !== A2) && (P2 = "(?: (?:" + P2 + "))", C2 = " " + C2, I2++), n3 = new RegExp("^(?:" + P2 + ")", k2);
              }
              O2 && (n3 = new RegExp("^" + P2 + "$(?!\\s)", k2)), w2 && (o3 = s3.lastIndex);
              var M2 = r2(h2, S2 ? n3 : s3, C2);
              return S2 ? M2 ? (M2.input = c3, M2[0] = b2(M2[0], I2), M2.index = s3.lastIndex, s3.lastIndex += M2[0].length) : s3.lastIndex = 0 : w2 && M2 && (s3.lastIndex = s3.global ? M2.index + M2[0].length : o3), O2 && M2 && M2.length > 1 && r2(p2, M2[0], n3, function() {
                for (var t5 = 1; t5 < arguments.length - 2; t5++) void 0 === arguments[t5] && (M2[t5] = void 0);
              }), M2 && d3 && E2(M2, d3), M2;
            }), t3.exports = v2;
          }), de = n.cw(function(t3) {
            var e3 = dt(), n2 = W(), r2 = e3.RegExp, o2 = !n2(function() {
              var t4 = true;
              try {
                r2(".", "d");
              } catch (e5) {
                t4 = false;
              }
              var e4 = {}, n3 = "", o3 = t4 ? "dgimsy" : "gimsy", i2 = function(t5, r3) {
                Object.defineProperty(e4, t5, { get: function() {
                  return n3 += r3, true;
                } });
              }, a2 = { dotAll: "s", global: "g", ignoreCase: "i", multiline: "m", sticky: "y" };
              for (var s2 in t4 && (a2.hasIndices = "d"), a2) i2(s2, a2[s2]);
              return Object.getOwnPropertyDescriptor(r2.prototype, "flags").get.call(e4) !== o3 || n3 !== o3;
            });
            t3.exports = { correct: o2 };
          }), pe = n.cw(function(t3) {
            var e3 = s();
            t3.exports = function() {
              var t4 = e3(this), n2 = "";
              return t4.hasIndices && (n2 += "d"), t4.global && (n2 += "g"), t4.ignoreCase && (n2 += "i"), t4.multiline && (n2 += "m"), t4.dotAll && (n2 += "s"), t4.unicode && (n2 += "u"), t4.unicodeSets && (n2 += "v"), t4.sticky && (n2 += "y"), n2;
            };
          }), he = n.cw(function(t3) {
            var e3 = nt(), n2 = pt(), r2 = Qt(), o2 = de(), i2 = pe(), a2 = RegExp.prototype;
            t3.exports = o2.correct ? function(t4) {
              return t4.flags;
            } : function(t4) {
              return o2.correct || !r2(a2, t4) || n2(t4, "flags") ? t4.flags : e3(i2, t4);
            };
          }), ve = n.cw(function(t3) {
            var e3 = W(), n2 = dt().RegExp, r2 = e3(function() {
              var t4 = n2("a", "y");
              return t4.lastIndex = 2, null !== t4.exec("abcd");
            }), o2 = r2 || e3(function() {
              return !n2("a", "y").sticky;
            }), i2 = r2 || e3(function() {
              var t4 = n2("^r", "gy");
              return t4.lastIndex = 2, null !== t4.exec("str");
            });
            t3.exports = { BROKEN_CARET: i2, MISSED_STICKY: o2, UNSUPPORTED_Y: r2 };
          }), ye = n.cw(function(t3) {
            var e3 = W(), n2 = dt().RegExp;
            t3.exports = e3(function() {
              var t4 = n2(".", "s");
              return !(t4.dotAll && t4.test("\n") && "s" === t4.flags);
            });
          }), ge = n.cw(function(t3) {
            var e3 = W(), n2 = dt().RegExp;
            t3.exports = e3(function() {
              var t4 = n2("(?<a>b)", "g");
              return "b" !== t4.exec("b").groups.a || "bc" !== "b".replace(t4, "$<a>c");
            });
          }), me = n.cw(function(t3) {
            var e3 = It(), n2 = TypeError;
            t3.exports = function(t4) {
              if (e3(t4)) throw new n2("Can't call method on " + t4);
              return t4;
            };
          }), be = n.cw(function(t3) {
            var e3 = st(), n2 = N(), r2 = Ye(), o2 = L(), i2 = r2("species");
            t3.exports = function(t4) {
              var r3 = e3(t4);
              o2 && r3 && !r3[i2] && n2(r3, i2, { configurable: true, get: function() {
                return this;
              } });
            };
          }), we = n.cw(function(t3) {
            var e3 = Vt().f, n2 = pt(), r2 = Ye()("toStringTag");
            t3.exports = function(t4, o2, i2) {
              t4 && !i2 && (t4 = t4.prototype), t4 && !n2(t4, r2) && e3(t4, r2, { configurable: true, value: o2 });
            };
          }), xe = n.cw(function(t3) {
            var e3 = Ee(), n2 = He(), r2 = e3("keys");
            t3.exports = function(t4) {
              return r2[t4] || (r2[t4] = n2(t4));
            };
          }), Oe = n.cw(function(t3) {
            var e3 = Mt(), n2 = dt(), r2 = j(), o2 = "__core-js_shared__", i2 = t3.exports = n2[o2] || r2(o2, {});
            (i2.versions || (i2.versions = [])).push({ version: "3.51.0", mode: e3 ? "pure" : "global", copyright: "© 2013–2025 Denis Pushkarev (zloirock.ru), 2025–2026 CoreJS Company (core-js.io). All rights reserved.", license: "https://github.com/zloirock/core-js/blob/v3.51.0/LICENSE", source: "https://github.com/zloirock/core-js" });
          }), Ee = n.cw(function(t3) {
            var e3 = Oe(), n2 = Object.create || Object;
            t3.exports = function(t4, r2) {
              return e3[t4] || (e3[t4] = r2 || n2(null));
            };
          }), Se = n.cw(function(t3) {
            var n2 = s(), r2 = e2(), o2 = It(), i2 = Ye()("species");
            t3.exports = function(t4, e3) {
              var a2, s2 = n2(t4).constructor;
              return void 0 === s2 || o2(a2 = n2(s2)[i2]) ? e3 : r2(a2);
            };
          }), ke = n.cw(function(t3) {
            var e3 = at(), n2 = je(), r2 = _e(), o2 = me(), i2 = e3("".charAt), a2 = e3("".charCodeAt), s2 = e3("".slice), u2 = function(t4) {
              return function(e4, u3) {
                var c2, l2, f2 = r2(o2(e4)), d2 = n2(u3), p2 = f2.length;
                return d2 < 0 || d2 >= p2 ? t4 ? "" : void 0 : (c2 = a2(f2, d2)) < 55296 || c2 > 56319 || d2 + 1 === p2 || (l2 = a2(f2, d2 + 1)) < 56320 || l2 > 57343 ? t4 ? i2(f2, d2) : c2 : t4 ? s2(f2, d2, d2 + 2) : l2 - 56320 + (c2 - 55296 << 10) + 65536;
              };
            };
            t3.exports = { codeAt: u2(false), o: u2(true) };
          }), Pe = n.cw(function(t3) {
            var e3 = rt().PROPER, n2 = W(), r2 = qe();
            t3.exports = function(t4) {
              return n2(function() {
                return !!r2[t4]() || "​᠎" !== "​᠎"[t4]() || e3 && r2[t4].name !== t4;
              });
            };
          }), Ie = n.cw(function(t3) {
            var e3 = at(), n2 = me(), r2 = _e(), o2 = qe(), i2 = e3("".replace), a2 = RegExp("^[" + o2 + "]+"), s2 = RegExp("(^|[^" + o2 + "])[" + o2 + "]+$"), u2 = function(t4) {
              return function(e4) {
                var o3 = r2(n2(e4));
                return 1 & t4 && (o3 = i2(o3, a2, "")), 2 & t4 && (o3 = i2(o3, s2, "$1")), o3;
              };
            };
            t3.exports = { start: u2(1), end: u2(2), Bq: u2(3) };
          }), Ce = n.cw(function(t3) {
            var e3 = V(), n2 = W(), r2 = dt().String;
            t3.exports = !!Object.getOwnPropertySymbols && !n2(function() {
              var t4 = /* @__PURE__ */ Symbol("symbol detection");
              return !r2(t4) || !(Object(t4) instanceof Symbol) || !Symbol.sham && e3 && e3 < 41;
            });
          }), Ae = n.cw(function(t3) {
            var e3 = nt(), n2 = st(), r2 = Ye(), o2 = T();
            t3.exports = function() {
              var t4 = n2("Symbol"), i2 = t4 && t4.prototype, a2 = i2 && i2.valueOf, s2 = r2("toPrimitive");
              i2 && !i2[s2] && o2(i2, s2, function(t5) {
                return e3(a2, this);
              }, { arity: 1 });
            };
          }), Me = n.cw(function(t3) {
            var e3 = Ce();
            t3.exports = e3 && !!Symbol.for && !!Symbol.keyFor;
          }), De = n.cw(function(t3) {
            var e3 = at();
            t3.exports = e3(1.1.valueOf);
          }), Ne = n.cw(function(t3) {
            var e3 = je(), n2 = Math.max, r2 = Math.min;
            t3.exports = function(t4, o2) {
              var i2 = e3(t4);
              return i2 < 0 ? n2(i2 + o2, 0) : r2(i2, o2);
            };
          }), Te = n.cw(function(t3) {
            var e3 = gt(), n2 = me();
            t3.exports = function(t4) {
              return e3(n2(t4));
            };
          }), je = n.cw(function(t3) {
            var e3 = n(741);
            t3.exports = function(t4) {
              var n2 = +t4;
              return n2 != n2 || 0 === n2 ? 0 : e3(n2);
            };
          }), Re = n.cw(function(t3) {
            var e3 = je(), n2 = Math.min;
            t3.exports = function(t4) {
              var r2 = e3(t4);
              return r2 > 0 ? n2(r2, 9007199254740991) : 0;
            };
          }), Le = n.cw(function(t3) {
            var e3 = me(), n2 = Object;
            t3.exports = function(t4) {
              return n2(e3(t4));
            };
          }), Be = n.cw(function(t3) {
            var e3 = nt(), n2 = Ct(), r2 = Tt(), o2 = lt(), i2 = ie(), a2 = Ye(), s2 = TypeError, u2 = a2("toPrimitive");
            t3.exports = function(t4, a3) {
              if (!n2(t4) || r2(t4)) return t4;
              var c2, l2 = o2(t4, u2);
              if (l2) {
                if (void 0 === a3 && (a3 = "default"), c2 = e3(l2, t4, a3), !n2(c2) || r2(c2)) return c2;
                throw new s2("Can't convert object to primitive value");
              }
              return void 0 === a3 && (a3 = "number"), i2(t4, a3);
            };
          }), Ke = n.cw(function(t3) {
            var e3 = Be(), n2 = Tt();
            t3.exports = function(t4) {
              var r2 = e3(t4, "string");
              return n2(r2) ? r2 : r2 + "";
            };
          }), Fe = n.cw(function(t3) {
            var e3 = {};
            e3[Ye()("toStringTag")] = "z", t3.exports = "[object z]" === String(e3);
          }), _e = n.cw(function(t3) {
            var e3 = E(), n2 = String;
            t3.exports = function(t4) {
              if ("Symbol" === e3(t4)) throw new TypeError("Cannot convert a Symbol value to a string");
              return n2(t4);
            };
          }), Ue = function() {
            return n(823);
          }, He = n.cw(function(t3) {
            var e3 = at(), n2 = 0, r2 = Math.random(), o2 = e3(1.1.toString);
            t3.exports = function(t4) {
              return "Symbol(" + (void 0 === t4 ? "" : t4) + ")_" + o2(++n2 + r2, 36);
            };
          }), $e = n.cw(function(t3) {
            var e3 = Ce();
            t3.exports = e3 && !Symbol.sham && "symbol" == typeof Symbol.iterator;
          }), Je = n.cw(function(t3) {
            var e3 = L(), n2 = W();
            t3.exports = e3 && n2(function() {
              return 42 !== Object.defineProperty(function() {
              }, "prototype", { value: 42, writable: false }).prototype;
            });
          }), Ge = n.cw(function(t3) {
            var e3 = dt(), n2 = Et(), r2 = e3.WeakMap;
            t3.exports = n2(r2) && /native code/.test(String(r2));
          }), Ve = n.cw(function(t3) {
            var e3 = ue(), n2 = pt(), r2 = ze(), o2 = Vt().f;
            t3.exports = function(t4) {
              var i2 = e3.Symbol || (e3.Symbol = {});
              n2(i2, t4) || o2(i2, t4, { value: r2.f(t4) });
            };
          }), ze = n.cw(function(t3, e3) {
            var n2 = Ye();
            e3.f = n2;
          }), Ye = n.cw(function(t3) {
            var e3 = dt(), n2 = Ee(), r2 = pt(), o2 = He(), i2 = Ce(), a2 = $e(), s2 = e3.Symbol, u2 = n2("wks"), c2 = a2 ? s2.for || s2 : s2 && s2.withoutSetter || o2;
            t3.exports = function(t4) {
              return r2(u2, t4) || (u2[t4] = i2 && r2(s2, t4) ? s2[t4] : c2("Symbol." + t4)), u2[t4];
            };
          }), qe = n.cw(function(t3) {
            t3.exports = "	\n\v\f\r                　\u2028\u2029\uFEFF";
          }), We = n.cw(function() {
            var t3 = q(), e3 = W(), n2 = Ot(), r2 = Ct(), o2 = Le(), i2 = Ft(), a2 = K(), s2 = M(), u2 = v(), c2 = b(), l2 = d(), f2 = Ye(), p2 = V(), h2 = f2("isConcatSpreadable"), y2 = p2 >= 51 || !e3(function() {
              var t4 = [];
              return t4[h2] = false, t4.concat()[0] !== t4;
            }), g2 = function(t4) {
              if (!r2(t4)) return false;
              var e4 = t4[h2];
              return void 0 !== e4 ? !!e4 : n2(t4);
            };
            t3({ target: "Array", proto: true, arity: 1, forced: !y2 || !l2("concat") }, { concat: function(t4) {
              var e4, n3, r3, l3, f3, d2 = o2(this), p3 = c2(d2, 0), h3 = 0;
              for (e4 = -1, r3 = arguments.length; e4 < r3; e4++) if (g2(f3 = -1 === e4 ? d2 : arguments[e4])) for (l3 = i2(f3), a2(h3 + l3), n3 = 0; n3 < l3; n3++, h3++) n3 in f3 && s2(p3, h3, f3[n3]);
              else a2(h3 + 1), s2(p3, h3++, f3);
              return u2(p3, h3), p3;
            } });
          }), Xe = n.cw(function() {
            var t3 = q(), e3 = f().pb;
            t3({ target: "Array", proto: true, forced: !d()("filter") }, { filter: function(t4) {
              return e3(this, t4, arguments.length > 1 ? arguments[1] : void 0);
            } });
          }), Qe = n.cw(function() {
            var t3 = q(), e3 = c();
            t3({ target: "Array", stat: true, forced: !x()(function(t4) {
              Array.from(t4);
            }) }, { from: e3 });
          }), Ze = n.cw(function() {
            var t3 = q(), e3 = l().m, n2 = W(), r2 = i(), o2 = n2(function() {
              return !Array(1).includes();
            }), a2 = n2(function() {
              return [, 1].includes(void 0, 1);
            });
            t3({ target: "Array", proto: true, forced: o2 || a2 }, { includes: function(t4) {
              return e3(this, t4, arguments.length > 1 ? arguments[1] : void 0);
            } }), r2("includes");
          }), tn = n.cw(function() {
            var t3 = q(), e3 = it(), n2 = l().q, r2 = p(), o2 = e3([].indexOf), i2 = !!o2 && 1 / o2([1], 1, -0) < 0;
            t3({ target: "Array", proto: true, forced: i2 || !r2("indexOf") }, { indexOf: function(t4) {
              var e4 = arguments.length > 1 ? arguments[1] : void 0;
              return i2 ? o2(this, t4, e4) || 0 : n2(this, t4, e4);
            } });
          }), en = n.cw(function(t3) {
            var e3 = Te(), n2 = i(), r2 = Kt(), o2 = wt(), a2 = Vt().f, s2 = Lt(), u2 = I(), c2 = Mt(), l2 = L(), f2 = "Array Iterator", d2 = o2.set, p2 = o2.getterFor(f2);
            t3.exports = s2(Array, "Array", function(t4, n3) {
              d2(this, { type: f2, target: e3(t4), index: 0, kind: n3 });
            }, function() {
              var t4 = p2(this), e4 = t4.target, n3 = t4.index++;
              if (!e4 || n3 >= e4.length) return t4.target = null, u2(void 0, true);
              switch (t4.kind) {
                case "keys":
                  return u2(n3, false);
                case "values":
                  return u2(e4[n3], false);
              }
              return u2([n3, e4[n3]], false);
            }, "values");
            var h2 = r2.Arguments = r2.Array;
            if (n2("keys"), n2("values"), n2("entries"), !c2 && l2 && "values" !== h2.name) try {
              a2(h2, "name", { value: "values" });
            } catch (t4) {
            }
          }), nn = n.cw(function() {
            var t3 = q(), e3 = at(), n2 = gt(), r2 = Te(), o2 = p(), i2 = e3([].join);
            t3({ target: "Array", proto: true, forced: n2 !== Object || !o2("join", ",") }, { join: function(t4) {
              return i2(r2(this), void 0 === t4 ? "," : t4);
            } });
          }), rn = n.cw(function() {
            var t3 = q(), e3 = f().Tj;
            t3({ target: "Array", proto: true, forced: !d()("map") }, { map: function(t4) {
              return e3(this, t4, arguments.length > 1 ? arguments[1] : void 0);
            } });
          }), on = n.cw(function() {
            var t3 = q(), e3 = h().k, n2 = p(), r2 = V();
            t3({ target: "Array", proto: true, forced: !J() && r2 > 79 && r2 < 83 || !n2("reduce") }, { reduce: function(t4) {
              var n3 = arguments.length;
              return e3(this, t4, n3, n3 > 1 ? arguments[1] : void 0);
            } });
          }), an = n.cw(function() {
            var t3 = q(), e3 = Ot(), n2 = St(), r2 = Ct(), o2 = Ne(), i2 = Ft(), a2 = Te(), s2 = M(), u2 = v(), c2 = Ye(), l2 = d(), f2 = y(), p2 = l2("slice"), h2 = c2("species"), g2 = Array, m2 = Math.max;
            t3({ target: "Array", proto: true, forced: !p2 }, { slice: function(t4, c3) {
              var l3, d2, p3, v2 = a2(this), y2 = i2(v2), b2 = o2(t4, y2), w2 = o2(void 0 === c3 ? y2 : c3, y2);
              if (e3(v2) && (l3 = v2.constructor, (n2(l3) && (l3 === g2 || e3(l3.prototype)) || r2(l3) && null === (l3 = l3[h2])) && (l3 = void 0), l3 === g2 || void 0 === l3)) return f2(v2, b2, w2);
              for (d2 = new (void 0 === l3 ? g2 : l3)(m2(w2 - b2, 0)), p3 = 0; b2 < w2; b2++, p3++) b2 in v2 && s2(d2, p3, v2[b2]);
              return u2(d2, p3), d2;
            } });
          }), sn = n.cw(function() {
            var e3 = q(), n2 = at(), r2 = t2(), o2 = Le(), i2 = Ft(), a2 = R(), s2 = _e(), u2 = W(), c2 = g(), l2 = p(), f2 = H(), d2 = $(), h2 = V(), v2 = z(), y2 = [], m2 = n2(y2.sort), b2 = n2(y2.push), w2 = u2(function() {
              y2.sort(void 0);
            }), x2 = u2(function() {
              y2.sort(null);
            }), O2 = l2("sort"), E2 = !u2(function() {
              if (h2) return h2 < 70;
              if (!(f2 && f2 > 3)) {
                if (d2) return true;
                if (v2) return v2 < 603;
                var t3, e4, n3, r3, o3 = "";
                for (t3 = 65; t3 < 76; t3++) {
                  switch (e4 = String.fromCharCode(t3), t3) {
                    case 66:
                    case 69:
                    case 70:
                    case 72:
                      n3 = 3;
                      break;
                    case 68:
                    case 71:
                      n3 = 4;
                      break;
                    default:
                      n3 = 2;
                  }
                  for (r3 = 0; r3 < 47; r3++) y2.push({ k: e4 + r3, v: n3 });
                }
                for (y2.sort(function(t4, e5) {
                  return e5.v - t4.v;
                }), r3 = 0; r3 < y2.length; r3++) e4 = y2[r3].k.charAt(0), o3.charAt(o3.length - 1) !== e4 && (o3 += e4);
                return "DGBEFHACIJK" !== o3;
              }
            });
            e3({ target: "Array", proto: true, forced: w2 || !x2 || !O2 || !E2 }, { sort: function(t3) {
              void 0 !== t3 && r2(t3);
              var e4 = o2(this);
              if (E2) return void 0 === t3 ? m2(e4) : m2(e4, t3);
              var n3, u3, l3 = [], f3 = i2(e4);
              for (u3 = 0; u3 < f3; u3++) u3 in e4 && b2(l3, e4[u3]);
              for (c2(l3, /* @__PURE__ */ (function(t4) {
                return function(e5, n4) {
                  if (void 0 === n4) return -1;
                  if (void 0 === e5) return 1;
                  if (void 0 !== t4) return +t4(e5, n4) || 0;
                  var r3 = s2(e5), o3 = s2(n4);
                  return r3 === o3 ? 0 : r3 > o3 ? 1 : -1;
                };
              })(t3)), n3 = i2(l3), u3 = 0; u3 < n3; ) e4[u3] = l3[u3++];
              for (; u3 < f3; ) a2(e4, u3++);
              return e4;
            } });
          }), un = n.cw(function() {
            var t3 = q(), e3 = Le(), n2 = Ne(), r2 = je(), o2 = Ft(), i2 = v(), a2 = K(), s2 = b(), u2 = M(), c2 = R(), l2 = d()("splice"), f2 = Math.max, p2 = Math.min;
            t3({ target: "Array", proto: true, forced: !l2 }, { splice: function(t4, l3) {
              var d2, h2, v2, y2, g2, m2, b2 = e3(this), w2 = o2(b2), x2 = n2(t4, w2), O2 = arguments.length;
              for (0 === O2 ? d2 = h2 = 0 : 1 === O2 ? (d2 = 0, h2 = w2 - x2) : (d2 = O2 - 2, h2 = p2(f2(r2(l3), 0), w2 - x2)), a2(w2 + d2 - h2), v2 = s2(b2, h2), y2 = 0; y2 < h2; y2++) (g2 = x2 + y2) in b2 && u2(v2, y2, b2[g2]);
              if (i2(v2, h2), d2 < h2) {
                for (y2 = x2; y2 < w2 - h2; y2++) m2 = y2 + d2, (g2 = y2 + h2) in b2 ? b2[m2] = b2[g2] : c2(b2, m2);
                for (y2 = w2; y2 > w2 - h2 + d2; y2--) c2(b2, y2 - 1);
              } else if (d2 > h2) for (y2 = w2 - h2; y2 > x2; y2--) m2 = y2 + d2 - 1, (g2 = y2 + h2 - 1) in b2 ? b2[m2] = b2[g2] : c2(b2, m2);
              for (y2 = 0; y2 < d2; y2++) b2[y2 + x2] = arguments[y2 + 2];
              return i2(b2, w2 - h2 + d2), v2;
            } });
          }), cn = n.cw(function() {
            var t3 = q(), e3 = W(), n2 = Le(), r2 = Be();
            t3({ target: "Date", proto: true, forced: e3(function() {
              return null !== (/* @__PURE__ */ new Date(NaN)).toJSON() || 1 !== Date.prototype.toJSON.call({ toISOString: function() {
                return 1;
              } });
            }) }, { toJSON: function(t4) {
              var e4 = n2(this), o2 = r2(e4, "number");
              return "number" != typeof o2 || isFinite(o2) ? e4.toISOString() : null;
            } });
          }), ln = n.cw(function() {
            var t3 = pt(), e3 = T(), n2 = D(), r2 = Ye()("toPrimitive"), o2 = Date.prototype;
            t3(o2, r2) || e3(o2, r2, n2);
          }), fn2 = n.cw(function() {
            var t3 = L(), e3 = rt().EXISTS, n2 = at(), r2 = N(), o2 = Function.prototype, i2 = n2(o2.toString), a2 = /function\b(?:\s|\/\*[\S\s]*?\*\/|\/\/[^\n\r]*[\n\r]+)*([^\s(/]*)/, s2 = n2(a2.exec);
            t3 && !e3 && r2(o2, "name", { configurable: true, get: function() {
              try {
                return s2(a2, i2(this))[1];
              } catch (t4) {
                return "";
              }
            } });
          }), dn = n.cw(function() {
            var t3 = q(), e3 = st(), n2 = nt(), r2 = at(), o2 = W(), i2 = Ot(), a2 = Et(), s2 = Ct(), u2 = Jt(), c2 = Dt(), f2 = Tt(), d2 = O(), p2 = De(), h2 = l().m, v2 = pt(), y2 = _e(), g2 = se(), m2 = He(), b2 = Ce(), w2 = Ut(), x2 = String, E2 = TypeError, S2 = e3("JSON", "stringify"), k2 = e3("BigInt"), P2 = r2("".valueOf), I2 = r2(true.valueOf), C2 = k2 && r2(k2.prototype.valueOf), A2 = r2(/./.exec), M2 = r2("".charAt), D2 = r2("".charCodeAt), N2 = r2("".replace), T2 = r2("".slice), j2 = r2([].push), R2 = r2([].pop), L2 = r2(1.1.toString), B2 = /[\uD800-\uDFFF]/g, K2 = /^[\uD800-\uDBFF]$/, F2 = /^[\uDC00-\uDFFF]$/, _2 = /^\d+$/, U2 = m2(), H2 = m2(), $2 = m2(), J2 = U2.length, G2 = H2.length, V2 = !b2 || o2(function() {
              var t4 = e3("Symbol")("stringify detection");
              return "[null]" !== S2([t4]) || "{}" !== S2({ a: t4 }) || "{}" !== S2(Object(t4));
            }), z2 = o2(function() {
              return '"\\udf06\\ud834"' !== S2("\uDF06\uD834") || '"\\udead"' !== S2("\uDEAD");
            }), Y2 = w2 ? e3("JSON", "isRawJSON") : c2, X2 = V2 ? function(t4, e4, r3) {
              return S2(t4, function(t5, r4) {
                var o3 = n2(e4, this, t5, r4);
                if (!f2(o3)) return o3;
              }, r3);
            } : S2, Q2 = function(t4, e4, n3) {
              var r3 = M2(n3, e4 - 1), o3 = M2(n3, e4 + 1);
              return A2(K2, t4) && !A2(F2, o3) || A2(F2, t4) && !A2(K2, r3) ? "\\u" + L2(D2(t4, 0), 16) : t4;
            }, Z2 = function(t4, e4) {
              try {
                return t4(e4), true;
              } catch (t5) {
                return false;
              }
            }, tt2 = function(t4) {
              if (!s2(t4) || a2(t4) || i2(t4)) return false;
              try {
                return !(function(t5) {
                  var e4 = d2(t5);
                  return "Number" === e4 && Z2(p2, t5) || "String" === e4 && Z2(P2, t5) || "Boolean" === e4 && Z2(I2, t5) || !!C2 && "BigInt" === e4 && Z2(C2, t5);
                })(t4);
              } catch (t5) {
                return true;
              }
            }, et2 = function(t4, e4) {
              return { toJSON: function() {
                var r3 = t4[e4];
                if (s2(r3) || "bigint" == typeof r3) {
                  var o3 = r3.toJSON;
                  a2(o3) && (r3 = n2(o3, r3, e4));
                }
                return r3;
              } };
            };
            S2 && t3({ target: "JSON", stat: true, arity: 3, forced: V2 || z2 || !w2 }, { stringify: function(t4, e4, r3) {
              var o3, s3 = a2(e4) ? e4 : void 0, c3 = s3 ? void 0 : (function(t5) {
                if (i2(t5)) {
                  for (var e5 = t5.length, n3 = [], r4 = u2(null), o4 = 0; o4 < e5; o4++) {
                    var a3, s4 = t5[o4];
                    if ("string" == typeof s4) a3 = s4;
                    else {
                      if ("number" != typeof s4 && "Number" !== d2(s4) && "String" !== d2(s4)) continue;
                      a3 = y2(s4);
                    }
                    v2(r4, a3) || (r4[a3] = true, j2(n3, a3));
                  }
                  return n3;
                }
              })(e4), l2 = c3 && (function(t5) {
                for (var e5 = 0, n3 = t5.length; e5 < n3; e5++) if (A2(_2, t5[e5])) return H2;
                return "";
              })(c3), f3 = [], p3 = [], m3 = [], b3 = false, O2 = true, S3 = X2(t4, function(t5, e5) {
                if (t5 = x2(t5), c3) {
                  if (t5 === $2) return R2(p3), void (o3 = R2(m3));
                  if (O2) O2 = false;
                  else if (this !== o3 && !i2(this) && !h2(c3, t5)) return;
                } else s3 && (e5 = n2(s3, this, t5, e5));
                if (Y2(e5)) return w2 ? e5 : (b3 = true, U2 + (j2(f3, e5.rawJSON) - 1));
                if (c3 && tt2(e5)) {
                  if (h2(p3, e5)) throw new E2("Converting circular structure to JSON");
                  var r4 = (function(t6, e6, n3) {
                    for (var r5 = u2(null), o4 = 0, i3 = e6.length; o4 < i3; o4++) {
                      var a3 = e6[o4];
                      r5[n3 + a3] = et2(t6, a3);
                    }
                    return r5[$2] = null, r5;
                  })(e5, c3, l2);
                  return j2(p3, e5), j2(m3, o3), o3 = r4, l2 && (b3 = true), r4;
                }
                return e5;
              }, r3);
              if ("string" != typeof S3) return S3;
              if (z2 && (S3 = N2(S3, B2, Q2)), !b3) return S3;
              for (var k3 = "", P3 = S3.length, I3 = 0; I3 < P3; I3++) {
                var C3 = M2(S3, I3);
                if ('"' === C3) {
                  var D3 = g2(S3, ++I3).end - 1, L3 = T2(S3, I3, D3);
                  T2(L3, 0, J2) === U2 ? k3 += f3[T2(L3, J2)] : T2(L3, 0, G2) === H2 ? k3 += '"' + T2(L3, G2) + '"' : k3 += '"' + L3 + '"', I3 = D3;
                } else k3 += C3;
              }
              return k3;
            } });
          }), pn = n.cw(function() {
            var t3 = q(), e3 = Mt(), n2 = L(), r2 = dt(), o2 = ue(), i2 = at(), a2 = kt(), s2 = pt(), u2 = mt(), c2 = Qt(), l2 = Tt(), f2 = Be(), d2 = W(), p2 = qt().f, h2 = zt().f, v2 = Vt().f, y2 = De(), g2 = Ie().Bq, m2 = "Number", b2 = r2[m2], w2 = o2[m2], x2 = b2.prototype, O2 = r2.TypeError, E2 = i2("".slice), S2 = i2("".charCodeAt), k2 = function(t4) {
              var e4, n3, r3, o3, i3, a3, s3, u3, c3 = f2(t4, "number");
              if (l2(c3)) throw new O2("Cannot convert a Symbol value to a number");
              if ("string" == typeof c3 && c3.length > 2) {
                if (c3 = g2(c3), 43 === (e4 = S2(c3, 0)) || 45 === e4) {
                  if (88 === (n3 = S2(c3, 2)) || 120 === n3) return NaN;
                } else if (48 === e4) {
                  switch (S2(c3, 1)) {
                    case 66:
                    case 98:
                      r3 = 2, o3 = 49;
                      break;
                    case 79:
                    case 111:
                      r3 = 8, o3 = 55;
                      break;
                    default:
                      return +c3;
                  }
                  for (a3 = (i3 = E2(c3, 2)).length, s3 = 0; s3 < a3; s3++) if ((u3 = S2(i3, s3)) < 48 || u3 > o3) return NaN;
                  return parseInt(i3, r3);
                }
              }
              return +c3;
            }, P2 = a2(m2, !b2(" 0o1") || !b2("0b1") || b2("+0x1")), I2 = function(t4) {
              var e4, n3 = arguments.length < 1 ? 0 : b2((function(t5) {
                var e5 = f2(t5, "number");
                return "bigint" == typeof e5 ? e5 : k2(e5);
              })(t4));
              return c2(x2, e4 = this) && d2(function() {
                y2(e4);
              }) ? u2(Object(n3), this, I2) : n3;
            };
            I2.prototype = x2, P2 && !e3 && (x2.constructor = I2), t3({ global: true, constructor: true, wrap: true, forced: P2 }, { Number: I2 });
            var C2 = function(t4, e4) {
              for (var r3, o3 = n2 ? p2(e4) : "MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,EPSILON,MAX_SAFE_INTEGER,MIN_SAFE_INTEGER,isFinite,isInteger,isNaN,isSafeInteger,parseFloat,parseInt,fromString,range".split(","), i3 = 0; o3.length > i3; i3++) s2(e4, r3 = o3[i3]) && !s2(t4, r3) && v2(t4, r3, h2(e4, r3));
            };
            e3 && w2 && C2(o2[m2], w2), (P2 || e3) && C2(o2[m2], b2);
          }), hn = n.cw(function() {
            q()({ target: "Number", stat: true }, { isInteger: Pt() });
          }), vn = n.cw(function() {
            var t3 = q(), e3 = $t();
            t3({ target: "Object", stat: true, arity: 2, forced: Object.assign !== e3 }, { assign: e3 });
          }), yn = n.cw(function() {
            var e3 = q(), n2 = L(), r2 = ne(), o2 = t2(), i2 = Le(), a2 = Vt();
            n2 && e3({ target: "Object", proto: true, forced: r2 }, { __defineGetter__: function(t3, e4) {
              a2.f(i2(this), t3, { get: o2(e4), enumerable: true, configurable: true });
            } });
          }), gn = n.cw(function() {
            var t3 = q(), e3 = W(), n2 = Te(), r2 = zt().f, o2 = L();
            t3({ target: "Object", stat: true, forced: !o2 || e3(function() {
              r2(1);
            }), sham: !o2 }, { getOwnPropertyDescriptor: function(t4, e4) {
              return r2(n2(t4), e4);
            } });
          }), mn = n.cw(function() {
            var t3 = q(), e3 = L(), n2 = ae(), r2 = Te(), o2 = zt(), i2 = M();
            t3({ target: "Object", stat: true, sham: !e3 }, { getOwnPropertyDescriptors: function(t4) {
              for (var e4, a2, s2 = r2(t4), u2 = o2.f, c2 = n2(s2), l2 = {}, f2 = 0; c2.length > f2; ) void 0 !== (a2 = u2(s2, e4 = c2[f2++])) && i2(l2, e4, a2);
              return l2;
            } });
          }), bn = n.cw(function() {
            var t3 = q(), e3 = W(), n2 = Yt().f;
            t3({ target: "Object", stat: true, forced: e3(function() {
              return !Object.getOwnPropertyNames(1);
            }) }, { getOwnPropertyNames: n2 });
          }), wn = n.cw(function() {
            var t3 = q(), e3 = Ce(), n2 = W(), r2 = Wt(), o2 = Le();
            t3({ target: "Object", stat: true, forced: !e3 || n2(function() {
              r2.f(1);
            }) }, { getOwnPropertySymbols: function(t4) {
              var e4 = r2.f;
              return e4 ? e4(o2(t4)) : [];
            } });
          }), xn = n.cw(function() {
            var t3 = q(), e3 = Le(), n2 = te();
            t3({ target: "Object", stat: true, forced: W()(function() {
              n2(1);
            }) }, { keys: function(t4) {
              return n2(e3(t4));
            } });
          }), On = n.cw(function() {
            var t3 = Fe(), e3 = T(), n2 = oe();
            t3 || e3(Object.prototype, "toString", n2, { unsafe: true });
          }), En = n.cw(function() {
            var t3 = q(), n2 = st(), r2 = Q(), o2 = et(), i2 = e2(), a2 = s(), u2 = Ct(), c2 = Jt(), l2 = W(), f2 = n2("Reflect", "construct"), d2 = Object.prototype, p2 = [].push, h2 = l2(function() {
              function t4() {
              }
              return !(f2(function() {
              }, [], t4) instanceof t4);
            }), v2 = !l2(function() {
              f2(function() {
              });
            }), y2 = h2 || v2;
            t3({ target: "Reflect", stat: true, forced: y2, sham: y2 }, { construct: function(t4, e3) {
              i2(t4);
              var n3 = arguments.length < 3 ? t4 : i2(arguments[2]);
              if (a2(e3), v2 && !h2) return f2(t4, e3, n3);
              if (t4 === n3) {
                switch (e3.length) {
                  case 0:
                    return new t4();
                  case 1:
                    return new t4(e3[0]);
                  case 2:
                    return new t4(e3[0], e3[1]);
                  case 3:
                    return new t4(e3[0], e3[1], e3[2]);
                  case 4:
                    return new t4(e3[0], e3[1], e3[2], e3[3]);
                }
                var s2 = [null];
                return r2(p2, s2, e3), new (r2(o2, t4, s2))();
              }
              var l3 = n3.prototype, y3 = c2(u2(l3) ? l3 : d2), g2 = r2(t4, y3, e3);
              return u2(g2) ? g2 : y3;
            } });
          }), Sn = n.cw(function() {
            var t3 = L(), e3 = dt(), n2 = at(), r2 = kt(), o2 = mt(), i2 = C(), a2 = Jt(), s2 = qt().f, u2 = Qt(), c2 = Nt(), l2 = _e(), f2 = he(), d2 = ve(), p2 = ce(), h2 = T(), v2 = W(), y2 = pt(), g2 = wt().enforce, m2 = be(), b2 = Ye(), w2 = ye(), x2 = ge(), O2 = b2("match"), E2 = e3.RegExp, S2 = E2.prototype, k2 = e3.SyntaxError, P2 = n2(S2.exec), I2 = n2("".charAt), A2 = n2("".replace), M2 = n2("".indexOf), D2 = n2("".slice), N2 = /^\?<[^\s\d!#%&*+<=>@^][^\s!#%&*+<=>@^]*>/, j2 = /a/g, R2 = /a/g, B2 = new E2(j2) !== j2, K2 = d2.MISSED_STICKY, F2 = d2.UNSUPPORTED_Y, _2 = t3 && (!B2 || K2 || w2 || x2 || v2(function() {
              return R2[O2] = false, E2(j2) !== j2 || E2(R2) === R2 || "/a/i" !== String(E2(j2, "i"));
            }));
            if (r2("RegExp", _2)) {
              for (var U2 = function(t4, e4) {
                var n3, r3, s3, d3, p3, h3, v3 = u2(S2, this), m3 = c2(t4), b3 = void 0 === e4, O3 = [], C2 = t4;
                if (!v3 && m3 && b3 && t4.constructor === U2) return t4;
                if ((m3 || u2(S2, t4)) && (t4 = t4.source, b3 && (e4 = f2(C2))), t4 = void 0 === t4 ? "" : l2(t4), e4 = void 0 === e4 ? "" : l2(e4), C2 = t4, w2 && "dotAll" in j2 && (r3 = !!e4 && M2(e4, "s") > -1) && (e4 = A2(e4, /s/g, "")), n3 = e4, K2 && "sticky" in j2 && (s3 = !!e4 && M2(e4, "y") > -1) && F2 && (e4 = A2(e4, /y/g, "")), x2 && (d3 = (function(t5) {
                  for (var e5, n4 = t5.length, r4 = 0, o3 = "", i3 = [], s4 = a2(null), u3 = false, c3 = false, l3 = 0, f3 = ""; r4 < n4; r4++) {
                    if ("\\" === (e5 = I2(t5, r4))) {
                      if (e5 += I2(t5, ++r4), !c3 && "\\" === I2(e5, 1)) {
                        o3 += "\\x5c";
                        continue;
                      }
                    } else if ("]" === e5) u3 = false;
                    else if (!u3) switch (true) {
                      case "[" === e5:
                        u3 = true;
                        break;
                      case "(" === e5:
                        o3 += e5, P2(N2, D2(t5, r4 + 1)) ? (r4 += 2, c3 = true, l3++) : "?" !== I2(t5, r4 + 1) && l3++;
                        continue;
                      case (">" === e5 && c3):
                        if ("" === f3 || y2(s4, f3)) throw new k2("Invalid capture group name");
                        s4[f3] = true, i3[i3.length] = [f3, l3], c3 = false, f3 = "";
                        continue;
                    }
                    c3 ? f3 += e5 : o3 += e5;
                  }
                  for (var d4 = 0; d4 < i3.length; d4++) for (var p4 = "\\k<" + i3[d4][0] + ">", h4 = "\\" + i3[d4][1]; M2(o3, p4) > -1; ) o3 = A2(o3, p4, h4);
                  return [o3, i3];
                })(t4), t4 = d3[0], O3 = d3[1]), p3 = o2(E2(t4, e4), v3 ? this : S2, U2), (r3 || s3 || O3.length) && (h3 = g2(p3), r3 && (h3.dotAll = true, h3.raw = U2((function(t5) {
                  for (var e5, n4 = t5.length, r4 = 0, o3 = "", i3 = false; r4 < n4; r4++) "\\" !== (e5 = I2(t5, r4)) ? i3 || "." !== e5 ? ("[" === e5 ? i3 = true : "]" === e5 && (i3 = false), o3 += e5) : o3 += "[\\s\\S]" : o3 += e5 + I2(t5, ++r4);
                  return o3;
                })(t4), n3)), s3 && (h3.sticky = true), O3.length && (h3.groups = O3)), t4 !== C2) try {
                  i2(p3, "source", "" === C2 ? "(?:)" : C2);
                } catch (t5) {
                }
                return p3;
              }, H2 = s2(E2), $2 = 0; H2.length > $2; ) p2(U2, E2, H2[$2++]);
              S2.constructor = U2, U2.prototype = S2, h2(e3, "RegExp", U2, { constructor: true });
            }
            m2("RegExp");
          }), kn = n.cw(function() {
            var t3 = q(), e3 = fe();
            t3({ target: "RegExp", proto: true, forced: /./.exec !== e3 }, { exec: e3 });
          }), Pn = n.cw(function() {
            var t3 = rt().PROPER, e3 = T(), n2 = s(), r2 = _e(), o2 = W(), i2 = he(), a2 = "toString", u2 = RegExp.prototype, c2 = u2[a2], l2 = o2(function() {
              return "/a/b" !== c2.call({ source: "a", flags: "b" });
            }), f2 = t3 && c2.name !== a2;
            (l2 || f2) && e3(u2, a2, function() {
              var t4 = n2(this);
              return "/" + r2(t4.source) + "/" + r2(i2(t4));
            }, { unsafe: true });
          }), In = n.cw(function() {
            var t3 = q(), e3 = at(), n2 = Ht(), r2 = me(), o2 = _e(), i2 = k(), a2 = e3("".indexOf);
            t3({ target: "String", proto: true, forced: !i2("includes") }, { includes: function(t4) {
              return !!~a2(o2(r2(this)), o2(n2(t4)), arguments.length > 1 ? arguments[1] : void 0);
            } });
          }), Cn = n.cw(function() {
            var t3 = ke().o, e3 = _e(), n2 = wt(), r2 = Lt(), o2 = I(), i2 = "String Iterator", a2 = n2.set, s2 = n2.getterFor(i2);
            r2(String, "String", function(t4) {
              a2(this, { type: i2, string: e3(t4), index: 0 });
            }, function() {
              var e4, n3 = s2(this), r3 = n3.string, i3 = n3.index;
              return i3 >= r3.length ? o2(void 0, true) : (e4 = t3(r3, i3), n3.index += e4.length, o2(e4, false));
            });
          }), An = n.cw(function() {
            var t3 = q(), e3 = nt(), n2 = it(), r2 = Rt(), o2 = I(), i2 = me(), u2 = Re(), c2 = _e(), l2 = s(), f2 = Ct(), d2 = O(), p2 = Nt(), h2 = he(), v2 = lt(), y2 = T(), g2 = W(), m2 = Ye(), b2 = Se(), w2 = a(), x2 = le(), E2 = wt(), S2 = Mt(), k2 = m2("matchAll"), P2 = "RegExp String", C2 = P2 + " Iterator", A2 = E2.set, M2 = E2.getterFor(C2), D2 = RegExp.prototype, N2 = TypeError, j2 = n2("".indexOf), R2 = n2("".matchAll), L2 = !!R2 && !g2(function() {
              R2("a", /./);
            }), B2 = r2(function(t4, e4, n3, r3) {
              A2(this, { type: C2, regexp: t4, string: e4, global: n3, unicode: r3, done: false });
            }, P2, function() {
              var t4 = M2(this);
              if (t4.done) return o2(void 0, true);
              var e4 = t4.regexp, n3 = t4.string, r3 = x2(e4, n3);
              return null === r3 ? (t4.done = true, o2(void 0, true)) : t4.global ? ("" === c2(r3[0]) && (e4.lastIndex = w2(n3, u2(e4.lastIndex), t4.unicode)), o2(r3, false)) : (t4.done = true, o2(r3, false));
            }), K2 = function(t4) {
              var e4 = l2(this), n3 = c2(t4), r3 = b2(e4, RegExp), o3 = c2(h2(e4)), i3 = new r3(r3 === RegExp ? e4.source : e4, o3), a2 = !!~j2(o3, "g"), s2 = !!~j2(o3, "u") || !!~j2(o3, "v");
              return i3.lastIndex = u2(e4.lastIndex), new B2(i3, n3, a2, s2);
            };
            t3({ target: "String", proto: true, forced: L2 }, { matchAll: function(t4) {
              var n3, r3, o3, a2, s2 = i2(this);
              if (f2(t4)) {
                if (p2(t4) && (n3 = c2(i2(h2(t4))), !~j2(n3, "g"))) throw new N2("`.matchAll` does not allow non-global regexes");
                if (L2) return R2(s2, t4);
                if (void 0 === (o3 = v2(t4, k2)) && S2 && "RegExp" === d2(t4) && (o3 = K2), o3) return e3(o3, t4, s2);
              } else if (L2) return R2(s2, t4);
              return r3 = c2(s2), a2 = new RegExp(t4, "g"), S2 ? e3(K2, a2, r3) : a2[k2](r3);
            } }), S2 || k2 in D2 || y2(D2, k2, K2);
          }), Mn = n.cw(function() {
            var t3 = nt(), e3 = at(), n2 = X(), r2 = s(), o2 = Ct(), i2 = Re(), u2 = _e(), c2 = me(), l2 = lt(), f2 = a(), d2 = he(), p2 = le(), h2 = e3("".indexOf);
            n2("match", function(e4, n3, a2) {
              return [function(n4) {
                var r3 = c2(this), i3 = o2(n4) ? l2(n4, e4) : void 0;
                if (i3) return t3(i3, n4, r3);
                var a3 = u2(r3);
                return new RegExp(n4)[e4](a3);
              }, function(t4) {
                var e5 = r2(this), o3 = u2(t4), s2 = a2(n3, e5, o3);
                if (s2.done) return s2.value;
                var c3 = u2(d2(e5));
                if (!~h2(c3, "g")) return p2(e5, o3);
                var l3 = !!~h2(c3, "u") || !!~h2(c3, "v");
                e5.lastIndex = 0;
                for (var v2, y2 = [], g2 = 0; null !== (v2 = p2(e5, o3)); ) {
                  var m2 = u2(v2[0]);
                  y2[g2] = m2, "" === m2 && (e5.lastIndex = f2(o3, i2(e5.lastIndex), l3)), g2++;
                }
                return 0 === g2 ? null : y2;
              }];
            });
          }), Dn = n.cw(function() {
            var t3 = Q(), e3 = nt(), n2 = at(), r2 = X(), o2 = W(), i2 = s(), u2 = Et(), c2 = Ct(), l2 = je(), f2 = Re(), d2 = _e(), p2 = me(), h2 = a(), v2 = lt(), y2 = ft(), g2 = he(), m2 = le(), b2 = Ye()("replace"), w2 = Math.max, x2 = Math.min, O2 = n2([].concat), E2 = n2([].push), S2 = n2("".indexOf), k2 = n2("".slice), P2 = function(t4) {
              return void 0 === t4 ? t4 : String(t4);
            }, I2 = "$0" === "a".replace(/./, "$0"), C2 = !!/./[b2] && "" === /./[b2]("a", "$0");
            r2("replace", function(n3, r3, o3) {
              var a2 = C2 ? "$" : "$0";
              return [function(t4, n4) {
                var o4 = p2(this), i3 = c2(t4) ? v2(t4, b2) : void 0;
                return i3 ? e3(i3, t4, o4, n4) : e3(r3, d2(o4), t4, n4);
              }, function(e4, n4) {
                var s2 = i2(this), c3 = d2(e4), p3 = u2(n4);
                p3 || (n4 = d2(n4));
                var v3 = d2(g2(s2));
                if ("string" == typeof n4 && !~S2(n4, a2) && !~S2(n4, "$<") && !~S2(v3, "y")) {
                  var b3 = o3(r3, s2, c3, n4);
                  if (b3.done) return b3.value;
                }
                var I3, C3 = !!~S2(v3, "g");
                C3 && (I3 = !!~S2(v3, "u") || !!~S2(v3, "v"), s2.lastIndex = 0);
                for (var A2, M2 = []; null !== (A2 = m2(s2, c3)) && (E2(M2, A2), C3); ) {
                  "" === d2(A2[0]) && (s2.lastIndex = h2(c3, f2(s2.lastIndex), I3));
                }
                for (var D2 = "", N2 = 0, T2 = 0; T2 < M2.length; T2++) {
                  for (var j2, R2 = d2((A2 = M2[T2])[0]), L2 = w2(x2(l2(A2.index), c3.length), 0), B2 = [], K2 = 1; K2 < A2.length; K2++) E2(B2, P2(A2[K2]));
                  var F2 = A2.groups;
                  if (p3) {
                    var _2 = O2([R2], B2, L2, c3);
                    void 0 !== F2 && E2(_2, F2), j2 = d2(t3(n4, void 0, _2));
                  } else j2 = y2(R2, c3, L2, B2, F2, n4);
                  L2 >= N2 && (D2 += k2(c3, N2, L2) + j2, N2 = L2 + R2.length);
                }
                return D2 + k2(c3, N2);
              }];
            }, !!o2(function() {
              var t4 = /./;
              return t4.exec = function() {
                var t5 = [];
                return t5.groups = { a: "7" }, t5;
              }, "7" !== "".replace(t4, "$<a>");
            }) || !I2 || C2);
          }), Nn = n.cw(function() {
            var t3 = nt(), e3 = at(), n2 = X(), r2 = s(), o2 = Ct(), i2 = me(), u2 = Se(), c2 = a(), l2 = Re(), f2 = _e(), d2 = lt(), p2 = he(), h2 = le(), v2 = ve(), y2 = W(), g2 = v2.UNSUPPORTED_Y, m2 = Math.min, b2 = e3([].push), w2 = e3("".slice), x2 = e3("".indexOf), O2 = !y2(function() {
              var t4 = /(?:)/, e4 = t4.exec;
              t4.exec = function() {
                return e4.apply(this, arguments);
              };
              var n3 = "ab".split(t4);
              return 2 !== n3.length || "a" !== n3[0] || "b" !== n3[1];
            }), E2 = "c" === "abbc".split(/(b)*/)[1] || 4 !== "test".split(/(?:)/, -1).length || 2 !== "ab".split(/(?:ab)*/).length || 4 !== ".".split(/(.?)(.?)/).length || ".".split(/()()/).length > 1 || "".split(/.?/).length;
            n2("split", function(e4, n3, a2) {
              var s2 = "0".split(void 0, 0).length ? function(e5, r3) {
                return void 0 === e5 && 0 === r3 ? [] : t3(n3, this, e5, r3);
              } : n3;
              return [function(n4, r3) {
                var a3 = i2(this), u3 = o2(n4) ? d2(n4, e4) : void 0;
                return u3 ? t3(u3, n4, a3, r3) : t3(s2, f2(a3), n4, r3);
              }, function(t4, e5) {
                var o3 = r2(this), i3 = f2(t4);
                if (!E2) {
                  var d3 = a2(s2, o3, i3, e5, s2 !== n3);
                  if (d3.done) return d3.value;
                }
                var v3 = u2(o3, RegExp), y3 = f2(p2(o3)), O3 = !!~x2(y3, "u") || !!~x2(y3, "v");
                g2 ? ~x2(y3, "g") || (y3 += "g") : ~x2(y3, "y") || (y3 += "y");
                var S2 = new v3(g2 ? "^(?:" + o3.source + ")" : o3, y3), k2 = void 0 === e5 ? 4294967295 : e5 >>> 0;
                if (0 === k2) return [];
                if (0 === i3.length) return null === h2(S2, i3) ? [i3] : [];
                for (var P2 = 0, I2 = 0, C2 = []; I2 < i3.length; ) {
                  S2.lastIndex = g2 ? 0 : I2;
                  var A2, M2 = h2(S2, g2 ? w2(i3, I2) : i3);
                  if (null === M2 || (A2 = m2(l2(S2.lastIndex + (g2 ? I2 : 0)), i3.length)) === P2) I2 = c2(i3, I2, O3);
                  else {
                    if (b2(C2, w2(i3, P2, I2)), C2.length === k2) return C2;
                    for (var D2 = 1; D2 <= M2.length - 1; D2++) if (b2(C2, M2[D2]), C2.length === k2) return C2;
                    I2 = P2 = A2;
                  }
                }
                return b2(C2, w2(i3, P2)), C2;
              }];
            }, E2 || !O2, g2);
          }), Tn = n.cw(function() {
            var t3 = q(), e3 = Ie().Bq;
            t3({ target: "String", proto: true, forced: Pe()("trim") }, { trim: function() {
              return e3(this);
            } });
          }), jn = n.cw(function() {
            var t3 = q(), e3 = dt(), n2 = nt(), r2 = at(), o2 = Mt(), i2 = L(), a2 = Ce(), u2 = W(), c2 = pt(), l2 = Qt(), d2 = s(), p2 = Te(), h2 = Ke(), v2 = _e(), y2 = A(), g2 = Jt(), m2 = te(), b2 = qt(), w2 = Yt(), x2 = Wt(), O2 = zt(), E2 = Vt(), S2 = Gt(), k2 = ee(), P2 = T(), I2 = N(), C2 = Ee(), M2 = xe(), D2 = ht(), j2 = He(), R2 = Ye(), B2 = ze(), K2 = Ve(), F2 = Ae(), _2 = we(), U2 = wt(), H2 = f().jJ, $2 = M2("hidden"), J2 = "Symbol", G2 = "prototype", V2 = U2.set, z2 = U2.getterFor(J2), Y2 = Object[G2], X2 = e3.Symbol, Q2 = X2 && X2[G2], Z2 = e3.RangeError, tt2 = e3.TypeError, et2 = e3.QObject, rt2 = O2.f, ot2 = E2.f, it2 = w2.f, st2 = k2.f, ut2 = r2([].push), ct2 = C2("symbols"), lt2 = C2("op-symbols"), ft2 = C2("wks"), vt2 = !et2 || !et2[G2] || !et2[G2].findChild, yt2 = function(t4, e4, n3) {
              var r3 = rt2(Y2, e4);
              return r3 && delete Y2[e4], ot2(t4, e4, n3), r3 && t4 !== Y2 && ot2(Y2, e4, r3), t4;
            }, gt2 = i2 && u2(function() {
              return 7 !== g2(ot2({}, "a", { get: function() {
                return ot2(this, "a", { value: 7 }).a;
              } })).a;
            }) ? yt2 : ot2, mt2 = function(t4, e4) {
              var n3 = ct2[t4] = g2(Q2);
              return V2(n3, { type: J2, tag: t4, description: e4 }), i2 || (n3.description = e4), n3;
            }, bt2 = function(t4, e4, n3) {
              t4 === Y2 && bt2(lt2, e4, n3), d2(t4);
              var r3 = h2(e4);
              return d2(n3), c2(ct2, r3) ? (("enumerable" in n3 ? !n3.enumerable : !c2(t4, r3) || c2(t4, $2) && t4[$2][r3]) ? (c2(t4, $2) || ot2(t4, $2, y2(1, g2(null))), t4[$2][r3] = true) : (c2(t4, $2) && t4[$2][r3] && (t4[$2][r3] = false), n3 = g2(n3, { enumerable: y2(0, false) })), gt2(t4, r3, n3)) : ot2(t4, r3, n3);
            }, xt2 = function(t4, e4) {
              d2(t4);
              var r3 = p2(e4), o3 = m2(r3).concat(kt2(r3));
              return H2(o3, function(e5) {
                i2 && !n2(Ot2, r3, e5) || bt2(t4, e5, r3[e5]);
              }), t4;
            }, Ot2 = function(t4) {
              var e4 = h2(t4), r3 = n2(st2, this, e4);
              return !(this === Y2 && c2(ct2, e4) && !c2(lt2, e4)) && (!(r3 || !c2(this, e4) || !c2(ct2, e4) || c2(this, $2) && this[$2][e4]) || r3);
            }, Et2 = function(t4, e4) {
              var n3 = p2(t4), r3 = h2(e4);
              if (n3 !== Y2 || !c2(ct2, r3) || c2(lt2, r3)) {
                var o3 = rt2(n3, r3);
                return !o3 || !c2(ct2, r3) || c2(n3, $2) && n3[$2][r3] || (o3.enumerable = true), o3;
              }
            }, St2 = function(t4) {
              var e4 = it2(p2(t4)), n3 = [];
              return H2(e4, function(t5) {
                c2(ct2, t5) || c2(D2, t5) || ut2(n3, t5);
              }), n3;
            }, kt2 = function(t4) {
              var e4 = t4 === Y2, n3 = it2(e4 ? lt2 : p2(t4)), r3 = [];
              return H2(n3, function(t5) {
                !c2(ct2, t5) || e4 && !c2(Y2, t5) || ut2(r3, ct2[t5]);
              }), r3;
            };
            a2 || (X2 = function() {
              if (l2(Q2, this)) throw new tt2("Symbol is not a constructor");
              var t4 = arguments.length && void 0 !== arguments[0] ? v2(arguments[0]) : void 0, r3 = j2(t4), o3 = function(t5) {
                var i3 = void 0 === this ? e3 : this;
                i3 === Y2 && n2(o3, lt2, t5), c2(i3, $2) && c2(i3[$2], r3) && (i3[$2][r3] = false);
                var a3 = y2(1, t5);
                try {
                  gt2(i3, r3, a3);
                } catch (t6) {
                  if (!(t6 instanceof Z2)) throw t6;
                  yt2(i3, r3, a3);
                }
              };
              return i2 && vt2 && gt2(Y2, r3, { configurable: true, set: o3 }), mt2(r3, t4);
            }, P2(Q2 = X2[G2], "toString", function() {
              return z2(this).tag;
            }), P2(X2, "withoutSetter", function(t4) {
              return mt2(j2(t4), t4);
            }), k2.f = Ot2, E2.f = bt2, S2.f = xt2, O2.f = Et2, b2.f = w2.f = St2, x2.f = kt2, B2.f = function(t4) {
              return mt2(R2(t4), t4);
            }, i2 && (I2(Q2, "description", { configurable: true, get: function() {
              return z2(this).description;
            } }), o2 || P2(Y2, "propertyIsEnumerable", Ot2, { unsafe: true }))), t3({ global: true, constructor: true, wrap: true, forced: !a2, sham: !a2 }, { Symbol: X2 }), H2(m2(ft2), function(t4) {
              K2(t4);
            }), t3({ target: J2, stat: true, forced: !a2 }, { useSetter: function() {
              vt2 = true;
            }, useSimple: function() {
              vt2 = false;
            } }), t3({ target: "Object", stat: true, forced: !a2, sham: !i2 }, { create: function(t4, e4) {
              return void 0 === e4 ? g2(t4) : xt2(g2(t4), e4);
            }, defineProperty: bt2, defineProperties: xt2, getOwnPropertyDescriptor: Et2 }), t3({ target: "Object", stat: true, forced: !a2 }, { getOwnPropertyNames: St2 }), F2(), _2(X2, J2), D2[$2] = true;
          }), Rn = n.cw(function() {
            var t3 = q(), e3 = L(), n2 = dt(), r2 = nt(), o2 = at(), i2 = pt(), a2 = Et(), s2 = Qt(), u2 = _e(), c2 = N(), l2 = S(), f2 = n2.Symbol, d2 = f2 && f2.prototype;
            if (e3 && a2(f2) && (!("description" in d2) || void 0 !== f2().description)) {
              var p2 = {}, h2 = function() {
                var t4 = arguments.length < 1 || void 0 === arguments[0] ? void 0 : u2(arguments[0]), e4 = s2(d2, this) ? new f2(t4) : void 0 === t4 ? f2() : f2(t4);
                return "" === t4 && (p2[e4] = true), e4;
              };
              l2(h2, f2);
              var v2 = h2.for;
              h2.for = { for: function(t4) {
                var e4 = u2(t4), n3 = r2(v2, this, e4);
                return "" === e4 && (p2[n3] = true), n3;
              } }.for, h2.prototype = d2, d2.constructor = h2;
              var y2 = "Symbol(description detection)" === String(f2("description detection")), g2 = o2(d2.valueOf), m2 = o2(d2.toString), b2 = /^Symbol\((.*)\)[^)]+$/, w2 = o2("".replace), x2 = o2("".slice);
              c2(d2, "description", { configurable: true, get: function() {
                var t4 = g2(this);
                if (i2(p2, t4)) return "";
                var e4 = m2(t4), n3 = y2 ? x2(e4, 7, -1) : w2(e4, b2, "$1");
                return "" === n3 ? void 0 : n3;
              } }), t3({ global: true, constructor: true, forced: true }, { Symbol: h2 });
            }
          }), Ln = n.cw(function() {
            var t3 = q(), e3 = st(), n2 = pt(), r2 = _e(), o2 = Ee(), i2 = Me(), a2 = o2("string-to-symbol-registry"), s2 = o2("symbol-to-string-registry");
            t3({ target: "Symbol", stat: true, forced: !i2 }, { for: function(t4) {
              var o3 = r2(t4);
              if (n2(a2, o3)) return a2[o3];
              var i3 = e3("Symbol")(o3);
              return a2[o3] = i3, s2[i3] = o3, i3;
            } });
          }), Bn = n.cw(function() {
            Ve()("iterator");
          }), Kn = n.cw(function() {
            jn(), Ln(), Fn(), dn(), wn();
          }), Fn = n.cw(function() {
            var t3 = q(), e3 = pt(), n2 = Tt(), r2 = Ue(), o2 = Ee(), i2 = Me(), a2 = o2("symbol-to-string-registry");
            t3({ target: "Symbol", stat: true, forced: !i2 }, { keyFor: function(t4) {
              if (!n2(t4)) throw new TypeError(r2(t4) + " is not a symbol");
              if (e3(a2, t4)) return a2[t4];
            } });
          }), _n = n.cw(function() {
            var t3 = Ve(), e3 = Ae();
            t3("toPrimitive"), e3();
          }), Un = n.cw(function() {
            An();
          }), Hn = n.cw(function() {
            var t3 = dt(), e3 = F(), n2 = _(), r2 = u(), o2 = C(), i2 = function(t4) {
              if (t4 && t4.forEach !== r2) try {
                o2(t4, "forEach", r2);
              } catch (e4) {
                t4.forEach = r2;
              }
            };
            for (var a2 in e3) e3[a2] && i2(t3[a2] && t3[a2].prototype);
            i2(n2);
          }), $n = n.cw(function() {
            var t3 = dt(), e3 = F(), n2 = _(), r2 = en(), o2 = C(), i2 = we(), a2 = Ye()("iterator"), s2 = r2.values, u2 = function(t4, n3) {
              if (t4) {
                if (t4[a2] !== s2) try {
                  o2(t4, a2, s2);
                } catch (e4) {
                  t4[a2] = s2;
                }
                if (i2(t4, n3, true), e3[n3]) {
                  for (var u3 in r2) if (t4[u3] !== r2[u3]) try {
                    o2(t4, u3, r2[u3]);
                  } catch (e4) {
                    t4[u3] = r2[u3];
                  }
                }
              }
            };
            for (var c2 in e3) u2(t3[c2] && t3[c2].prototype, c2);
            u2(n2, "DOMTokenList");
          });
          tn(), nn(), an(), un(), fn2(), yn(), On(), kn(), Pn(), Dn(), Nn(), Tn(), "undefined" == typeof Element || "remove" in Element.prototype || (Element.prototype.remove = function() {
            this.parentNode && this.parentNode.removeChild(this);
          }), "undefined" != typeof self && "document" in self && ((!("classList" in document.createElement("_")) || document.createElementNS && !("classList" in document.createElementNS("http://www.w3.org/2000/svg", "g"))) && (function(t3) {
            if ("Element" in t3) {
              var e3 = "classList", n2 = "prototype", r2 = t3.Element[n2], o2 = Object, i2 = String[n2].trim || function() {
                return this.replace(/^\s+|\s+$/g, "");
              }, a2 = Array[n2].indexOf || function(t4) {
                for (var e4 = 0, n3 = this.length; e4 < n3; e4++) if (e4 in this && this[e4] === t4) return e4;
                return -1;
              }, s2 = function(t4, e4) {
                this.name = t4, this.code = DOMException[t4], this.message = e4;
              }, u2 = function(t4, e4) {
                if ("" === e4) throw new s2("SYNTAX_ERR", "The token must not be empty.");
                if (/\s/.test(e4)) throw new s2("INVALID_CHARACTER_ERR", "The token must not contain space characters.");
                return a2.call(t4, e4);
              }, c2 = function(t4) {
                for (var e4 = i2.call(t4.getAttribute("class") || ""), n3 = e4 ? e4.split(/\s+/) : [], r3 = 0, o3 = n3.length; r3 < o3; r3++) this.push(n3[r3]);
                this._updateClassName = function() {
                  t4.setAttribute("class", this.toString());
                };
              }, l2 = c2[n2] = [], f2 = function() {
                return new c2(this);
              };
              if (s2[n2] = Error[n2], l2.item = function(t4) {
                return this[t4] || null;
              }, l2.contains = function(t4) {
                return ~u2(this, t4 + "");
              }, l2.add = function() {
                var t4, e4 = arguments, n3 = 0, r3 = e4.length, o3 = false;
                do {
                  ~u2(this, t4 = e4[n3] + "") || (this.push(t4), o3 = true);
                } while (++n3 < r3);
                o3 && this._updateClassName();
              }, l2.remove = function() {
                var t4, e4, n3 = arguments, r3 = 0, o3 = n3.length, i3 = false;
                do {
                  for (e4 = u2(this, t4 = n3[r3] + ""); ~e4; ) this.splice(e4, 1), i3 = true, e4 = u2(this, t4);
                } while (++r3 < o3);
                i3 && this._updateClassName();
              }, l2.toggle = function(t4, e4) {
                var n3 = this.contains(t4), r3 = n3 ? true !== e4 && "remove" : false !== e4 && "add";
                return r3 && this[r3](t4), true === e4 || false === e4 ? e4 : !n3;
              }, l2.replace = function(t4, e4) {
                var n3 = u2(t4 + "");
                ~n3 && (this.splice(n3, 1, e4), this._updateClassName());
              }, l2.toString = function() {
                return this.join(" ");
              }, o2.defineProperty) {
                var d2 = { get: f2, enumerable: true, configurable: true };
                try {
                  o2.defineProperty(r2, e3, d2);
                } catch (t4) {
                  void 0 !== t4.number && -2146823252 !== t4.number || (d2.enumerable = false, o2.defineProperty(r2, e3, d2));
                }
              } else o2[n2].__defineGetter__ && r2.__defineGetter__(e3, f2);
            }
          })(self), (function() {
            var t3 = document.createElement("_");
            if (t3.classList.add("c1", "c2"), !t3.classList.contains("c2")) {
              var e3 = function(t4) {
                var e4 = DOMTokenList.prototype[t4];
                DOMTokenList.prototype[t4] = function(t5) {
                  var n3, r2 = arguments.length;
                  for (n3 = 0; n3 < r2; n3++) t5 = arguments[n3], e4.call(this, t5);
                };
              };
              e3("add"), e3("remove");
            }
            if (t3.classList.toggle("c3", false), t3.classList.contains("c3")) {
              var n2 = DOMTokenList.prototype.toggle;
              DOMTokenList.prototype.toggle = function(t4, e4) {
                return 1 in arguments && !this.contains(t4) == !e4 ? e4 : n2.call(this, t4);
              };
            }
            "replace" in document.createElement("_").classList || (DOMTokenList.prototype.replace = function(t4, e4) {
              var n3 = this.toString().split(" "), r2 = n3.indexOf(t4 + "");
              ~r2 && (n3 = n3.slice(r2), this.remove.apply(this, n3), this.add(e4), this.add.apply(this, n3.slice(1)));
            }), t3 = null;
          })()), Kn(), Rn(), Bn(), _n(), We(), Xe(), Qe(), Ze(), en(), rn(), sn(), cn(), ln(), pn(), vn(), gn(), mn(), xn(), Sn(), In(), Cn(), Un(), Hn(), $n();
          function Jn(t3) {
            return (function(t4) {
              if (Array.isArray(t4)) return Vn(t4);
            })(t3) || (function(t4) {
              if ("undefined" != typeof Symbol && null != t4[Symbol.iterator] || null != t4["@@iterator"]) return Array.from(t4);
            })(t3) || Gn(t3) || (function() {
              throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
            })();
          }
          function Gn(t3, e3) {
            if (t3) {
              if ("string" == typeof t3) return Vn(t3, e3);
              var n2 = {}.toString.call(t3).slice(8, -1);
              return "Object" === n2 && t3.constructor && (n2 = t3.constructor.name), "Map" === n2 || "Set" === n2 ? Array.from(t3) : "Arguments" === n2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? Vn(t3, e3) : void 0;
            }
          }
          function Vn(t3, e3) {
            (null == e3 || e3 > t3.length) && (e3 = t3.length);
            for (var n2 = 0, r2 = Array(e3); n2 < e3; n2++) r2[n2] = t3[n2];
            return r2;
          }
          function zn(t3) {
            return zn = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t4) {
              return typeof t4;
            } : function(t4) {
              return t4 && "function" == typeof Symbol && t4.constructor === Symbol && t4 !== Symbol.prototype ? "symbol" : typeof t4;
            }, zn(t3);
          }
          function Yn(t3, e3) {
            for (var n2 = 0; n2 < e3.length; n2++) {
              var r2 = e3[n2];
              r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(t3, Wn(r2.key), r2);
            }
          }
          function qn(t3, e3, n2) {
            return (e3 = Wn(e3)) in t3 ? Object.defineProperty(t3, e3, { value: n2, enumerable: true, configurable: true, writable: true }) : t3[e3] = n2, t3;
          }
          function Wn(t3) {
            var e3 = (function(t4, e4) {
              if ("object" != zn(t4) || !t4) return t4;
              var n2 = t4[Symbol.toPrimitive];
              if (void 0 !== n2) {
                var r2 = n2.call(t4, e4);
                if ("object" != zn(r2)) return r2;
                throw new TypeError("@@toPrimitive must return a primitive value.");
              }
              return ("string" === e4 ? String : Number)(t4);
            })(t3, "string");
            return "symbol" == zn(e3) ? e3 : e3 + "";
          }
          on(), hn(), bn(), En(), Mn();
          var Xn = (function() {
            return t3 = function t4(e4) {
              var n3 = e4.getOptions, r2 = e4.getCaretPosition, o2 = e4.getCaretPositionEnd, i2 = e4.dispatch;
              !(function(t5, e5) {
                if (!(t5 instanceof e5)) throw new TypeError("Cannot call a class as a function");
              })(this, t4), qn(this, "getOptions", void 0), qn(this, "getCaretPosition", void 0), qn(this, "getCaretPositionEnd", void 0), qn(this, "dispatch", void 0), qn(this, "maxLengthReached", void 0), qn(this, "isStandardButton", function(t5) {
                return t5 && !("{" === t5[0] && "}" === t5[t5.length - 1]);
              }), this.getOptions = n3, this.getCaretPosition = r2, this.getCaretPositionEnd = o2, this.dispatch = i2, t4.bindMethods(t4, this);
            }, e3 = [{ key: "getButtonType", value: function(t4) {
              return t4.includes("{") && t4.includes("}") && "{//}" !== t4 ? "functionBtn" : "standardBtn";
            } }, { key: "getButtonClass", value: function(t4) {
              var e4 = this.getButtonType(t4), n3 = t4.replace("{", "").replace("}", ""), r2 = "";
              return "standardBtn" !== e4 && (r2 = " hg-button-".concat(n3)), "hg-".concat(e4).concat(r2);
            } }, { key: "getDefaultDiplay", value: function() {
              return { "{bksp}": "backspace", "{backspace}": "backspace", "{enter}": "< enter", "{shift}": "shift", "{shiftleft}": "shift", "{shiftright}": "shift", "{alt}": "alt", "{s}": "shift", "{tab}": "tab", "{lock}": "caps", "{capslock}": "caps", "{accept}": "Submit", "{space}": " ", "{//}": " ", "{esc}": "esc", "{escape}": "esc", "{f1}": "f1", "{f2}": "f2", "{f3}": "f3", "{f4}": "f4", "{f5}": "f5", "{f6}": "f6", "{f7}": "f7", "{f8}": "f8", "{f9}": "f9", "{f10}": "f10", "{f11}": "f11", "{f12}": "f12", "{numpaddivide}": "/", "{numlock}": "lock", "{arrowup}": "↑", "{arrowleft}": "←", "{arrowdown}": "↓", "{arrowright}": "→", "{prtscr}": "print", "{scrolllock}": "scroll", "{pause}": "pause", "{insert}": "ins", "{home}": "home", "{pageup}": "up", "{delete}": "del", "{forwarddelete}": "del", "{end}": "end", "{pagedown}": "down", "{numpadmultiply}": "*", "{numpadsubtract}": "-", "{numpadadd}": "+", "{numpadenter}": "enter", "{period}": ".", "{numpaddecimal}": ".", "{numpad0}": "0", "{numpad1}": "1", "{numpad2}": "2", "{numpad3}": "3", "{numpad4}": "4", "{numpad5}": "5", "{numpad6}": "6", "{numpad7}": "7", "{numpad8}": "8", "{numpad9}": "9" };
            } }, { key: "getButtonDisplayName", value: function(t4, e4) {
              return (e4 = arguments.length > 2 && void 0 !== arguments[2] && arguments[2] ? Object.assign({}, this.getDefaultDiplay(), e4) : e4 || this.getDefaultDiplay())[t4] || t4;
            } }, { key: "getUpdatedInput", value: function(t4, e4, n3) {
              var r2 = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : n3, o2 = arguments.length > 4 && void 0 !== arguments[4] && arguments[4], i2 = this.getOptions(), a2 = [n3, r2, o2], s2 = e4;
              return ("{bksp}" === t4 || "{backspace}" === t4) && s2.length > 0 ? s2 = this.removeAt.apply(this, [s2].concat(a2)) : ("{delete}" === t4 || "{forwarddelete}" === t4) && s2.length > 0 ? s2 = this.removeForwardsAt.apply(this, [s2].concat(a2)) : "{space}" === t4 ? s2 = this.addStringAt.apply(this, [s2, " "].concat(a2)) : "{tab}" !== t4 || "boolean" == typeof i2.tabCharOnTab && false === i2.tabCharOnTab ? "{enter}" !== t4 && "{numpadenter}" !== t4 || !i2.newLineOnEnter ? t4.includes("numpad") && Number.isInteger(Number(t4[t4.length - 2])) ? s2 = this.addStringAt.apply(this, [s2, t4[t4.length - 2]].concat(a2)) : "{numpaddivide}" === t4 ? s2 = this.addStringAt.apply(this, [s2, "/"].concat(a2)) : "{numpadmultiply}" === t4 ? s2 = this.addStringAt.apply(this, [s2, "*"].concat(a2)) : "{numpadsubtract}" === t4 ? s2 = this.addStringAt.apply(this, [s2, "-"].concat(a2)) : "{numpadadd}" === t4 ? s2 = this.addStringAt.apply(this, [s2, "+"].concat(a2)) : "{numpaddecimal}" === t4 ? s2 = this.addStringAt.apply(this, [s2, "."].concat(a2)) : "{" === t4 || "}" === t4 ? s2 = this.addStringAt.apply(this, [s2, t4].concat(a2)) : t4.includes("{") || t4.includes("}") || (s2 = this.addStringAt.apply(this, [s2, t4].concat(a2))) : s2 = this.addStringAt.apply(this, [s2, "\n"].concat(a2)) : s2 = this.addStringAt.apply(this, [s2, "	"].concat(a2)), i2.debug && console.log("Input will be: " + s2), s2;
            } }, { key: "updateCaretPos", value: function(t4) {
              var e4 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1], n3 = this.updateCaretPosAction(t4, e4);
              this.dispatch(function(t5) {
                t5.setCaretPosition(n3);
              });
            } }, { key: "updateCaretPosAction", value: function(t4) {
              var e4 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1], n3 = this.getOptions(), r2 = this.getCaretPosition();
              return null != r2 && (e4 ? r2 > 0 && (r2 -= t4) : r2 += t4), n3.debug && console.log("Caret at:", r2), r2;
            } }, { key: "addStringAt", value: function(t4, e4) {
              var n3, r2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : t4.length, o2 = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : t4.length, i2 = arguments.length > 4 && void 0 !== arguments[4] && arguments[4];
              return r2 || 0 === r2 ? (n3 = [t4.slice(0, r2), e4, t4.slice(o2)].join(""), this.isMaxLengthReached() || i2 && this.updateCaretPos(e4.length)) : n3 = t4 + e4, n3;
            } }, { key: "removeAt", value: function(t4) {
              var e4, n3 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : t4.length, r2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : t4.length, o2 = arguments.length > 3 && void 0 !== arguments[3] && arguments[3];
              if (0 === n3 && 0 === r2) return t4;
              if (n3 === r2) {
                var i2 = /([\uD800-\uDBFF][\uDC00-\uDFFF])/g;
                n3 && n3 >= 0 ? t4.substring(n3 - 2, n3).match(i2) ? (e4 = t4.substr(0, n3 - 2) + t4.substr(n3), o2 && this.updateCaretPos(2, true)) : (e4 = t4.substr(0, n3 - 1) + t4.substr(n3), o2 && this.updateCaretPos(1, true)) : t4.slice(-2).match(i2) ? (e4 = t4.slice(0, -2), o2 && this.updateCaretPos(2, true)) : (e4 = t4.slice(0, -1), o2 && this.updateCaretPos(1, true));
              } else e4 = t4.slice(0, n3) + t4.slice(r2), o2 && this.dispatch(function(t5) {
                t5.setCaretPosition(n3);
              });
              return e4;
            } }, { key: "removeForwardsAt", value: function(t4) {
              var e4, n3 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : t4.length, r2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : t4.length, o2 = arguments.length > 3 && void 0 !== arguments[3] && arguments[3];
              return null != t4 && t4.length && null !== n3 ? (n3 === r2 ? e4 = t4.substring(n3, n3 + 2).match(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g) ? t4.substr(0, n3) + t4.substr(n3 + 2) : t4.substr(0, n3) + t4.substr(n3 + 1) : (e4 = t4.slice(0, n3) + t4.slice(r2), o2 && this.dispatch(function(t5) {
                t5.setCaretPosition(n3);
              })), e4) : t4;
            } }, { key: "handleMaxLength", value: function(t4, e4) {
              var n3 = this.getOptions(), r2 = n3.maxLength, o2 = t4[n3.inputName || "default"], i2 = e4.length - 1 >= r2;
              if (e4.length <= o2.length) return false;
              if (Number.isInteger(r2)) return n3.debug && console.log("maxLength (num) reached:", i2), i2 ? (this.maxLengthReached = true, true) : (this.maxLengthReached = false, false);
              if ("object" === zn(r2)) {
                var a2 = e4.length - 1 >= r2[n3.inputName || "default"];
                return n3.debug && console.log("maxLength (obj) reached:", a2), a2 ? (this.maxLengthReached = true, true) : (this.maxLengthReached = false, false);
              }
            } }, { key: "isMaxLengthReached", value: function() {
              return Boolean(this.maxLengthReached);
            } }, { key: "isTouchDevice", value: function() {
              return "ontouchstart" in window || navigator.maxTouchPoints;
            } }, { key: "pointerEventsSupported", value: function() {
              return !!window.PointerEvent;
            } }, { key: "camelCase", value: function(t4) {
              return t4 ? t4.toLowerCase().trim().split(/[.\-_\s]/g).reduce(function(t5, e4) {
                return e4.length ? t5 + e4[0].toUpperCase() + e4.slice(1) : t5;
              }) : "";
            } }, { key: "chunkArray", value: function(t4, e4) {
              return Jn(Array(Math.ceil(t4.length / e4))).map(function(n3, r2) {
                return t4.slice(e4 * r2, e4 + e4 * r2);
              });
            } }, { key: "escapeRegex", value: function(t4) {
              return t4.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
            } }, { key: "getRtlOffset", value: function(t4, e4) {
              var n3 = t4, r2 = e4.indexOf("‫");
              return r2 < t4 && -1 != r2 && n3--, e4.indexOf("‬") < t4 && -1 != r2 && n3--, n3 < 0 ? 0 : n3;
            } }, { key: "isConstructor", value: function(t4) {
              try {
                Reflect.construct(String, [], t4);
              } catch (t5) {
                return false;
              }
              return true;
            } }], n2 = [{ key: "bindMethods", value: function(t4, e4) {
              var n3, r2 = (function(t5, e5) {
                var n4 = "undefined" != typeof Symbol && t5[Symbol.iterator] || t5["@@iterator"];
                if (!n4) {
                  if (Array.isArray(t5) || (n4 = Gn(t5)) || e5) {
                    n4 && (t5 = n4);
                    var r3 = 0, o3 = function() {
                    };
                    return { s: o3, n: function() {
                      return r3 >= t5.length ? { done: true } : { done: false, value: t5[r3++] };
                    }, e: function(t6) {
                      throw t6;
                    }, f: o3 };
                  }
                  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                }
                var i2, a2 = true, s2 = false;
                return { s: function() {
                  n4 = n4.call(t5);
                }, n: function() {
                  var t6 = n4.next();
                  return a2 = t6.done, t6;
                }, e: function(t6) {
                  s2 = true, i2 = t6;
                }, f: function() {
                  try {
                    a2 || null == n4.return || n4.return();
                  } finally {
                    if (s2) throw i2;
                  }
                } };
              })(Object.getOwnPropertyNames(t4.prototype));
              try {
                for (r2.s(); !(n3 = r2.n()).done; ) {
                  var o2 = n3.value;
                  "constructor" === o2 || "bindMethods" === o2 || (e4[o2] = e4[o2].bind(e4));
                }
              } catch (t5) {
                r2.e(t5);
              } finally {
                r2.f();
              }
            } }], e3 && Yn(t3.prototype, e3), n2 && Yn(t3, n2), Object.defineProperty(t3, "prototype", { writable: false }), t3;
            var t3, e3, n2;
          })();
          qn(Xn, "noop", function() {
          });
          var Qn = Xn;
          function Zn(t3) {
            return Zn = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t4) {
              return typeof t4;
            } : function(t4) {
              return t4 && "function" == typeof Symbol && t4.constructor === Symbol && t4 !== Symbol.prototype ? "symbol" : typeof t4;
            }, Zn(t3);
          }
          function tr(t3, e3) {
            for (var n2 = 0; n2 < e3.length; n2++) {
              var r2 = e3[n2];
              r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(t3, nr(r2.key), r2);
            }
          }
          function er(t3, e3, n2) {
            return (e3 = nr(e3)) in t3 ? Object.defineProperty(t3, e3, { value: n2, enumerable: true, configurable: true, writable: true }) : t3[e3] = n2, t3;
          }
          function nr(t3) {
            var e3 = (function(t4, e4) {
              if ("object" != Zn(t4) || !t4) return t4;
              var n2 = t4[Symbol.toPrimitive];
              if (void 0 !== n2) {
                var r2 = n2.call(t4, e4);
                if ("object" != Zn(r2)) return r2;
                throw new TypeError("@@toPrimitive must return a primitive value.");
              }
              return ("string" === e4 ? String : Number)(t4);
            })(t3, "string");
            return "symbol" == Zn(e3) ? e3 : e3 + "";
          }
          var rr = (function() {
            return t3 = function t4(e4) {
              var n3 = this, r2 = e4.dispatch, o2 = e4.getOptions;
              !(function(t5, e5) {
                if (!(t5 instanceof e5)) throw new TypeError("Cannot call a class as a function");
              })(this, t4), er(this, "getOptions", void 0), er(this, "dispatch", void 0), er(this, "isModifierKey", function(t5) {
                return t5.altKey || t5.ctrlKey || t5.shiftKey || ["Tab", "CapsLock", "Esc", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(t5.code || t5.key || n3.keyCodeToKey(null == t5 ? void 0 : t5.keyCode));
              }), this.dispatch = r2, this.getOptions = o2, Qn.bindMethods(t4, this);
            }, e3 = [{ key: "handleHighlightKeyDown", value: function(t4) {
              var e4 = this.getOptions();
              e4.physicalKeyboardHighlightPreventDefault && this.isModifierKey(t4) && (t4.preventDefault(), t4.stopImmediatePropagation());
              var n3 = this.getSimpleKeyboardLayoutKey(t4);
              this.dispatch(function(r2) {
                var o2, i2, a2 = r2.getButtonElement(n3), s2 = r2.getButtonElement("{".concat(n3, "}"));
                if (a2) o2 = a2, i2 = n3;
                else {
                  if (!s2) return;
                  o2 = s2, i2 = "{".concat(n3, "}");
                }
                var u2, c2, l2, f2, d2 = function(t5) {
                  t5.style.background = e4.physicalKeyboardHighlightBgColor || "#dadce4", t5.style.color = e4.physicalKeyboardHighlightTextColor || "black";
                };
                if (o2) if (Array.isArray(o2)) {
                  if (o2.forEach(function(t5) {
                    return d2(t5);
                  }), e4.physicalKeyboardHighlightPress) if (e4.physicalKeyboardHighlightPressUsePointerEvents) null === (u2 = o2[0]) || void 0 === u2 || null === (c2 = u2.onpointerdown) || void 0 === c2 || c2.call(u2, t4);
                  else if (e4.physicalKeyboardHighlightPressUseClick) {
                    var p2;
                    null === (p2 = o2[0]) || void 0 === p2 || p2.click();
                  } else r2.handleButtonClicked(i2, t4);
                } else d2(o2), e4.physicalKeyboardHighlightPress && (e4.physicalKeyboardHighlightPressUsePointerEvents ? null === (l2 = o2) || void 0 === l2 || null === (f2 = l2.onpointerdown) || void 0 === f2 || f2.call(l2, t4) : e4.physicalKeyboardHighlightPressUseClick ? o2.click() : r2.handleButtonClicked(i2, t4));
              });
            } }, { key: "handleHighlightKeyUp", value: function(t4) {
              var e4 = this.getOptions();
              e4.physicalKeyboardHighlightPreventDefault && this.isModifierKey(t4) && (t4.preventDefault(), t4.stopImmediatePropagation());
              var n3 = this.getSimpleKeyboardLayoutKey(t4);
              this.dispatch(function(r2) {
                var o2, i2, a2, s2 = r2.getButtonElement(n3) || r2.getButtonElement("{".concat(n3, "}")), u2 = function(t5) {
                  t5.removeAttribute && t5.removeAttribute("style");
                };
                s2 && (Array.isArray(s2) ? (s2.forEach(function(t5) {
                  return u2(t5);
                }), e4.physicalKeyboardHighlightPressUsePointerEvents && (null === (o2 = s2[0]) || void 0 === o2 || null === (i2 = o2.onpointerup) || void 0 === i2 || i2.call(o2, t4))) : (u2(s2), e4.physicalKeyboardHighlightPressUsePointerEvents && (null == s2 || null === (a2 = s2.onpointerup) || void 0 === a2 || a2.call(s2, t4))));
              });
            } }, { key: "getSimpleKeyboardLayoutKey", value: function(t4) {
              var e4, n3 = "", r2 = t4.code || t4.key || this.keyCodeToKey(null == t4 ? void 0 : t4.keyCode);
              return (n3 = null != r2 && r2.includes("Numpad") || null != r2 && r2.includes("Shift") || null != r2 && r2.includes("Space") || null != r2 && r2.includes("Backspace") || null != r2 && r2.includes("Control") || null != r2 && r2.includes("Alt") || null != r2 && r2.includes("Meta") ? t4.code || "" : t4.key || this.keyCodeToKey(null == t4 ? void 0 : t4.keyCode) || "").length > 1 ? null === (e4 = n3) || void 0 === e4 ? void 0 : e4.toLowerCase() : n3;
            } }, { key: "keyCodeToKey", value: function(t4) {
              return { 8: "Backspace", 9: "Tab", 13: "Enter", 16: "Shift", 17: "Ctrl", 18: "Alt", 19: "Pause", 20: "CapsLock", 27: "Esc", 32: "Space", 33: "PageUp", 34: "PageDown", 35: "End", 36: "Home", 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 45: "Insert", 46: "Delete", 48: "0", 49: "1", 50: "2", 51: "3", 52: "4", 53: "5", 54: "6", 55: "7", 56: "8", 57: "9", 65: "A", 66: "B", 67: "C", 68: "D", 69: "E", 70: "F", 71: "G", 72: "H", 73: "I", 74: "J", 75: "K", 76: "L", 77: "M", 78: "N", 79: "O", 80: "P", 81: "Q", 82: "R", 83: "S", 84: "T", 85: "U", 86: "V", 87: "W", 88: "X", 89: "Y", 90: "Z", 91: "Meta", 96: "Numpad0", 97: "Numpad1", 98: "Numpad2", 99: "Numpad3", 100: "Numpad4", 101: "Numpad5", 102: "Numpad6", 103: "Numpad7", 104: "Numpad8", 105: "Numpad9", 106: "NumpadMultiply", 107: "NumpadAdd", 109: "NumpadSubtract", 110: "NumpadDecimal", 111: "NumpadDivide", 112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6", 118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12", 144: "NumLock", 145: "ScrollLock", 186: ";", 187: "=", 188: ",", 189: "-", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\", 221: "]", 222: "'" }[t4] || "";
            } }], e3 && tr(t3.prototype, e3), n2 && tr(t3, n2), Object.defineProperty(t3, "prototype", { writable: false }), t3;
            var t3, e3, n2;
          })();
          function or(t3) {
            return or = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t4) {
              return typeof t4;
            } : function(t4) {
              return t4 && "function" == typeof Symbol && t4.constructor === Symbol && t4 !== Symbol.prototype ? "symbol" : typeof t4;
            }, or(t3);
          }
          function ir(t3, e3) {
            for (var n2 = 0; n2 < e3.length; n2++) {
              var r2 = e3[n2];
              r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(t3, sr(r2.key), r2);
            }
          }
          function ar(t3, e3, n2) {
            return (e3 = sr(e3)) in t3 ? Object.defineProperty(t3, e3, { value: n2, enumerable: true, configurable: true, writable: true }) : t3[e3] = n2, t3;
          }
          function sr(t3) {
            var e3 = (function(t4, e4) {
              if ("object" != or(t4) || !t4) return t4;
              var n2 = t4[Symbol.toPrimitive];
              if (void 0 !== n2) {
                var r2 = n2.call(t4, e4);
                if ("object" != or(r2)) return r2;
                throw new TypeError("@@toPrimitive must return a primitive value.");
              }
              return ("string" === e4 ? String : Number)(t4);
            })(t3, "string");
            return "symbol" == or(e3) ? e3 : e3 + "";
          }
          var ur = (function() {
            return t3 = function t4(e4) {
              var n3 = e4.utilities, r2 = e4.options;
              !(function(t5, e5) {
                if (!(t5 instanceof e5)) throw new TypeError("Cannot call a class as a function");
              })(this, t4), ar(this, "utilities", void 0), ar(this, "options", void 0), ar(this, "candidateBoxElement", void 0), ar(this, "pageIndex", 0), ar(this, "pageSize", void 0), this.utilities = n3, this.options = r2, Qn.bindMethods(t4, this), this.pageSize = this.utilities.getOptions().layoutCandidatesPageSize || 5;
            }, e3 = [{ key: "destroy", value: function() {
              this.candidateBoxElement && (this.candidateBoxElement.remove(), this.pageIndex = 0);
            } }, { key: "show", value: function(t4) {
              var e4 = this, n3 = t4.candidateValue, r2 = t4.targetElement, o2 = t4.onSelect;
              if (n3 && n3.length) {
                var i2 = this.utilities.chunkArray(n3.split(" "), this.pageSize);
                this.renderPage({ candidateListPages: i2, targetElement: r2, pageIndex: this.pageIndex, nbPages: i2.length, onItemSelected: function(t5, n4) {
                  o2(t5, n4), e4.destroy();
                } });
              }
            } }, { key: "renderPage", value: function(t4) {
              var e4, n3 = this, r2 = t4.candidateListPages, o2 = t4.targetElement, i2 = t4.pageIndex, a2 = t4.nbPages, s2 = t4.onItemSelected;
              null === (e4 = this.candidateBoxElement) || void 0 === e4 || e4.remove(), this.candidateBoxElement = document.createElement("div"), this.candidateBoxElement.className = "hg-candidate-box";
              var u2 = document.createElement("ul");
              u2.className = "hg-candidate-box-list", r2[i2].forEach(function(t5) {
                var e5, r3 = document.createElement("li"), o3 = function() {
                  var t6 = new (n3.options.useTouchEvents ? TouchEvent : MouseEvent)("click");
                  return Object.defineProperty(t6, "target", { value: r3 }), t6;
                };
                r3.className = "hg-candidate-box-list-item", r3.innerHTML = (null === (e5 = n3.options.display) || void 0 === e5 ? void 0 : e5[t5]) || t5, n3.options.useTouchEvents ? r3.ontouchstart = function(e6) {
                  return s2(t5, e6 || o3());
                } : r3.onclick = function() {
                  var e6 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : o3();
                  return s2(t5, e6);
                }, u2.appendChild(r3);
              });
              var c2 = i2 > 0, l2 = document.createElement("div");
              l2.classList.add("hg-candidate-box-prev"), c2 && l2.classList.add("hg-candidate-box-btn-active");
              var f2 = function() {
                c2 && n3.renderPage({ candidateListPages: r2, targetElement: o2, pageIndex: i2 - 1, nbPages: a2, onItemSelected: s2 });
              };
              this.options.useTouchEvents ? l2.ontouchstart = f2 : l2.onclick = f2, this.candidateBoxElement.appendChild(l2), this.candidateBoxElement.appendChild(u2);
              var d2 = i2 < a2 - 1, p2 = document.createElement("div");
              p2.classList.add("hg-candidate-box-next"), d2 && p2.classList.add("hg-candidate-box-btn-active");
              var h2 = function() {
                d2 && n3.renderPage({ candidateListPages: r2, targetElement: o2, pageIndex: i2 + 1, nbPages: a2, onItemSelected: s2 });
              };
              this.options.useTouchEvents ? p2.ontouchstart = h2 : p2.onclick = h2, this.candidateBoxElement.appendChild(p2), o2.prepend(this.candidateBoxElement);
            } }], e3 && ir(t3.prototype, e3), n2 && ir(t3, n2), Object.defineProperty(t3, "prototype", { writable: false }), t3;
            var t3, e3, n2;
          })(), cr = ur;
          function lr(t3) {
            return (function(t4) {
              if (Array.isArray(t4)) return fr(t4);
            })(t3) || (function(t4) {
              if ("undefined" != typeof Symbol && null != t4[Symbol.iterator] || null != t4["@@iterator"]) return Array.from(t4);
            })(t3) || (function(t4, e3) {
              if (t4) {
                if ("string" == typeof t4) return fr(t4, e3);
                var n2 = {}.toString.call(t4).slice(8, -1);
                return "Object" === n2 && t4.constructor && (n2 = t4.constructor.name), "Map" === n2 || "Set" === n2 ? Array.from(t4) : "Arguments" === n2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2) ? fr(t4, e3) : void 0;
              }
            })(t3) || (function() {
              throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
            })();
          }
          function fr(t3, e3) {
            (null == e3 || e3 > t3.length) && (e3 = t3.length);
            for (var n2 = 0, r2 = Array(e3); n2 < e3; n2++) r2[n2] = t3[n2];
            return r2;
          }
          function dr(t3) {
            return dr = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t4) {
              return typeof t4;
            } : function(t4) {
              return t4 && "function" == typeof Symbol && t4.constructor === Symbol && t4 !== Symbol.prototype ? "symbol" : typeof t4;
            }, dr(t3);
          }
          function pr(t3, e3) {
            var n2 = Object.keys(t3);
            if (Object.getOwnPropertySymbols) {
              var r2 = Object.getOwnPropertySymbols(t3);
              e3 && (r2 = r2.filter(function(e4) {
                return Object.getOwnPropertyDescriptor(t3, e4).enumerable;
              })), n2.push.apply(n2, r2);
            }
            return n2;
          }
          function hr(t3, e3) {
            for (var n2 = 0; n2 < e3.length; n2++) {
              var r2 = e3[n2];
              r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(t3, yr(r2.key), r2);
            }
          }
          function vr(t3, e3, n2) {
            return (e3 = yr(e3)) in t3 ? Object.defineProperty(t3, e3, { value: n2, enumerable: true, configurable: true, writable: true }) : t3[e3] = n2, t3;
          }
          function yr(t3) {
            var e3 = (function(t4, e4) {
              if ("object" != dr(t4) || !t4) return t4;
              var n2 = t4[Symbol.toPrimitive];
              if (void 0 !== n2) {
                var r2 = n2.call(t4, e4);
                if ("object" != dr(r2)) return r2;
                throw new TypeError("@@toPrimitive must return a primitive value.");
              }
              return ("string" === e4 ? String : Number)(t4);
            })(t3, "string");
            return "symbol" == dr(e3) ? e3 : e3 + "";
          }
          var gr = (function() {
            return t3 = function t4(e4, n3) {
              var r2 = this;
              if ((function(t5, e5) {
                if (!(t5 instanceof e5)) throw new TypeError("Cannot call a class as a function");
              })(this, t4), vr(this, "input", void 0), vr(this, "options", void 0), vr(this, "utilities", void 0), vr(this, "caretPosition", void 0), vr(this, "caretPositionEnd", void 0), vr(this, "keyboardDOM", void 0), vr(this, "keyboardPluginClasses", void 0), vr(this, "keyboardDOMClass", void 0), vr(this, "buttonElements", void 0), vr(this, "currentInstanceName", void 0), vr(this, "allKeyboardInstances", void 0), vr(this, "keyboardInstanceNames", void 0), vr(this, "isFirstKeyboardInstance", void 0), vr(this, "physicalKeyboard", void 0), vr(this, "modules", void 0), vr(this, "activeButtonClass", void 0), vr(this, "holdInteractionTimeout", void 0), vr(this, "holdTimeout", void 0), vr(this, "isMouseHold", void 0), vr(this, "initialized", void 0), vr(this, "candidateBox", void 0), vr(this, "keyboardRowsDOM", void 0), vr(this, "defaultName", "default"), vr(this, "activeInputElement", null), vr(this, "handleParams", function(t5, e5) {
                var n4, r3, o3;
                if ("string" == typeof t5) n4 = t5.split(".").join(""), r3 = document.querySelector(".".concat(n4)), o3 = e5;
                else if (t5 instanceof HTMLDivElement) {
                  if (!t5.className) throw console.warn("Any DOM element passed as parameter must have a class."), new Error("KEYBOARD_DOM_CLASS_ERROR");
                  n4 = t5.className.split(" ")[0], r3 = t5, o3 = e5;
                } else n4 = "simple-keyboard", r3 = document.querySelector(".".concat(n4)), o3 = t5;
                return { keyboardDOMClass: n4, keyboardDOM: r3, options: o3 };
              }), vr(this, "getOptions", function() {
                return r2.options;
              }), vr(this, "getCaretPosition", function() {
                return r2.caretPosition;
              }), vr(this, "getCaretPositionEnd", function() {
                return r2.caretPositionEnd;
              }), vr(this, "registerModule", function(t5, e5) {
                r2.modules[t5] || (r2.modules[t5] = {}), e5(r2.modules[t5]);
              }), vr(this, "getKeyboardClassString", function() {
                for (var t5 = arguments.length, e5 = new Array(t5), n4 = 0; n4 < t5; n4++) e5[n4] = arguments[n4];
                return [r2.keyboardDOMClass].concat(e5).filter(function(t6) {
                  return !!t6;
                }).join(" ");
              }), "undefined" != typeof window) {
                var o2 = this.handleParams(e4, n3), i2 = o2.keyboardDOMClass, a2 = o2.keyboardDOM, s2 = o2.options, u2 = void 0 === s2 ? {} : s2;
                this.utilities = new Qn({ getOptions: this.getOptions, getCaretPosition: this.getCaretPosition, getCaretPositionEnd: this.getCaretPositionEnd, dispatch: this.dispatch }), this.caretPosition = null, this.caretPositionEnd = null, this.keyboardDOM = a2, this.options = (function(t5) {
                  for (var e5 = 1; e5 < arguments.length; e5++) {
                    var n4 = null != arguments[e5] ? arguments[e5] : {};
                    e5 % 2 ? pr(Object(n4), true).forEach(function(e6) {
                      vr(t5, e6, n4[e6]);
                    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t5, Object.getOwnPropertyDescriptors(n4)) : pr(Object(n4)).forEach(function(e6) {
                      Object.defineProperty(t5, e6, Object.getOwnPropertyDescriptor(n4, e6));
                    });
                  }
                  return t5;
                })({ layoutName: "default", theme: "hg-theme-default", inputName: "default", preventMouseDownDefault: false, enableLayoutCandidates: true, excludeFromLayout: {} }, u2), this.keyboardPluginClasses = "", Qn.bindMethods(t4, this);
                var c2 = this.options.inputName, l2 = void 0 === c2 ? this.defaultName : c2;
                if (this.input = {}, this.input[l2] = "", this.keyboardDOMClass = i2, this.buttonElements = {}, window.SimpleKeyboardInstances || (window.SimpleKeyboardInstances = {}), this.currentInstanceName = this.utilities.camelCase(this.keyboardDOMClass), window.SimpleKeyboardInstances[this.currentInstanceName] = this, this.allKeyboardInstances = window.SimpleKeyboardInstances, this.keyboardInstanceNames = Object.keys(window.SimpleKeyboardInstances), this.isFirstKeyboardInstance = this.keyboardInstanceNames[0] === this.currentInstanceName, this.physicalKeyboard = new rr({ dispatch: this.dispatch, getOptions: this.getOptions }), this.candidateBox = this.options.enableLayoutCandidates ? new cr({ utilities: this.utilities, options: this.options }) : null, !this.keyboardDOM) throw console.warn('".'.concat(i2, '" was not found in the DOM.')), new Error("KEYBOARD_DOM_ERROR");
                this.render(), this.modules = {}, this.loadModules();
              }
            }, e3 = [{ key: "setCaretPosition", value: function(t4) {
              var e4 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : t4;
              this.caretPosition = t4, this.caretPositionEnd = e4;
            } }, { key: "getInputCandidates", value: function(t4) {
              var e4 = this, n3 = this.options, r2 = n3.layoutCandidates, o2 = n3.layoutCandidatesCaseSensitiveMatch;
              if (!r2 || "object" !== dr(r2)) return {};
              var i2 = Object.keys(r2).filter(function(n4) {
                var r3 = t4.substring(0, e4.getCaretPositionEnd() || 0) || t4, i3 = new RegExp("".concat(e4.utilities.escapeRegex(n4), "$"), o2 ? "g" : "gi");
                return !!lr(r3.matchAll(i3)).length;
              });
              if (i2.length > 1) {
                var a2 = i2.sort(function(t5, e5) {
                  return e5.length - t5.length;
                })[0];
                return { candidateKey: a2, candidateValue: r2[a2] };
              }
              if (i2.length) {
                var s2 = i2[0];
                return { candidateKey: s2, candidateValue: r2[s2] };
              }
              return {};
            } }, { key: "showCandidatesBox", value: function(t4, e4, n3) {
              var r2 = this;
              this.candidateBox && this.candidateBox.show({ candidateValue: e4, targetElement: n3, onSelect: function(e5, n4) {
                var o2 = r2.options, i2 = o2.layoutCandidatesCaseSensitiveMatch, a2 = o2.disableCandidateNormalization, s2 = o2.enableLayoutCandidatesKeyPress, u2 = e5;
                a2 || (u2 = e5.normalize("NFD")), "function" == typeof r2.options.beforeInputUpdate && r2.options.beforeInputUpdate(r2);
                var c2 = r2.getInput(r2.options.inputName, true), l2 = r2.getCaretPositionEnd() || 0, f2 = c2.substring(0, l2 || 0) || c2, d2 = new RegExp("".concat(r2.utilities.escapeRegex(t4), "$"), i2 ? "g" : "gi"), p2 = f2.replace(d2, u2), h2 = c2.replace(f2, p2), v2 = p2.length - f2.length, y2 = (l2 || c2.length) + v2;
                y2 < 0 && (y2 = 0), r2.setInput(h2, r2.options.inputName, true), r2.setCaretPosition(y2), s2 && "function" == typeof r2.options.onKeyPress && r2.options.onKeyPress(e5, n4), "function" == typeof r2.options.onChange && r2.options.onChange(r2.getInput(r2.options.inputName, true), n4), "function" == typeof r2.options.onChangeAll && r2.options.onChangeAll(r2.getAllInputs(), n4);
              } });
            } }, { key: "handleButtonClicked", value: function(t4, e4) {
              var n3 = this.options, r2 = n3.inputName, o2 = void 0 === r2 ? this.defaultName : r2, i2 = n3.debug;
              if ("{//}" !== t4) {
                this.input[o2] || (this.input[o2] = ""), "function" == typeof this.options.beforeInputUpdate && this.options.beforeInputUpdate(this);
                var a2 = this.utilities.getUpdatedInput(t4, this.input[o2], this.caretPosition, this.caretPositionEnd);
                if (this.utilities.isStandardButton(t4) && this.activeInputElement && this.input[o2] && this.input[o2] === a2 && 0 === this.caretPosition && this.caretPositionEnd === a2.length) return this.setInput("", this.options.inputName, true), this.setCaretPosition(0), this.activeInputElement.value = "", this.activeInputElement.setSelectionRange(0, 0), void this.handleButtonClicked(t4, e4);
                if ("function" == typeof this.options.onKeyPress && this.options.onKeyPress(t4, e4), this.input[o2] !== a2 && (!this.options.inputPattern || this.options.inputPattern && this.inputPatternIsValid(a2))) {
                  if (this.options.maxLength && this.utilities.handleMaxLength(this.input, a2)) return;
                  var s2 = this.utilities.getUpdatedInput(t4, this.input[o2], this.caretPosition, this.caretPositionEnd, true);
                  if (this.setInput(s2, this.options.inputName, true), i2 && console.log("Input changed:", this.getAllInputs()), this.options.debug && console.log("Caret at: ", this.getCaretPosition(), this.getCaretPositionEnd(), "(".concat(this.keyboardDOMClass, ")"), null == e4 ? void 0 : e4.type), this.options.syncInstanceInputs && this.syncInstanceInputs(), "function" == typeof this.options.onChange && this.options.onChange(this.getInput(this.options.inputName, true), e4), "function" == typeof this.options.onChangeAll && this.options.onChangeAll(this.getAllInputs(), e4), null != e4 && e4.target && this.options.enableLayoutCandidates) {
                    var u2, c2 = this.getInputCandidates(a2), l2 = c2.candidateKey, f2 = c2.candidateValue;
                    l2 && f2 ? this.showCandidatesBox(l2, f2, this.keyboardDOM) : null === (u2 = this.candidateBox) || void 0 === u2 || u2.destroy();
                  }
                }
                this.caretPositionEnd && this.caretPosition !== this.caretPositionEnd && (this.setCaretPosition(this.caretPositionEnd, this.caretPositionEnd), this.activeInputElement && this.activeInputElement.setSelectionRange(this.caretPositionEnd, this.caretPositionEnd), this.options.debug && console.log("Caret position aligned", this.caretPosition)), i2 && console.log("Key pressed:", t4);
              }
            } }, { key: "getMouseHold", value: function() {
              return this.isMouseHold;
            } }, { key: "setMouseHold", value: function(t4) {
              this.options.syncInstanceInputs ? this.dispatch(function(e4) {
                e4.isMouseHold = t4;
              }) : this.isMouseHold = t4;
            } }, { key: "handleButtonMouseDown", value: function(t4, e4) {
              var n3 = this;
              e4 && (this.options.preventMouseDownDefault && e4.preventDefault(), this.options.stopMouseDownPropagation && e4.stopPropagation(), e4.target.classList.add(this.activeButtonClass)), this.holdInteractionTimeout && clearTimeout(this.holdInteractionTimeout), this.holdTimeout && clearTimeout(this.holdTimeout), this.setMouseHold(true), this.options.disableButtonHold || (this.holdTimeout = window.setTimeout(function() {
                (n3.getMouseHold() && (!t4.includes("{") && !t4.includes("}") || "{delete}" === t4 || "{backspace}" === t4 || "{bksp}" === t4 || "{space}" === t4 || "{tab}" === t4) || "{arrowright}" === t4 || "{arrowleft}" === t4 || "{arrowup}" === t4 || "{arrowdown}" === t4) && (n3.options.debug && console.log("Button held:", t4), n3.handleButtonHold(t4)), clearTimeout(n3.holdTimeout);
              }, 500));
            } }, { key: "handleButtonMouseUp", value: function(t4, e4) {
              var n3 = this;
              e4 && (this.options.preventMouseUpDefault && e4.preventDefault && e4.preventDefault(), this.options.stopMouseUpPropagation && e4.stopPropagation && e4.stopPropagation(), !(e4.target === this.keyboardDOM || e4.target && this.keyboardDOM.contains(e4.target) || this.candidateBox && this.candidateBox.candidateBoxElement && (e4.target === this.candidateBox.candidateBoxElement || e4.target && this.candidateBox.candidateBoxElement.contains(e4.target))) && this.candidateBox && this.candidateBox.destroy()), this.recurseButtons(function(t5) {
                t5.classList.remove(n3.activeButtonClass);
              }), this.setMouseHold(false), this.holdInteractionTimeout && clearTimeout(this.holdInteractionTimeout), t4 && "function" == typeof this.options.onKeyReleased && this.options.onKeyReleased(t4, e4);
            } }, { key: "handleKeyboardContainerMouseDown", value: function(t4) {
              this.options.preventMouseDownDefault && t4.preventDefault();
            } }, { key: "handleButtonHold", value: function(t4) {
              var e4 = this;
              this.holdInteractionTimeout && clearTimeout(this.holdInteractionTimeout), this.holdInteractionTimeout = window.setTimeout(function() {
                e4.getMouseHold() ? (e4.handleButtonClicked(t4), e4.handleButtonHold(t4)) : clearTimeout(e4.holdInteractionTimeout);
              }, 100);
            } }, { key: "syncInstanceInputs", value: function() {
              var t4 = this;
              this.dispatch(function(e4) {
                e4.replaceInput(t4.input), e4.setCaretPosition(t4.caretPosition, t4.caretPositionEnd);
              });
            } }, { key: "clearInput", value: function() {
              var t4 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : this.options.inputName || this.defaultName;
              this.input[t4] = "", this.setCaretPosition(0), this.options.syncInstanceInputs && this.syncInstanceInputs();
            } }, { key: "getInput", value: function() {
              var t4 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : this.options.inputName || this.defaultName, e4 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
              return this.options.syncInstanceInputs && !e4 && this.syncInstanceInputs(), this.options.rtl ? "‫" + this.input[t4].replace("‫", "").replace("‬", "") + "‬" : this.input[t4];
            } }, { key: "getAllInputs", value: function() {
              var t4 = this, e4 = {};
              return Object.keys(this.input).forEach(function(n3) {
                e4[n3] = t4.getInput(n3, true);
              }), e4;
            } }, { key: "setInput", value: function(t4) {
              var e4 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.options.inputName || this.defaultName, n3 = arguments.length > 2 ? arguments[2] : void 0;
              this.input[e4] = t4, !n3 && this.options.syncInstanceInputs && this.syncInstanceInputs();
            } }, { key: "replaceInput", value: function(t4) {
              this.input = t4;
            } }, { key: "setOptions", value: function() {
              var t4 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}, e4 = this.changedOptions(t4);
              this.options = Object.assign(this.options, t4), e4.length && (this.options.debug && console.log("changedOptions", e4), this.onSetOptions(e4), this.render());
            } }, { key: "changedOptions", value: function(t4) {
              var e4 = this;
              return Object.keys(t4).filter(function(n3) {
                return JSON.stringify(t4[n3]) !== JSON.stringify(e4.options[n3]);
              });
            } }, { key: "onSetOptions", value: function() {
              var t4 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [];
              t4.includes("layoutName") && this.candidateBox && this.candidateBox.destroy(), (t4.includes("layoutCandidatesPageSize") || t4.includes("layoutCandidates")) && this.candidateBox && (this.candidateBox.destroy(), this.candidateBox = new cr({ utilities: this.utilities, options: this.options }));
            } }, { key: "resetRows", value: function() {
              this.keyboardRowsDOM && this.keyboardRowsDOM.remove(), this.keyboardDOM.className = this.keyboardDOMClass, this.keyboardDOM.setAttribute("data-skInstance", this.currentInstanceName), this.buttonElements = {};
            } }, { key: "dispatch", value: function(t4) {
              if (!window.SimpleKeyboardInstances) throw console.warn("SimpleKeyboardInstances is not defined. Dispatch cannot be called."), new Error("INSTANCES_VAR_ERROR");
              return Object.keys(window.SimpleKeyboardInstances).forEach(function(e4) {
                t4(window.SimpleKeyboardInstances[e4], e4);
              });
            } }, { key: "addButtonTheme", value: function(t4, e4) {
              var n3 = this;
              e4 && t4 && (t4.split(" ").forEach(function(r2) {
                e4.split(" ").forEach(function(e5) {
                  n3.options.buttonTheme || (n3.options.buttonTheme = []);
                  var o2 = false;
                  n3.options.buttonTheme.map(function(t5) {
                    if (null != t5 && t5.class.split(" ").includes(e5)) {
                      o2 = true;
                      var n4 = t5.buttons.split(" ");
                      n4.includes(r2) || (o2 = true, n4.push(r2), t5.buttons = n4.join(" "));
                    }
                    return t5;
                  }), o2 || n3.options.buttonTheme.push({ class: e5, buttons: t4 });
                });
              }), this.render());
            } }, { key: "removeButtonTheme", value: function(t4, e4) {
              var n3 = this;
              if (!t4 && !e4) return this.options.buttonTheme = [], void this.render();
              t4 && Array.isArray(this.options.buttonTheme) && this.options.buttonTheme.length && (t4.split(" ").forEach(function(t5) {
                var r2;
                null === (r2 = n3.options) || void 0 === r2 || null === (r2 = r2.buttonTheme) || void 0 === r2 || r2.map(function(r3, o2) {
                  if (r3 && e4 && e4.includes(r3.class) || !e4) {
                    var i2, a2, s2 = null === (i2 = r3) || void 0 === i2 ? void 0 : i2.buttons.split(" ").filter(function(e5) {
                      return e5 !== t5;
                    });
                    r3 && null != s2 && s2.length ? r3.buttons = s2.join(" ") : (null === (a2 = n3.options.buttonTheme) || void 0 === a2 || a2.splice(o2, 1), r3 = null);
                  }
                  return r3;
                });
              }), this.render());
            } }, { key: "getButtonElement", value: function(t4) {
              var e4, n3 = this.buttonElements[t4];
              return n3 && (e4 = n3.length > 1 ? n3 : n3[0]), e4;
            } }, { key: "inputPatternIsValid", value: function(t4) {
              var e4, n3 = this.options.inputPattern;
              if ((e4 = n3 instanceof RegExp ? n3 : n3[this.options.inputName || this.defaultName]) && t4) {
                var r2 = e4.test(t4);
                return this.options.debug && console.log('inputPattern ("'.concat(e4, '"): ').concat(r2 ? "passed" : "did not pass!")), r2;
              }
              return true;
            } }, { key: "setEventListeners", value: function() {
              if (this.isFirstKeyboardInstance || !this.allKeyboardInstances) {
                this.options.debug && console.log("Caret handling started (".concat(this.keyboardDOMClass, ")"));
                var t4 = this.options.physicalKeyboardHighlightPreventDefault, e4 = void 0 !== t4 && t4;
                document.addEventListener("keyup", this.handleKeyUp, e4), document.addEventListener("keydown", this.handleKeyDown, e4), document.addEventListener("mouseup", this.handleMouseUp), document.addEventListener("touchend", this.handleTouchEnd), this.options.updateCaretOnSelectionChange && document.addEventListener("selectionchange", this.handleSelectionChange), document.addEventListener("select", this.handleSelect);
              }
            } }, { key: "handleKeyUp", value: function(t4) {
              this.caretEventHandler(t4), this.options.physicalKeyboardHighlight && this.physicalKeyboard.handleHighlightKeyUp(t4);
            } }, { key: "handleKeyDown", value: function(t4) {
              this.options.physicalKeyboardHighlight && this.physicalKeyboard.handleHighlightKeyDown(t4);
            } }, { key: "handleMouseUp", value: function(t4) {
              this.caretEventHandler(t4);
            } }, { key: "handleTouchEnd", value: function(t4) {
              this.caretEventHandler(t4);
            } }, { key: "handleSelect", value: function(t4) {
              this.caretEventHandler(t4);
            } }, { key: "handleSelectionChange", value: function(t4) {
              navigator.userAgent.includes("Firefox") || this.caretEventHandler(t4);
            } }, { key: "caretEventHandler", value: function(t4) {
              var e4, n3 = this;
              t4.target.tagName && (e4 = t4.target.tagName.toLowerCase()), this.dispatch(function(r2) {
                var o2 = t4.target === r2.keyboardDOM || t4.target && r2.keyboardDOM.contains(t4.target);
                if (n3.options.syncInstanceInputs) {
                  var i2 = "function" == typeof t4.composedPath ? t4.composedPath() : t4.path;
                  Array.isArray(i2) && (o2 = i2.some(function(t5) {
                    var e5;
                    return null == t5 || null === (e5 = t5.hasAttribute) || void 0 === e5 ? void 0 : e5.call(t5, "data-skInstance");
                  }));
                }
                if (("textarea" === e4 || "input" === e4 && ["text", "search", "url", "tel", "password"].includes(t4.target.type)) && !r2.options.disableCaretPositioning) {
                  var a2 = t4.target.selectionStart, s2 = t4.target.selectionEnd;
                  r2.options.rtl && (a2 = r2.utilities.getRtlOffset(a2, r2.getInput()), s2 = r2.utilities.getRtlOffset(s2, r2.getInput())), r2.setCaretPosition(a2, s2), r2.activeInputElement = t4.target, r2.options.debug && console.log("Caret at: ", r2.getCaretPosition(), r2.getCaretPositionEnd(), t4 && t4.target.tagName.toLowerCase(), "(".concat(r2.keyboardDOMClass, ")"), null == t4 ? void 0 : t4.type);
                } else !r2.options.disableCaretPositioning && o2 || "selectionchange" === (null == t4 ? void 0 : t4.type) || (r2.setCaretPosition(null), r2.activeInputElement = null, r2.options.debug && console.log('Caret position reset due to "'.concat(null == t4 ? void 0 : t4.type, '" event'), t4));
              });
            } }, { key: "recurseButtons", value: function(t4) {
              var e4 = this;
              t4 && Object.keys(this.buttonElements).forEach(function(n3) {
                return e4.buttonElements[n3].forEach(t4);
              });
            } }, { key: "destroy", value: function() {
              this.options.debug && console.log("Destroying simple-keyboard instance: ".concat(this.currentInstanceName));
              var t4 = this.options.physicalKeyboardHighlightPreventDefault, e4 = void 0 !== t4 && t4;
              document.removeEventListener("keyup", this.handleKeyUp, e4), document.removeEventListener("keydown", this.handleKeyDown, e4), document.removeEventListener("mouseup", this.handleMouseUp), document.removeEventListener("touchend", this.handleTouchEnd), document.removeEventListener("select", this.handleSelect), this.options.updateCaretOnSelectionChange && document.removeEventListener("selectionchange", this.handleSelectionChange), document.onpointerup = null, document.ontouchend = null, document.ontouchcancel = null, document.onmouseup = null, this.recurseButtons(function(t5) {
                t5 && (t5.onpointerdown = null, t5.onpointerup = null, t5.onpointercancel = null, t5.ontouchstart = null, t5.ontouchend = null, t5.ontouchcancel = null, t5.onclick = null, t5.onmousedown = null, t5.onmouseup = null, t5.remove(), t5 = null);
              }), this.keyboardDOM.onpointerdown = null, this.keyboardDOM.ontouchstart = null, this.keyboardDOM.onmousedown = null, this.resetRows(), this.candidateBox && (this.candidateBox.destroy(), this.candidateBox = null), this.activeInputElement = null, this.keyboardDOM.removeAttribute("data-skInstance"), this.keyboardDOM.innerHTML = "", window.SimpleKeyboardInstances[this.currentInstanceName] = null, delete window.SimpleKeyboardInstances[this.currentInstanceName], this.initialized = false;
            } }, { key: "getButtonThemeClasses", value: function(t4) {
              var e4 = this.options.buttonTheme, n3 = [];
              return Array.isArray(e4) && e4.forEach(function(e5) {
                if (e5 && e5.class && "string" == typeof e5.class && e5.buttons && "string" == typeof e5.buttons) {
                  var r2 = e5.class.split(" ");
                  e5.buttons.split(" ").includes(t4) && (n3 = [].concat(lr(n3), lr(r2)));
                } else console.warn('Incorrect "buttonTheme". Please check the documentation.', e5);
              }), n3;
            } }, { key: "setDOMButtonAttributes", value: function(t4, e4) {
              var n3 = this.options.buttonAttributes;
              Array.isArray(n3) && n3.forEach(function(n4) {
                n4.attribute && "string" == typeof n4.attribute && n4.value && "string" == typeof n4.value ? n4.buttons && "string" == typeof n4.buttons ? n4.buttons.split(" ").includes(t4) && e4(n4.attribute, n4.value) : e4(n4.attribute, n4.value) : console.warn('Incorrect "buttonAttributes". Please check the documentation.', n4);
              });
            } }, { key: "onTouchDeviceDetected", value: function() {
              this.processAutoTouchEvents(), this.disableContextualWindow();
            } }, { key: "disableContextualWindow", value: function() {
              window.oncontextmenu = function(t4) {
                var e4;
                if (null !== (e4 = t4.target.classList) && void 0 !== e4 && e4.contains("hg-button")) return t4.preventDefault(), t4.stopPropagation(), false;
              };
            } }, { key: "processAutoTouchEvents", value: function() {
              this.options.autoUseTouchEvents && (this.options.useTouchEvents = true, this.options.debug && console.log("autoUseTouchEvents: Touch device detected, useTouchEvents enabled."));
            } }, { key: "onInit", value: function() {
              this.options.debug && console.log("".concat(this.keyboardDOMClass, " Initialized")), this.setEventListeners(), "function" == typeof this.options.onInit && this.options.onInit(this);
            } }, { key: "beforeFirstRender", value: function() {
              this.utilities.isTouchDevice() && this.onTouchDeviceDetected(), "function" == typeof this.options.beforeFirstRender && this.options.beforeFirstRender(this), this.isFirstKeyboardInstance && this.utilities.pointerEventsSupported() && !this.options.useTouchEvents && !this.options.useMouseEvents && this.options.debug && console.log("Using PointerEvents as it is supported by this browser"), this.options.useTouchEvents && this.options.debug && console.log("useTouchEvents has been enabled. Only touch events will be used.");
            } }, { key: "beforeRender", value: function() {
              "function" == typeof this.options.beforeRender && this.options.beforeRender(this);
            } }, { key: "onRender", value: function() {
              "function" == typeof this.options.onRender && this.options.onRender(this);
            } }, { key: "onModulesLoaded", value: function() {
              "function" == typeof this.options.onModulesLoaded && this.options.onModulesLoaded(this);
            } }, { key: "loadModules", value: function() {
              var t4 = this;
              Array.isArray(this.options.modules) && (this.options.modules.forEach(function(e4) {
                var n3 = t4.utilities.isConstructor(e4) ? new e4(t4) : e4(t4);
                n3.init && n3.init(t4);
              }), this.keyboardPluginClasses = "modules-loaded", this.render(), this.onModulesLoaded());
            } }, { key: "getModuleProp", value: function(t4, e4) {
              return !!this.modules[t4] && this.modules[t4][e4];
            } }, { key: "getModulesList", value: function() {
              return Object.keys(this.modules);
            } }, { key: "parseRowDOMContainers", value: function(t4, e4, n3, r2) {
              var o2 = this, i2 = Array.from(t4.children), a2 = 0;
              return i2.length && n3.forEach(function(n4, s2) {
                var u2 = r2[s2];
                if (!(u2 && u2 > n4)) return false;
                var c2 = n4 - a2, l2 = u2 - a2, f2 = document.createElement("div");
                f2.className += "hg-button-container";
                var d2 = "".concat(o2.options.layoutName, "-r").concat(e4, "c").concat(s2);
                f2.setAttribute("data-skUID", d2);
                var p2 = i2.splice(c2, l2 - c2 + 1);
                a2 += l2 - c2, p2.forEach(function(t5) {
                  return f2.appendChild(t5);
                }), i2.splice(c2, 0, f2), t4.innerHTML = "", i2.forEach(function(e5) {
                  return t4.appendChild(e5);
                }), o2.options.debug && console.log("rowDOMContainer", p2, c2, l2, a2 + 1);
              }), t4;
            } }, { key: "render", value: function() {
              var t4 = this;
              this.resetRows(), this.initialized || this.beforeFirstRender(), this.beforeRender();
              var e4 = "hg-layout-".concat(this.options.layoutName), n3 = this.options.layout || { default: ["` 1 2 3 4 5 6 7 8 9 0 - = {bksp}", "{tab} q w e r t y u i o p [ ] \\", "{lock} a s d f g h j k l ; ' {enter}", "{shift} z x c v b n m , . / {shift}", ".com @ {space}"], shift: ["~ ! @ # $ % ^ & * ( ) _ + {bksp}", "{tab} Q W E R T Y U I O P { } |", '{lock} A S D F G H J K L : " {enter}', "{shift} Z X C V B N M < > ? {shift}", ".com @ {space}"] }, r2 = this.options.useTouchEvents || false, o2 = r2 ? "hg-touch-events" : "", i2 = this.options.useMouseEvents || false, a2 = this.options.disableRowButtonContainers;
              this.keyboardDOM.className = this.getKeyboardClassString(this.options.theme, e4, this.keyboardPluginClasses, o2), this.keyboardDOM.setAttribute("data-skInstance", this.currentInstanceName), this.keyboardRowsDOM = document.createElement("div"), this.keyboardRowsDOM.className = "hg-rows", n3[this.options.layoutName || this.defaultName].forEach(function(e5, n4) {
                var o3 = e5.split(" ");
                t4.options.excludeFromLayout && t4.options.excludeFromLayout[t4.options.layoutName || t4.defaultName] && (o3 = o3.filter(function(e6) {
                  return t4.options.excludeFromLayout && !t4.options.excludeFromLayout[t4.options.layoutName || t4.defaultName].includes(e6);
                }));
                var s2 = document.createElement("div");
                s2.className += "hg-row";
                var u2 = [], c2 = [];
                o3.forEach(function(e6, o4) {
                  var l2, f2 = !a2 && "string" == typeof e6 && e6.length > 1 && 0 === e6.indexOf("["), d2 = !a2 && "string" == typeof e6 && e6.length > 1 && e6.indexOf("]") === e6.length - 1;
                  f2 && (u2.push(o4), e6 = e6.replace(/\[/g, "")), d2 && (c2.push(o4), e6 = e6.replace(/\]/g, ""));
                  var p2 = t4.utilities.getButtonClass(e6), h2 = t4.utilities.getButtonDisplayName(e6, t4.options.display, t4.options.mergeDisplay), v2 = t4.options.useButtonTag ? "button" : "div", y2 = document.createElement(v2);
                  y2.className += "hg-button ".concat(p2), (l2 = y2.classList).add.apply(l2, lr(t4.getButtonThemeClasses(e6))), t4.setDOMButtonAttributes(e6, function(t5, e7) {
                    y2.setAttribute(t5, e7);
                  }), t4.activeButtonClass = "hg-activeButton", !t4.utilities.pointerEventsSupported() || r2 || i2 ? r2 ? (y2.ontouchstart = function(n5) {
                    t4.handleButtonClicked(e6, n5), t4.handleButtonMouseDown(e6, n5);
                  }, y2.ontouchend = function(n5) {
                    t4.handleButtonMouseUp(e6, n5);
                  }, y2.ontouchcancel = function(n5) {
                    t4.handleButtonMouseUp(e6, n5);
                  }) : (y2.onclick = function(n5) {
                    t4.setMouseHold(false), "function" == typeof t4.options.onKeyReleased || t4.options.useMouseEvents && t4.options.clickOnMouseDown || t4.handleButtonClicked(e6, n5);
                  }, y2.onmousedown = function(n5) {
                    ("function" == typeof t4.options.onKeyReleased || t4.options.useMouseEvents && t4.options.clickOnMouseDown) && !t4.isMouseHold && t4.handleButtonClicked(e6, n5), t4.handleButtonMouseDown(e6, n5);
                  }, y2.onmouseup = function(n5) {
                    t4.handleButtonMouseUp(e6, n5);
                  }) : (y2.onpointerdown = function(n5) {
                    t4.handleButtonClicked(e6, n5), t4.handleButtonMouseDown(e6, n5);
                  }, y2.onpointerup = function(n5) {
                    t4.handleButtonMouseUp(e6, n5);
                  }, y2.onpointercancel = function(n5) {
                    t4.handleButtonMouseUp(e6, n5);
                  }), y2.setAttribute("data-skBtn", e6);
                  var g2 = "".concat(t4.options.layoutName, "-r").concat(n4, "b").concat(o4);
                  y2.setAttribute("data-skBtnUID", g2);
                  var m2 = document.createElement("span");
                  m2.innerHTML = h2, y2.appendChild(m2), t4.buttonElements[e6] || (t4.buttonElements[e6] = []), t4.buttonElements[e6].push(y2), s2.appendChild(y2);
                }), s2 = t4.parseRowDOMContainers(s2, n4, u2, c2), t4.keyboardRowsDOM.appendChild(s2);
              }), this.keyboardDOM.appendChild(this.keyboardRowsDOM), this.onRender(), this.initialized || (this.initialized = true, !this.utilities.pointerEventsSupported() || r2 || i2 ? r2 ? (document.ontouchend = function(e5) {
                return t4.handleButtonMouseUp(void 0, e5);
              }, document.ontouchcancel = function(e5) {
                return t4.handleButtonMouseUp(void 0, e5);
              }, this.keyboardDOM.ontouchstart = function(e5) {
                return t4.handleKeyboardContainerMouseDown(e5);
              }) : r2 || (document.onmouseup = function(e5) {
                return t4.handleButtonMouseUp(void 0, e5);
              }, this.keyboardDOM.onmousedown = function(e5) {
                return t4.handleKeyboardContainerMouseDown(e5);
              }) : (document.onpointerup = function(e5) {
                return t4.handleButtonMouseUp(void 0, e5);
              }, this.keyboardDOM.onpointerdown = function(e5) {
                return t4.handleKeyboardContainerMouseDown(e5);
              }), this.onInit());
            } }], e3 && hr(t3.prototype, e3), n2 && hr(t3, n2), Object.defineProperty(t3, "prototype", { writable: false }), t3;
            var t3, e3, n2;
          })(), mr = gr, br = gr;
        })(), r;
      })();
    });
  })(build$1);
  return build$1.exports;
}
var buildExports = requireBuild();
const SimpleKeyboard = /* @__PURE__ */ getDefaultExportFromCjs(buildExports);
const SIMPLE_KEYBOARD_LAYOUT = {
  default: [
    "q w e r t y u i o p",
    "a s d f g h j k l ñ",
    "{shift} z x c v b n m {bksp}",
    "{numbers} , {space} . {enter}"
  ],
  shift: [
    "Q W E R T Y U I O P",
    "A S D F G H J K L Ñ",
    "{shift} Z X C V B N M {bksp}",
    "{numbers} , {space} . {enter}"
  ],
  numbers: [
    "1 2 3 4 5 6 7 8 9 0",
    "@ # $ % & - + ( ) /",
    "{symbols} ¿ ¡ á é í ó ú ü {bksp}",
    "{abc} , {space} . {enter}"
  ],
  symbols: [
    "~ ` | • √ π ÷ × ¶ Δ",
    "€ £ ¥ ^ ° = ? ! : ;",
    "{numbers} ¿ ¡ á é í ó ú ü {bksp}",
    "{abc} , {space} . {enter}"
  ]
};
const SIMPLE_KEYBOARD_DISPLAY = {
  "{shift}": "⇧",
  "{bksp}": "⌫",
  "{numbers}": "123",
  "{symbols}": "#+=",
  "{abc}": "ABC",
  "{space}": "Espacio",
  "{enter}": "↵"
};
const SIMPLE_KEYBOARD_BUTTON_ATTRIBUTES = [
  { attribute: "type", value: "button" },
  { attribute: "aria-label", value: "Mayúsculas", buttons: "{shift}" },
  { attribute: "aria-label", value: "Borrar carácter", buttons: "{bksp}" },
  { attribute: "aria-label", value: "Cambiar a números", buttons: "{numbers}" },
  { attribute: "aria-label", value: "Cambiar a símbolos", buttons: "{symbols}" },
  { attribute: "aria-label", value: "Volver a letras", buttons: "{abc}" },
  { attribute: "aria-label", value: "Espacio", buttons: "{space}" },
  { attribute: "aria-label", value: "Enviar mensaje", buttons: "{enter}" }
];
class VirtualKeyboard {
  constructor(options) {
    this.options = options;
    this.disabled = Boolean(options.disabled);
    const instanceClass = options.inputName.replace(/[^a-zA-Z0-9_-]/g, "-");
    this.element = document.createElement("div");
    this.element.className = `kroma-chat__simple-keyboard-instance-${instanceClass}`;
    this.element.hidden = !options.controller.state.open;
    this.keyPreview = document.createElement("div");
    this.keyPreview.className = "kroma-chat__key-preview";
    this.keyPreview.setAttribute("aria-hidden", "true");
    this.keyPreview.dataset.visible = "false";
    this.keyPreview.hidden = true;
    document.body.append(this.keyPreview);
    this.savedDocumentHandlers = {
      pointerup: document.onpointerup,
      touchend: document.ontouchend,
      touchcancel: document.ontouchcancel,
      mouseup: document.onmouseup
    };
    const previousContextMenu = window.oncontextmenu;
    const keyboardOptions = {
      inputName: options.inputName,
      syncInstanceInputs: false,
      maxLength: options.maxLength,
      layout: SIMPLE_KEYBOARD_LAYOUT,
      layoutName: options.controller.state.layoutName,
      display: SIMPLE_KEYBOARD_DISPLAY,
      buttonAttributes: SIMPLE_KEYBOARD_BUTTON_ATTRIBUTES,
      theme: "hg-theme-default",
      useButtonTag: true,
      disableRowButtonContainers: true,
      disableButtonHold: true,
      newLineOnEnter: false,
      enableLayoutCandidates: false,
      updateCaretOnSelectionChange: false,
      autoUseTouchEvents: false,
      useTouchEvents: false,
      useMouseEvents: true,
      onKeyPress: (button) => this.handleKeyPress(button),
      onChange: (value) => this.handleLibraryChange(value),
      onRender: () => this.updateButtonStates()
    };
    this.keyboard = new SimpleKeyboard(this.element, keyboardOptions);
    if (window.oncontextmenu !== previousContextMenu) window.oncontextmenu = previousContextMenu;
    this.keyboard.setInput("", options.inputName, true);
    this.keyboard.setCaretPosition(0, 0);
    const signal = this.listeners.signal;
    this.element.addEventListener("pointerdown", this.restoreLocalCaret, { capture: true, signal });
    this.element.addEventListener("mousedown", this.restoreLocalCaret, { capture: true, signal });
    this.element.addEventListener("touchstart", this.restoreLocalCaret, { capture: true, passive: true, signal });
    this.element.addEventListener("pointerdown", this.beginKeyPreview, { capture: true, signal });
    window.addEventListener("pointermove", this.moveKeyPreview, { signal });
    window.addEventListener("pointerup", this.endKeyPreview, { signal });
    window.addEventListener("pointercancel", this.endKeyPreview, { signal });
    window.addEventListener("blur", this.cancelKeyPreview, { signal });
    window.addEventListener("scroll", this.cancelKeyPreview, { capture: true, signal });
    document.addEventListener("visibilitychange", this.cancelKeyPreview, { signal });
    window.addEventListener("resize", this.repositionKeyPreview, { signal });
    this.unsubscribeController = options.controller.subscribe((state) => this.applyControllerState(state.layoutName, state.open));
    VirtualKeyboard.instances.add(this);
    this.updateButtonStates();
  }
  options;
  static instances = /* @__PURE__ */ new Set();
  element;
  keyPreview;
  keyboard = null;
  disabled;
  listeners = new AbortController();
  unsubscribeController;
  savedDocumentHandlers;
  lastCaretStart = 0;
  lastCaretEnd = 0;
  lastPressedKey = "";
  previewPointerId = null;
  previewButton = null;
  previewHideTimer = null;
  get value() {
    return this.keyboard?.getInput(this.options.inputName) || "";
  }
  getCaretRange() {
    const start2 = this.keyboard?.getCaretPosition();
    const end2 = this.keyboard?.getCaretPositionEnd();
    return {
      start: start2 === null || start2 === void 0 ? this.lastCaretStart : start2,
      end: end2 === null || end2 === void 0 ? start2 ?? this.lastCaretEnd : end2
    };
  }
  setInput(value, caretStart = value.length, caretEnd = caretStart) {
    if (!this.keyboard) return;
    this.keyboard.setInput(value, this.options.inputName, true);
    this.keyboard.setCaretPosition(caretStart, caretEnd);
    this.rememberCaret(caretStart, caretEnd);
    this.notifyChange();
  }
  setCaretPosition(caretStart, caretEnd = caretStart) {
    if (!this.keyboard) return;
    this.keyboard.setCaretPosition(caretStart, caretEnd);
    this.rememberCaret(caretStart, caretEnd);
    this.notifyChange();
  }
  setDisabled(disabled) {
    this.disabled = disabled;
    this.updateButtonStates();
  }
  setMaxLength(maxLength) {
    this.keyboard?.setOptions({ maxLength: Math.max(1, maxLength) });
    this.updateButtonStates();
  }
  setOpen(open) {
    this.options.controller.setOpen(open);
  }
  setLayoutDemo(layoutName) {
    this.options.controller.setLayout(layoutName);
  }
  clear() {
    if (!this.keyboard) return;
    this.keyboard.clearInput(this.options.inputName);
    this.keyboard.setCaretPosition(0, 0);
    this.rememberCaret(0, 0);
    this.notifyChange();
  }
  handlePhysicalKey(event, onEnter) {
    if (!this.keyboard || this.disabled || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    this.restoreLocalCaret();
    if (event.key === "Backspace") {
      event.preventDefault();
      this.keyboard.handleButtonClicked("{bksp}");
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const value = this.value;
      const { start: start2, end: end2 } = this.getCaretRange();
      const cursor = start2 === end2 ? event.key === "ArrowLeft" ? previousCodePoint(value, start2) : nextCodePoint(value, end2) : event.key === "ArrowLeft" ? Math.min(start2, end2) : Math.max(start2, end2);
      this.setCaretPosition(cursor, cursor);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) this.insertAtCaret("\n");
      else onEnter();
    } else if (event.key.length === 1) {
      event.preventDefault();
      this.keyboard.handleButtonClicked(event.key === " " ? "{space}" : event.key);
    }
  }
  restoreCaretAfterPhysicalKey() {
    queueMicrotask(() => VirtualKeyboard.restoreInstanceCarets());
  }
  destroy() {
    this.unsubscribeController();
    this.listeners.abort();
    this.cancelKeyPreview();
    if (this.previewHideTimer !== null) clearTimeout(this.previewHideTimer);
    this.previewHideTimer = null;
    this.keyPreview.remove();
    if (this.keyboard) {
      const documentHandlers = {
        pointerup: document.onpointerup,
        touchend: document.ontouchend,
        touchcancel: document.ontouchcancel,
        mouseup: document.onmouseup
      };
      this.keyboard.destroy();
      if (document.onpointerup === null) document.onpointerup = documentHandlers.pointerup || this.savedDocumentHandlers.pointerup;
      if (document.ontouchend === null) document.ontouchend = documentHandlers.touchend || this.savedDocumentHandlers.touchend;
      if (document.ontouchcancel === null) document.ontouchcancel = documentHandlers.touchcancel || this.savedDocumentHandlers.touchcancel;
      if (document.onmouseup === null) document.onmouseup = documentHandlers.mouseup || this.savedDocumentHandlers.mouseup;
    }
    this.keyboard = null;
    VirtualKeyboard.instances.delete(this);
    this.element.replaceChildren();
  }
  applyControllerState(layoutName, open) {
    if (!this.keyboard) return;
    this.element.hidden = !open;
    if (this.keyboard.options.layoutName !== layoutName) {
      const focusedKey = this.focusedKeyName();
      this.keyboard.setOptions({ layoutName });
      this.restoreKeyFocus(focusedKey, layoutName);
    }
    this.updateButtonStates();
  }
  handleKeyPress(button) {
    this.lastPressedKey = button;
    switch (button) {
      case "{shift}":
        this.options.controller.pressShift();
        break;
      case "{numbers}":
        this.options.controller.setLayout("numbers");
        break;
      case "{symbols}":
        this.options.controller.setLayout("symbols");
        break;
      case "{abc}":
        this.options.controller.setLayout("default");
        break;
      case "{enter}":
        if (!this.disabled && this.value.trim()) this.options.onEnter();
        break;
    }
    queueMicrotask(() => VirtualKeyboard.restoreInstanceCarets());
  }
  handleLibraryChange(value) {
    const start2 = this.keyboard?.getCaretPosition();
    const end2 = this.keyboard?.getCaretPositionEnd();
    this.rememberCaret(start2 ?? value.length, end2 ?? start2 ?? value.length);
    this.options.onChange(value, this.lastCaretStart, this.lastCaretEnd);
    const pressedKey = this.lastPressedKey;
    this.lastPressedKey = "";
    if (pressedKey && !pressedKey.startsWith("{") && this.options.controller.state.layoutName === "shift" && !this.options.controller.state.capsLock) {
      queueMicrotask(() => this.options.controller.consumeOneShotShift());
    }
    this.updateButtonStates();
    queueMicrotask(() => VirtualKeyboard.restoreInstanceCarets());
  }
  insertAtCaret(text) {
    const value = this.value;
    const { start: start2, end: end2 } = this.getCaretRange();
    const next = `${value.slice(0, start2)}${text}${value.slice(end2)}`;
    const caret = start2 + text.length;
    this.setInput(next, caret, caret);
  }
  updateButtonStates() {
    if (!this.keyboard) return;
    const value = this.value;
    const { start: start2, end: end2 } = this.getCaretRange();
    this.element.dataset.layout = this.options.controller.state.layoutName;
    this.element.querySelectorAll("button.hg-button").forEach((button) => {
      const key = button.dataset.skbtn || "";
      button.disabled = this.disabled || key === "{enter}" && !value.trim() || (key === "{bksp}" || key === "{backspace}") && start2 === 0 && start2 === end2 || this.keyboard?.options.maxLength === value.length && !key.startsWith("{") && key !== " ";
    });
    const shiftButton = this.element.querySelector("button[data-skbtn='{shift}']");
    if (shiftButton) {
      const state = this.options.controller.state;
      shiftButton.setAttribute("aria-pressed", String(state.shifted));
      shiftButton.setAttribute("aria-label", state.capsLock ? "Mayúsculas bloqueadas; pulsa para desbloquear" : state.shifted ? "Mayúsculas activadas" : "Activar mayúscula; pulsa dos veces para bloqueo");
    }
  }
  focusedKeyName() {
    const active = document.activeElement;
    return active instanceof HTMLButtonElement && this.element.contains(active) ? active.dataset.skbtn || "" : "";
  }
  restoreKeyFocus(key, layoutName) {
    if (!key || !this.keyboard) return;
    let targetKey = key;
    if (layoutName === "shift" && /^[a-zñ]$/i.test(key)) targetKey = key.toLocaleUpperCase("es");
    else if (layoutName === "default" && /^[A-ZÑ]$/.test(key)) targetKey = key.toLocaleLowerCase("es");
    else if (key === "{numbers}") targetKey = layoutName === "numbers" ? "{symbols}" : "{numbers}";
    else if (key === "{symbols}") targetKey = layoutName === "symbols" ? "{numbers}" : "{symbols}";
    else if (key === "{abc}") targetKey = layoutName === "default" ? "{numbers}" : "{abc}";
    const candidate = this.keyboard.getButtonElement(targetKey);
    const button = Array.isArray(candidate) ? candidate[0] : candidate;
    if (button instanceof HTMLButtonElement && !button.disabled) button.focus({ preventScroll: true });
  }
  rememberCaret(start2, end2) {
    this.lastCaretStart = start2;
    this.lastCaretEnd = end2;
  }
  restoreLocalCaret = () => {
    this.keyboard?.setCaretPosition(this.lastCaretStart, this.lastCaretEnd);
  };
  beginKeyPreview = (event) => {
    if (!event.isPrimary || event.button !== 0 || !(event.target instanceof Element)) return;
    const button = event.target.closest("button.hg-button");
    if (!button || !this.element.contains(button) || button.disabled) return;
    const character = button.dataset.skbtn || "";
    if (!isPrintableKeyCharacter(character)) return;
    this.previewPointerId = event.pointerId;
    this.showKeyPreview(button, character);
  };
  moveKeyPreview = (event) => {
    if (event.pointerId !== this.previewPointerId) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const button = target instanceof Element ? target.closest("button.hg-button") : null;
    if (!button || !this.element.contains(button) || button.disabled) {
      this.hideKeyPreview();
      return;
    }
    const character = button.dataset.skbtn || "";
    if (isPrintableKeyCharacter(character)) this.showKeyPreview(button, character);
    else this.hideKeyPreview();
  };
  endKeyPreview = (event) => {
    if (event.pointerId !== this.previewPointerId) return;
    this.previewPointerId = null;
    this.previewButton = null;
    this.hideKeyPreview();
  };
  cancelKeyPreview = () => {
    this.previewPointerId = null;
    this.previewButton = null;
    this.hideKeyPreview();
  };
  showKeyPreview(button, character) {
    if (this.previewHideTimer !== null) {
      clearTimeout(this.previewHideTimer);
      this.previewHideTimer = null;
    }
    const sourceStyles = getComputedStyle(this.element);
    [
      "--kroma-chat-border-subtle",
      "--kroma-chat-canvas",
      "--kroma-elevation-2",
      "--kroma-chat-text-primary",
      "--kroma-chat-font-family",
      "--kroma-chat-weight-semibold"
    ].forEach((token) => {
      const value = sourceStyles.getPropertyValue(token).trim();
      if (value) this.keyPreview.style.setProperty(token, value);
    });
    this.previewButton = button;
    this.keyPreview.textContent = character;
    this.keyPreview.hidden = false;
    this.keyPreview.dataset.visible = "true";
    this.repositionKeyPreview();
  }
  hideKeyPreview = () => {
    if (this.keyPreview.hidden || this.keyPreview.dataset.visible === "false") return;
    this.keyPreview.dataset.visible = "false";
    if (this.previewHideTimer !== null) clearTimeout(this.previewHideTimer);
    this.previewHideTimer = setTimeout(() => {
      this.keyPreview.hidden = true;
      this.previewHideTimer = null;
    }, 110);
  };
  repositionKeyPreview = () => {
    if (!this.previewButton || this.keyPreview.hidden) return;
    const keyBounds = this.previewButton.getBoundingClientRect();
    const keyboardBounds = this.element.getBoundingClientRect();
    const popupBounds = this.keyPreview.getBoundingClientRect();
    const popupWidth = popupBounds.width;
    const popupHeight = popupBounds.height;
    const minLeft = Math.min(Math.max(0, keyboardBounds.left), Math.max(0, window.innerWidth - popupWidth));
    const maxLeft = Math.max(minLeft, Math.min(keyboardBounds.right - popupWidth, window.innerWidth - popupWidth));
    const left2 = Math.min(maxLeft, Math.max(minLeft, keyBounds.left + keyBounds.width / 2 - popupWidth / 2));
    const minTop = Math.min(Math.max(0, keyboardBounds.top), Math.max(0, window.innerHeight - popupHeight));
    const maxTop = Math.max(minTop, Math.min(keyboardBounds.bottom - popupHeight, window.innerHeight - popupHeight));
    const top2 = Math.min(maxTop, Math.max(minTop, keyBounds.top - popupHeight + 12));
    this.keyPreview.style.left = `${left2}px`;
    this.keyPreview.style.top = `${top2}px`;
  };
  notifyChange() {
    this.options.onChange(this.value, this.lastCaretStart, this.lastCaretEnd);
    this.updateButtonStates();
    queueMicrotask(() => VirtualKeyboard.restoreInstanceCarets());
  }
  static restoreInstanceCarets() {
    VirtualKeyboard.instances.forEach((instance) => instance.keyboard?.setCaretPosition(instance.lastCaretStart, instance.lastCaretEnd));
  }
}
function previousCodePoint(value, index) {
  if (index <= 0) return 0;
  const previous = index - 1;
  const code = value.charCodeAt(previous);
  return code >= 56320 && code <= 57343 && previous > 0 ? previous - 1 : previous;
}
function nextCodePoint(value, index) {
  if (index >= value.length) return value.length;
  const code = value.charCodeAt(index);
  return code >= 55296 && code <= 56319 && index + 1 < value.length ? index + 2 : index + 1;
}
function isPrintableKeyCharacter(value) {
  return Array.from(value).length === 1 && /^[\p{L}\p{M}\p{N}\p{P}\p{S}]$/u.test(value);
}
class VirtualKeyboardController {
  layoutName = "default";
  capsLock = false;
  open;
  lastShiftAt = 0;
  listeners = /* @__PURE__ */ new Set();
  constructor(initiallyOpen = false) {
    this.open = initiallyOpen;
  }
  get state() {
    return {
      layoutName: this.layoutName,
      shifted: this.layoutName === "shift",
      capsLock: this.capsLock,
      open: this.open
    };
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  setLayout(layoutName) {
    if (this.layoutName === layoutName) return;
    this.layoutName = layoutName;
    if (layoutName !== "shift") this.capsLock = false;
    this.publish();
  }
  pressShift() {
    const now = Date.now();
    if (this.capsLock) {
      this.capsLock = false;
      this.layoutName = "default";
    } else if (this.layoutName === "shift" && now - this.lastShiftAt < 450) {
      this.capsLock = true;
      this.layoutName = "shift";
    } else {
      this.layoutName = this.layoutName === "shift" ? "default" : "shift";
    }
    this.lastShiftAt = now;
    this.publish();
  }
  consumeOneShotShift() {
    if (this.layoutName !== "shift" || this.capsLock) return;
    this.layoutName = "default";
    this.publish();
  }
  setOpen(open) {
    if (this.open === open) return;
    this.open = open;
    this.publish();
  }
  publish() {
    const state = this.state;
    this.listeners.forEach((listener) => listener(state));
  }
}
class VirtualTextDisplay {
  constructor(inputLabel, placeholder, callbacks) {
    this.placeholder = placeholder;
    this.callbacks = callbacks;
    this.element = document.createElement("div");
    this.element.className = "kroma-chat__virtual-display";
    this.element.setAttribute("role", "textbox");
    this.element.setAttribute("aria-label", inputLabel);
    this.element.setAttribute("aria-multiline", "true");
    this.element.setAttribute("aria-readonly", "false");
    this.element.tabIndex = 0;
    this.textLayer = document.createElement("span");
    this.textLayer.className = "kroma-chat__virtual-display-text";
    this.element.append(this.textLayer);
    this.element.addEventListener("click", (event) => {
      if (this.disabled) return;
      const cursor = this.cursorAtPoint(event.clientX, event.clientY);
      this.callbacks.onCaretChange(cursor, cursor);
    });
    this.element.addEventListener("keydown", (event) => this.callbacks.onPhysicalKey(event));
    this.element.addEventListener("keyup", () => this.callbacks.onPhysicalKeyRelease());
    this.render();
  }
  placeholder;
  callbacks;
  element;
  textLayer;
  value = "";
  cursorStart = 0;
  cursorEnd = 0;
  disabled = false;
  visible = true;
  update(value, cursorStart = value.length, cursorEnd = cursorStart) {
    this.value = value;
    this.cursorStart = Math.max(0, Math.min(cursorStart, value.length));
    this.cursorEnd = Math.max(0, Math.min(cursorEnd, value.length));
    this.render();
  }
  setVisible(visible) {
    this.visible = visible;
    this.element.hidden = !visible;
    if (visible) this.render();
  }
  setEditing(editing) {
    this.element.dataset.editing = String(editing);
  }
  setDisabled(disabled) {
    this.disabled = disabled;
    this.element.setAttribute("aria-disabled", String(disabled));
    this.element.tabIndex = disabled ? -1 : 0;
  }
  setError(messageId) {
    if (messageId) this.element.setAttribute("aria-describedby", messageId);
    else this.element.removeAttribute("aria-describedby");
  }
  destroy() {
    this.element.replaceChildren();
  }
  render() {
    if (!this.visible) return;
    this.textLayer.replaceChildren();
    if (!this.value) {
      this.textLayer.append(this.createCaret());
      const placeholder = document.createElement("span");
      placeholder.className = "kroma-chat__virtual-display-placeholder";
      placeholder.textContent = this.placeholder;
      this.textLayer.append(placeholder);
    } else {
      const selectionStart = Math.min(this.cursorStart, this.cursorEnd);
      const selectionEnd = Math.max(this.cursorStart, this.cursorEnd);
      let offset2 = 0;
      for (const character of this.value) {
        if (this.cursorStart === offset2) this.textLayer.append(this.createCaret());
        const characterNode = document.createElement("span");
        characterNode.dataset.start = String(offset2);
        characterNode.dataset.end = String(offset2 + character.length);
        if (selectionStart !== selectionEnd && offset2 >= selectionStart && offset2 < selectionEnd) {
          characterNode.className = "kroma-chat__virtual-display-selection";
        }
        characterNode.textContent = character;
        this.textLayer.append(characterNode);
        offset2 += character.length;
      }
      if (this.cursorStart === offset2) this.textLayer.append(this.createCaret());
    }
    this.keepCaretVisible();
  }
  createCaret() {
    const caret = document.createElement("span");
    caret.className = "kroma-chat__virtual-display-caret";
    caret.setAttribute("aria-hidden", "true");
    return caret;
  }
  cursorAtPoint(x, y) {
    const characters = [...this.textLayer.querySelectorAll("[data-start][data-end]")];
    if (!characters.length) return 0;
    let nearest = { index: this.value.length, distance: Number.POSITIVE_INFINITY };
    characters.forEach((character) => {
      const rect = character.getBoundingClientRect();
      const verticalDistance = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
      const horizontalDistance = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
      const distance = verticalDistance * 2 + horizontalDistance;
      if (distance < nearest.distance) {
        const midpoint = rect.left + rect.width / 2;
        nearest = { index: Number(x < midpoint ? character.dataset.start : character.dataset.end), distance };
      }
    });
    return nearest.index;
  }
  keepCaretVisible() {
    const caret = this.textLayer.querySelector(".kroma-chat__virtual-display-caret");
    if (!caret) return;
    const viewport2 = this.element.getBoundingClientRect();
    const rect = caret.getBoundingClientRect();
    if (rect.bottom > viewport2.bottom) this.element.scrollTop += rect.bottom - viewport2.bottom;
    else if (rect.top < viewport2.top) this.element.scrollTop -= viewport2.top - rect.top;
  }
}
const COMPOSER_MAX_LENGTH = 2e3;
class ChatComposer {
  constructor(options) {
    this.options = options;
    this.disabled = Boolean(options.disabled);
    this.interactionMode = options.interactionMode || "guided";
    const showKeyboardShowcase = Boolean(options.showKeyboardShowcase);
    this.element = document.createElement("div");
    this.element.className = "kroma-chat__composer-area";
    this.form = document.createElement("form");
    this.form.className = "kroma-chat__composer";
    this.composerField = document.createElement("div");
    this.composerField.className = "kroma-chat__composer-field";
    this.controller = new VirtualKeyboardController(false);
    const displayCallbacks = {
      onCaretChange: (start2, end2) => {
        if (this.keyboardTarget) return;
        if (this.interactionMode !== "free-text") this.setInteractionMode("free-text");
        this.keyboard?.setCaretPosition(start2, end2);
        this.keyboard?.setOpen(true);
      },
      onPhysicalKey: (event) => this.keyboard?.handlePhysicalKey(event, () => this.form.requestSubmit()),
      onPhysicalKeyRelease: () => this.keyboard?.restoreCaretAfterPhysicalKey()
    };
    this.display = new VirtualTextDisplay(options.inputLabel, "", displayCallbacks);
    this.display.setDisabled(this.disabled);
    this.display.update(this.draftValue);
    this.display.setVisible(true);
    this.actions = document.createElement("div");
    this.actions.className = "kroma-chat__composer-actions";
    this.sendButton = this.createSendButton(options.sendLabel);
    this.actions.append(this.sendButton);
    this.composerField.append(this.display.element);
    this.form.append(this.composerField, this.actions);
    this.createKeyboard();
    this.keyboardShowcase = showKeyboardShowcase ? this.createKeyboardShowcase() : null;
    this.keyboardDock = this.keyboard && !this.keyboardShowcase ? document.createElement("div") : null;
    if (this.keyboardDock) {
      this.keyboardDock.className = "kroma-chat__keyboard-dock";
      this.keyboardDock.append(this.keyboard.element);
    }
    if (this.interactionMode === "free-text" && !this.keyboardShowcase) this.keyboard?.setOpen(true);
    this.element.append(this.form);
    if (this.keyboardShowcase) this.element.append(this.keyboardShowcase);
    this.errorMessage = document.createElement("p");
    this.errorMessage.className = "kroma-chat__error";
    this.errorMessage.setAttribute("role", "alert");
    this.errorMessage.hidden = true;
    this.element.append(this.errorMessage);
    const signal = this.listeners.signal;
    document.addEventListener("pointerdown", (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (this.keyboard?.element.contains(target) || this.keyboardShowcase?.contains(target)) return;
      if (this.keyboardTarget?.contains(target)) return;
      if (this.keyboardTarget) {
        this.setKeyboardTarget(null);
        return;
      }
      if (this.display.element.contains(target)) return;
      this.controller.setOpen(false);
      if (this.interactionMode === "free-text") this.setInteractionMode("guided");
    }, { capture: true, signal });
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = this.currentValue().trim();
      if (!message || this.disabled) return;
      options.onSend(message);
      this.clear();
      this.setInteractionMode("guided");
    }, { signal });
    this.unsubscribeController = this.controller.subscribe(() => {
      this.updateSendButton();
      this.updateShowcaseControls();
      this.updatePresentation();
    });
    this.updatePresentation();
    this.updateSendButton();
  }
  options;
  element;
  form;
  display;
  sendButton;
  errorMessage;
  controller;
  keyboardDock;
  listeners = new AbortController();
  disposers = [];
  composerField;
  actions;
  keyboardShowcase;
  showcaseLayouts = /* @__PURE__ */ new Map();
  unsubscribeController;
  keyboard = null;
  keyboardTarget = null;
  inputsWithPhysicalKeyHandlers = /* @__PURE__ */ new WeakSet();
  showcaseToggle = null;
  disabled;
  interactionMode;
  draftValue = "";
  caretStart = 0;
  caretEnd = 0;
  setDisabled(disabled) {
    this.disabled = disabled;
    this.display.setDisabled(disabled);
    this.keyboard?.setDisabled(disabled);
    if (disabled) this.setKeyboardTarget(null);
    this.updateSendButton();
    this.updatePresentation();
  }
  get mode() {
    return this.interactionMode;
  }
  setInteractionMode(mode) {
    if (this.interactionMode === mode) return;
    if (this.keyboardTarget) this.setKeyboardTarget(null);
    this.interactionMode = mode;
    if (mode === "free-text") {
      this.keyboard?.setInput(this.draftValue, this.caretStart, this.caretEnd);
      this.keyboard?.setOpen(true);
    } else {
      this.controller.setOpen(false);
    }
    this.updatePresentation();
    this.updateSendButton();
    this.options.onInteractionModeChange?.(mode);
    if (mode === "free-text" && !this.disabled) this.display.element.focus();
  }
  setKeyboardTarget(target) {
    if (target === this.keyboardTarget) {
      if (target) this.controller.setOpen(true);
      return;
    }
    this.keyboardTarget = target;
    if (target) {
      this.bindPhysicalKeyboard(target);
      const numericLayout = ["number", "tel", "date"].includes(target.type);
      this.controller.setLayout(numericLayout ? "numbers" : "default");
      this.keyboard?.setMaxLength(target.maxLength > 0 ? target.maxLength : COMPOSER_MAX_LENGTH);
      const caretStart = target.selectionStart ?? target.value.length;
      const caretEnd = target.selectionEnd ?? caretStart;
      this.keyboard?.setInput(target.value, caretStart, caretEnd);
      this.controller.setOpen(true);
    } else {
      this.controller.setLayout("default");
      this.keyboard?.setMaxLength(COMPOSER_MAX_LENGTH);
      this.keyboard?.setInput(this.draftValue, this.caretStart, this.caretEnd);
      this.controller.setOpen(false);
    }
    this.updatePresentation();
    this.updateSendButton();
  }
  bindPhysicalKeyboard(target) {
    if (this.inputsWithPhysicalKeyHandlers.has(target)) return;
    this.inputsWithPhysicalKeyHandlers.add(target);
    target.addEventListener("keydown", (event) => {
      if (this.keyboardTarget !== target) return;
      this.keyboard?.handlePhysicalKey(event, () => target.form?.requestSubmit());
    }, { signal: this.listeners.signal });
    target.addEventListener("keyup", () => this.keyboard?.restoreCaretAfterPhysicalKey(), { signal: this.listeners.signal });
  }
  setTargetSelection(target, start2, end2) {
    if (!["text", "search", "tel", "url", "password"].includes(target.type)) return;
    try {
      target.setSelectionRange(start2, end2);
    } catch {
    }
  }
  setError(message) {
    this.errorMessage.textContent = message || "";
    this.errorMessage.hidden = !message;
    if (message) {
      this.display.element.setAttribute("aria-invalid", "true");
      this.errorMessage.id = `${this.options.id}-error`;
      this.display.setError(this.errorMessage.id);
    } else {
      this.display.element.removeAttribute("aria-invalid");
      this.display.setError(null);
      this.errorMessage.removeAttribute("id");
    }
  }
  focus() {
    if (this.interactionMode !== "guided") return;
    if (this.keyboardTarget) this.setKeyboardTarget(null);
    this.display.element.focus({ preventScroll: true });
  }
  clear() {
    if (this.keyboardTarget) this.setKeyboardTarget(null);
    this.draftValue = "";
    this.caretStart = 0;
    this.caretEnd = 0;
    this.keyboard?.clear();
    this.display.update("");
    this.setError(null);
    this.updateSendButton();
  }
  destroy() {
    this.listeners.abort();
    this.unsubscribeController();
    this.display.destroy();
    this.keyboard?.destroy();
    this.disposers.forEach((dispose) => dispose());
  }
  createKeyboard() {
    if (this.keyboard) return;
    this.keyboard = new VirtualKeyboard({
      inputName: this.options.id,
      controller: this.controller,
      maxLength: COMPOSER_MAX_LENGTH,
      disabled: this.disabled,
      onChange: (value, start2, end2) => {
        if (this.keyboardTarget) {
          this.keyboardTarget.value = value;
          this.setTargetSelection(this.keyboardTarget, start2, end2);
          this.keyboardTarget.dispatchEvent(new Event("input", { bubbles: true }));
          return;
        }
        this.draftValue = value;
        this.caretStart = start2;
        this.caretEnd = end2;
        this.display.update(value, start2, end2);
        this.updateSendButton();
      },
      onEnter: () => {
        if (this.keyboardTarget) this.keyboardTarget.form?.requestSubmit();
        else this.form.requestSubmit();
      }
    });
  }
  currentValue() {
    return this.draftValue;
  }
  updatePresentation() {
    const guided = this.interactionMode === "guided";
    const externalInput = this.keyboardTarget !== null;
    const virtualInput = !guided || externalInput;
    this.element.dataset.interactionMode = this.interactionMode;
    this.display.setVisible(!externalInput);
    this.display.setEditing(!guided && !externalInput);
    this.form.hidden = externalInput;
    this.sendButton.hidden = Boolean(this.keyboardShowcase) || externalInput;
    if (this.keyboardDock) this.keyboardDock.hidden = !this.controller.state.open;
    if (!virtualInput && !this.keyboardShowcase) this.controller.setOpen(false);
  }
  updateSendButton() {
    this.sendButton.disabled = this.disabled || !this.currentValue().trim();
  }
  createSendButton(sendLabel) {
    const button = document.createElement("button");
    button.className = "kroma-chat__send";
    button.type = "submit";
    button.disabled = true;
    const label = document.createElement("span");
    label.className = "kroma-chat__sr-only";
    label.textContent = sendLabel;
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    const outerPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    outerPath.setAttribute("d", "M12 19V5m-7 7 7-7 7 7");
    icon.setAttribute("stroke-width", "2");
    icon.append(outerPath);
    button.append(label, icon);
    return button;
  }
  createKeyboardShowcase() {
    const showcase = document.createElement("section");
    showcase.className = "kroma-chat__keyboard-showcase";
    showcase.setAttribute("aria-label", "Estados del composer y teclado virtual");
    const title = document.createElement("h3");
    title.className = "kroma-chat__keyboard-showcase-title";
    title.textContent = "Teclado virtual · variantes";
    const controls = document.createElement("div");
    controls.className = "kroma-chat__keyboard-showcase-layouts";
    const layouts = [
      { label: "ABC", name: "default" },
      { label: "Shift", name: "shift" },
      { label: "123", name: "numbers" },
      { label: "#+=", name: "symbols" }
    ];
    layouts.forEach(({ label, name }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "kroma-chat__keyboard-showcase-layout";
      button.textContent = label;
      button.setAttribute("aria-pressed", String(this.controller.state.layoutName === name));
      button.addEventListener("click", () => this.keyboard?.setLayoutDemo(name), { signal: this.listeners.signal });
      this.showcaseLayouts.set(name, button);
      controls.append(button);
    });
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "kroma-chat__keyboard-showcase-toggle";
    toggle.dataset.keyboardShowcaseToggle = "true";
    toggle.addEventListener("click", () => this.keyboard?.setOpen(!this.controller.state.open), { signal: this.listeners.signal });
    this.showcaseToggle = toggle;
    this.updateShowcaseControls();
    controls.append(toggle);
    const composerSamples = document.createElement("div");
    composerSamples.className = "kroma-chat__keyboard-showcase-composers";
    composerSamples.append(this.createComposerSample("Composer vacío", ""));
    composerSamples.append(this.createComposerSample("Composer con texto", "¿Tienen atención los sábados?"));
    const disabledLabel = document.createElement("span");
    disabledLabel.className = "kroma-chat__keyboard-showcase-label";
    disabledLabel.textContent = "Composer deshabilitado";
    showcase.append(title, controls);
    if (this.keyboard) showcase.append(this.keyboard.element);
    showcase.append(composerSamples, disabledLabel);
    return showcase;
  }
  createComposerSample(label, value) {
    const sample = document.createElement("div");
    sample.className = "kroma-chat__keyboard-showcase-composer";
    const caption = document.createElement("span");
    caption.className = "kroma-chat__keyboard-showcase-label";
    caption.textContent = label;
    const display = new VirtualTextDisplay(label, this.options.placeholder, {
      onCaretChange: () => void 0,
      onPhysicalKey: () => void 0,
      onPhysicalKeyRelease: () => void 0
    });
    display.element.classList.add("kroma-chat__virtual-display--sample");
    display.setDisabled(true);
    display.update(value, value.length);
    this.disposers.push(() => display.destroy());
    sample.append(caption, display.element);
    return sample;
  }
  updateShowcaseControls() {
    const state = this.controller.state;
    this.showcaseLayouts.forEach((button, layout) => button.setAttribute("aria-pressed", String(state.layoutName === layout)));
    if (this.showcaseToggle) {
      this.showcaseToggle.textContent = state.open ? "Ocultar teclado" : "Mostrar teclado";
      this.showcaseToggle.setAttribute("aria-expanded", String(state.open));
    }
  }
}
class ChatHeader {
  element;
  statusElement;
  actionsElement;
  constructor(options) {
    this.element = document.createElement("header");
    this.element.className = "kroma-chat__header";
    const avatar = document.createElement("span");
    avatar.className = "kroma-chat__avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = options.avatar || "";
    avatar.hidden = !options.avatar;
    const heading = document.createElement("div");
    heading.className = "kroma-chat__heading";
    const title = document.createElement("h2");
    title.className = "kroma-chat__title";
    title.textContent = options.title;
    if (options.subtitle) {
      const subtitle = document.createElement("p");
      subtitle.className = "kroma-chat__subtitle";
      subtitle.textContent = options.subtitle;
      heading.append(title, subtitle);
    } else {
      heading.append(title);
    }
    this.statusElement = document.createElement("p");
    this.statusElement.className = "kroma-chat__status";
    this.statusElement.hidden = true;
    heading.append(this.statusElement);
    this.actionsElement = document.createElement("div");
    this.actionsElement.className = "kroma-chat__actions";
    this.actionsElement.setAttribute("role", "group");
    this.actionsElement.setAttribute("aria-label", "Chat actions");
    this.actionsElement.dataset.chatActions = "";
    this.element.append(avatar, heading, this.actionsElement);
    this.setStatus(options.status || null);
  }
  setStatus(status) {
    this.statusElement.textContent = status || "";
    this.statusElement.hidden = !status;
  }
  setActions(actions, onAction) {
    this.actionsElement.replaceChildren();
    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "kroma-chat__header-action";
      button.textContent = action.label;
      button.disabled = Boolean(action.disabled);
      button.addEventListener("click", () => onAction(action));
      this.actionsElement.append(button);
    });
  }
}
function createControlAction(messageId, control, actionId, label, value, data, onAction, messageText) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "kroma-chat__journey-action";
  button.dataset.actionId = actionId;
  button.textContent = label;
  button.addEventListener("click", () => onAction({ messageId, control, actionId, label, value, data }, messageText));
  return button;
}
function formatMoney(money) {
  if (!money) return "";
  if (money.label) return money.label;
  try {
    return new Intl.NumberFormat(void 0, { style: "currency", currency: money.currency }).format(money.amount);
  } catch {
    return `${money.amount} ${money.currency}`;
  }
}
function formatMessageTime(value) {
  const date = /* @__PURE__ */ new Date();
  return {
    text: value || new Intl.DateTimeFormat(void 0, { hour: "numeric", minute: "2-digit" }).format(date),
    dateTime: date.toISOString()
  };
}
function createProductImage(image, className = "kroma-chat__product-image") {
  if (!image) return null;
  try {
    const url = new URL(image.src, document.baseURI);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const element = document.createElement("img");
    element.className = className;
    element.src = url.href;
    element.alt = image.alt;
    element.width = 512;
    element.height = 512;
    element.loading = "lazy";
    element.decoding = "async";
    return element;
  } catch {
    return null;
  }
}
function createProductImagePlaceholder(label, className = "kroma-chat__product-image") {
  const placeholder = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  placeholder.setAttribute("class", `${className} kroma-chat__product-image--placeholder`);
  placeholder.setAttribute("viewBox", "0 0 64 64");
  placeholder.setAttribute("role", "img");
  placeholder.setAttribute("aria-label", `Imagen no disponible: ${label}`);
  placeholder.setAttribute("fill", "none");
  placeholder.setAttribute("stroke", "currentColor");
  placeholder.setAttribute("stroke-width", "1.5");
  placeholder.setAttribute("stroke-linecap", "round");
  placeholder.setAttribute("stroke-linejoin", "round");
  const backdrop = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  backdrop.setAttribute("x", "1");
  backdrop.setAttribute("y", "1");
  backdrop.setAttribute("width", "62");
  backdrop.setAttribute("height", "62");
  backdrop.setAttribute("rx", "10");
  backdrop.setAttribute("fill", "currentColor");
  backdrop.setAttribute("fill-opacity", ".06");
  backdrop.setAttribute("stroke-opacity", ".18");
  const sun = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  sun.setAttribute("cx", "43");
  sun.setAttribute("cy", "21");
  sun.setAttribute("r", "4");
  sun.setAttribute("stroke-opacity", ".65");
  const landscape = document.createElementNS("http://www.w3.org/2000/svg", "path");
  landscape.setAttribute("d", "m9 48 13-14 9 9 7-7 17 17H9z");
  landscape.setAttribute("stroke-opacity", ".65");
  placeholder.append(backdrop, sun, landscape);
  return placeholder;
}
function createCartLineItem(messageId, line, removeLabel, onAction) {
  const row = document.createElement("article");
  row.className = "kroma-chat__cart-item";
  row.setAttribute("role", "listitem");
  row.dataset.lineId = line.id;
  const image = createProductImage(line.product.image, "kroma-chat__cart-image") || createProductImagePlaceholder(line.product.name, "kroma-chat__cart-image");
  const product = document.createElement("div");
  product.className = "kroma-chat__cart-product";
  const name = document.createElement("strong");
  name.className = "kroma-chat__cart-name";
  name.textContent = line.product.name;
  const meta = document.createElement("p");
  meta.className = "kroma-chat__cart-meta";
  const price = line.unitPriceLabel || formatMoney(line.unitPrice);
  meta.textContent = [line.variantLabel, `${line.quantity} × ${price}`].filter(Boolean).join(" · ");
  product.append(name, meta);
  const trailing = document.createElement("div");
  trailing.className = "kroma-chat__cart-trailing";
  const totalLabel = line.lineTotalLabel || formatMoney(line.lineTotal);
  if (totalLabel) {
    const total = document.createElement("strong");
    total.className = "kroma-chat__cart-total";
    total.textContent = totalLabel;
    trailing.append(total);
  }
  const actions = line.actions?.length ? line.actions : [{ id: "remove-item", label: removeLabel, value: line.id }];
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__cart-remove";
    button.dataset.actionId = action.id || "line-action";
    button.dataset.lineId = line.id;
    button.textContent = action.label;
    button.addEventListener("click", () => {
      const detail = {
        messageId,
        control: "cart-summary",
        actionId: action.id || "line-action",
        label: action.label,
        value: action.value ?? line.id,
        data: { lineId: line.id, productId: line.product.id }
      };
      onAction(detail, action.messageText || `${action.label} ${line.product.name}`);
    });
    trailing.append(button);
  });
  row.append(image, product, trailing);
  return row;
}
function createPriceSummary(summary) {
  const section = document.createElement("section");
  section.className = "kroma-chat__price-summary";
  summary.entries.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "kroma-chat__cart-subtotal";
    row.dataset.priceId = entry.id;
    const label = document.createElement("span");
    label.textContent = entry.label;
    const amount = document.createElement("strong");
    amount.textContent = entry.amountLabel || formatMoney(entry.amount);
    if (entry.emphasis === "strong") row.classList.add("kroma-chat__price-entry--strong");
    row.append(label, amount);
    section.append(row);
  });
  return section;
}
function renderCustomerDetails(customer, labels) {
  const details = document.createElement("dl");
  details.className = "kroma-chat__customer-details";
  Object.entries(customer).forEach(([key, text]) => {
    const row = document.createElement("div");
    row.className = "kroma-chat__customer-row";
    const term = document.createElement("dt");
    term.textContent = labels?.[key] || key;
    const value = document.createElement("dd");
    value.textContent = text;
    row.append(term, value);
    details.append(row);
  });
  return details;
}
function resolvePriceSummary(message) {
  if (message.priceSummary) return message.priceSummary;
  if (!message.subtotalLabel && !message.subtotal) return void 0;
  return {
    entries: [{
      id: "subtotal",
      label: message.subtotalTitle || "Subtotal",
      amount: message.subtotal,
      amountLabel: message.subtotalLabel,
      emphasis: "strong"
    }]
  };
}
function createCartSummary(messageId, message, onAction) {
  const summary = document.createElement("section");
  summary.className = "kroma-chat__cart-summary";
  if (!message.items.length) {
    const empty = document.createElement("p");
    empty.className = "kroma-chat__cart-empty";
    empty.textContent = message.emptyLabel || "Your selection is empty.";
    summary.append(empty);
    return summary;
  }
  const list = document.createElement("div");
  list.className = "kroma-chat__cart-items";
  list.setAttribute("role", "list");
  message.items.forEach((line) => list.append(createCartLineItem(messageId, line, message.removeItemLabel || "Remove", onAction)));
  summary.append(list);
  const prices = resolvePriceSummary(message);
  if (prices) summary.append(createPriceSummary(prices));
  if (message.continueLabel) {
    summary.append(createControlAction(messageId, "cart-summary", "continue", message.continueLabel, "continue", void 0, onAction, message.continueLabel));
  }
  return summary;
}
function createOrderReview(messageId, message, onAction) {
  const review = document.createElement("section");
  review.className = "kroma-chat__order-review";
  review.append(renderCustomerDetails(message.customer, message.customerLabels));
  review.append(createCartSummary(messageId, {
    author: message.author,
    text: message.text,
    items: message.items,
    subtotal: message.subtotal,
    subtotalTitle: message.subtotalTitle,
    subtotalLabel: message.subtotalLabel,
    priceSummary: message.priceSummary,
    removeItemLabel: message.removeItemLabel
  }, onAction));
  const actions = document.createElement("div");
  actions.className = "kroma-chat__review-actions";
  actions.append(createControlAction(messageId, "order-review", "confirm", message.confirmLabel, "confirm", void 0, onAction, message.confirmLabel));
  if (message.editLabel) actions.append(createControlAction(messageId, "order-review", "edit", message.editLabel, "edit", void 0, onAction, message.editLabel));
  review.append(actions);
  return review;
}
function createConfirmationCard(messageId, message, onAction) {
  const card = document.createElement("section");
  card.className = "kroma-chat__confirmation";
  card.dataset.status = message.status || "success";
  const mark = document.createElement("span");
  mark.className = "kroma-chat__confirmation-mark";
  mark.setAttribute("aria-hidden", "true");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", message.status === "error" ? "M7 7l10 10M17 7 7 17" : message.status === "warning" ? "M12 7v5m0 4h.01" : message.status === "neutral" ? "M12 11v5m0-8h.01" : "m5 12 4.5 4.5L19 7");
  icon.append(path);
  mark.append(icon);
  const title = document.createElement("h3");
  title.className = "kroma-chat__confirmation-title";
  title.textContent = message.title;
  const description = document.createElement("p");
  description.className = "kroma-chat__confirmation-description";
  description.textContent = message.description;
  card.append(mark, title, description);
  if (message.reference) {
    const reference2 = document.createElement("p");
    reference2.className = "kroma-chat__confirmation-reference";
    reference2.textContent = message.reference;
    card.append(reference2);
  }
  if (message.summary?.length) {
    const summary = document.createElement("ul");
    summary.className = "kroma-chat__confirmation-summary";
    message.summary.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      summary.append(item);
    });
    card.append(summary);
  }
  if (message.action) {
    card.append(createControlAction(messageId, "confirmation", message.action.id || `${messageId}-action`, message.action.label, message.action.value, void 0, onAction, message.action.messageText || message.action.label));
  }
  return card;
}
function createStatusMessage(message) {
  const status = document.createElement("p");
  status.className = "kroma-chat__status-message";
  status.setAttribute("role", "status");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "kroma-chat__status-icon");
  icon.setAttribute("viewBox", "0 0 16 16");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", message.status === "success" ? "m3 8 3 3 7-7" : message.status === "warning" ? "M8 2.5v6m0 3v.01" : message.status === "error" ? "m4 4 8 8m0-8-8 8" : "M8 3v5m0 3v.01");
  icon.append(path);
  const text = document.createElement("span");
  text.textContent = message.text;
  status.dataset.status = message.status || "neutral";
  status.append(icon, text);
  return status;
}
function createFormField(messageId, field, onInputFocus) {
  const inputId = `${messageId}-field-${field.id}`;
  const group = document.createElement("div");
  group.className = "kroma-chat__form-field";
  const label = document.createElement("label");
  label.htmlFor = inputId;
  label.textContent = field.label;
  const input = document.createElement("input");
  input.id = inputId;
  input.name = field.name;
  input.type = field.type;
  input.required = Boolean(field.required);
  input.disabled = Boolean(field.disabled);
  input.readOnly = true;
  input.inputMode = "none";
  input.value = field.value || "";
  input.placeholder = field.placeholder || "";
  if (field.autocomplete) input.setAttribute("autocomplete", field.autocomplete);
  if (field.min !== void 0) input.min = String(field.min);
  if (field.max !== void 0) input.max = String(field.max);
  if (field.pattern) input.pattern = field.pattern;
  input.className = "kroma-chat__form-input";
  input.addEventListener("focus", () => onInputFocus(input));
  if (field.errorMessage) {
    input.setCustomValidity(field.errorMessage);
    input.addEventListener("input", () => input.setCustomValidity(""));
  }
  group.append(label, input);
  return { group, input };
}
function getFieldError(field, input) {
  const value = input.value.trim();
  if (field.required && !value) return field.errorMessage || `${field.label} es obligatorio.`;
  if (!value) return null;
  if (field.pattern) {
    try {
      if (!new RegExp(`^(?:${field.pattern})$`, "u").test(value)) return field.errorMessage || `Revisa ${field.label.toLocaleLowerCase("es")}.`;
    } catch {
      return "La validación de este campo no está configurada correctamente.";
    }
  }
  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return field.errorMessage || "Introduce un correo electrónico válido.";
  if (field.type === "url") {
    try {
      new URL(value);
    } catch {
      return field.errorMessage || "Introduce una URL válida.";
    }
  }
  if (field.type === "number") {
    const number = Number(value);
    if (!Number.isFinite(number)) return field.errorMessage || `Introduce un número válido para ${field.label.toLocaleLowerCase("es")}.`;
    if (field.min !== void 0 && number < Number(field.min)) return field.errorMessage || `El valor mínimo es ${field.min}.`;
    if (field.max !== void 0 && number > Number(field.max)) return field.errorMessage || `El valor máximo es ${field.max}.`;
  }
  if (field.type === "date" && Number.isNaN(Date.parse(`${value}T00:00:00`))) return field.errorMessage || "Introduce una fecha válida.";
  return null;
}
function createConversationalForm(messageId, message, onInputFocus, onSubmit) {
  const wrapper = document.createElement("section");
  wrapper.className = "kroma-chat__conversational-form";
  if (message.title) {
    const title = document.createElement("h3");
    title.className = "kroma-chat__form-title";
    title.textContent = message.title;
    wrapper.append(title);
  }
  const form = document.createElement("form");
  form.className = "kroma-chat__form-fields";
  const controls = /* @__PURE__ */ new Map();
  const fieldNames = /* @__PURE__ */ new Set();
  let hasDuplicateNames = false;
  message.fields.forEach((field) => {
    if (fieldNames.has(field.name)) hasDuplicateNames = true;
    fieldNames.add(field.name);
    const control = createFormField(messageId, field, onInputFocus);
    if (!controls.has(field.name)) controls.set(field.name, control.input);
    form.append(control.group);
  });
  if (hasDuplicateNames) {
    form.dataset.definitionError = "duplicate-field-names";
    const definitionError = document.createElement("p");
    definitionError.className = "kroma-chat__error";
    definitionError.setAttribute("role", "alert");
    definitionError.textContent = "This form has duplicate field names and cannot be submitted.";
    form.append(definitionError);
  }
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "kroma-chat__journey-action kroma-chat__form-submit";
  submit.textContent = message.submitLabel;
  submit.disabled = hasDuplicateNames;
  form.append(submit);
  const validationError = document.createElement("p");
  validationError.id = `${messageId}-form-validation-error`;
  validationError.className = "kroma-chat__error";
  validationError.setAttribute("role", "alert");
  validationError.hidden = true;
  form.insertBefore(validationError, submit);
  let dispatchingSubmit = false;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (hasDuplicateNames || dispatchingSubmit) return;
    const invalidField = message.fields.find((field) => {
      const input = controls.get(field.name);
      return input && Boolean(getFieldError(field, input));
    });
    if (invalidField) {
      const input = controls.get(invalidField.name);
      const error = input ? getFieldError(invalidField, input) : null;
      if (input) {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", validationError.id);
        input.focus();
      }
      validationError.textContent = error || "Revisa los datos del formulario.";
      validationError.hidden = false;
      return;
    }
    form.querySelectorAll("input[aria-invalid='true']").forEach((input) => {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    });
    validationError.hidden = true;
    const values = {};
    controls.forEach((input, name) => {
      values[name] = input.value.trim();
    });
    dispatchingSubmit = true;
    submit.disabled = true;
    form.setAttribute("aria-busy", "true");
    try {
      onSubmit({ messageId, values });
    } finally {
      dispatchingSubmit = false;
      submit.disabled = false;
      form.removeAttribute("aria-busy");
    }
  });
  wrapper.append(form);
  return wrapper;
}
function createChatMessageTime(message) {
  const time = document.createElement("time");
  const formatted = formatMessageTime(message.time);
  time.className = "kroma-chat__time";
  time.textContent = formatted.text;
  time.dateTime = formatted.dateTime;
  return time;
}
function createChatBubble(message, messageId) {
  const bubble = document.createElement("div");
  bubble.className = "kroma-chat__bubble";
  const text = document.createElement("span");
  text.id = `${messageId}-content`;
  text.className = "kroma-chat__text";
  text.textContent = message.text;
  bubble.append(text, createChatMessageTime(message));
  return bubble;
}
function createChoiceList(messageId, choices, onSelect) {
  const group = document.createElement("div");
  group.className = "kroma-chat__options kroma-chat__choice-list";
  group.dataset.messageId = messageId;
  group.dataset.control = "choice-list";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `${messageId}-content`);
  choices.forEach((choice, index) => {
    const optionId = choice.id || `${messageId}-choice-${index + 1}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__option kroma-chat__choice";
    button.dataset.optionId = optionId;
    button.dataset.optionDisabled = String(Boolean(choice.disabled));
    button.disabled = Boolean(choice.disabled);
    button.setAttribute("aria-pressed", "false");
    const title = document.createElement("span");
    title.className = "kroma-chat__choice-title";
    title.textContent = choice.title;
    const description = document.createElement("span");
    description.className = "kroma-chat__choice-description";
    description.textContent = choice.description;
    button.append(title, description);
    button.addEventListener("click", () => onSelect({
      messageId,
      optionId,
      value: choice.value ?? choice.title,
      label: choice.title,
      control: "choice-list",
      option: { ...choice, id: optionId }
    }, group, button));
    group.append(button);
  });
  return group;
}
function createQuickReplies(messageId, replies, onSelect) {
  const group = document.createElement("div");
  group.className = "kroma-chat__options kroma-chat__quick-replies";
  group.dataset.messageId = messageId;
  group.dataset.control = "quick-replies";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `${messageId}-content`);
  replies.forEach((reply, index) => {
    const optionId = reply.id || `${messageId}-reply-${index + 1}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__option";
    button.dataset.optionId = optionId;
    button.dataset.optionDisabled = String(Boolean(reply.disabled));
    button.textContent = reply.label;
    button.disabled = Boolean(reply.disabled);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => onSelect({
      messageId,
      optionId,
      value: reply.value ?? reply.label,
      label: reply.label,
      control: "quick-replies",
      option: { ...reply, id: optionId }
    }, group, button));
    group.append(button);
  });
  return group;
}
function safeHref(link) {
  try {
    const url = new URL(link.href, document.baseURI);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
function createRichMessage(message, messageId, onAction) {
  const rich = document.createElement("article");
  rich.className = "kroma-chat__bubble kroma-chat__rich";
  if (message.title) {
    const title = document.createElement("h3");
    title.className = "kroma-chat__rich-title";
    if (message.type === "info") title.classList.add("kroma-chat__info-title");
    title.textContent = message.title;
    rich.append(title);
  }
  const description = document.createElement("p");
  description.id = `${messageId}-content`;
  description.className = "kroma-chat__rich-description";
  if (message.type === "info") description.classList.add("kroma-chat__info-description");
  description.textContent = message.description;
  rich.append(description);
  const actions = document.createElement("div");
  actions.className = "kroma-chat__rich-actions";
  if (message.link) {
    const href = safeHref(message.link);
    if (href) {
      const link = document.createElement("a");
      link.className = "kroma-chat__rich-link";
      link.href = href;
      link.textContent = message.link.label;
      if (new URL(href).origin !== window.location.origin) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      actions.append(link);
    }
  }
  if (message.action) {
    const actionId = message.action.id || `${messageId}-action`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__rich-action";
    button.dataset.actionId = actionId;
    button.textContent = message.action.label;
    button.addEventListener("click", () => onAction({ ...message.action, id: actionId }));
    actions.append(button);
  }
  if (actions.childElementCount) rich.append(actions);
  rich.append(createChatMessageTime(message));
  return rich;
}
function createTypingBubble(label) {
  const bubble = document.createElement("div");
  bubble.className = "kroma-chat__bubble kroma-chat__typing-bubble";
  const announcement = document.createElement("span");
  announcement.className = "kroma-chat__sr-only";
  announcement.textContent = label;
  const dots = document.createElement("span");
  dots.className = "kroma-chat__typing-dots";
  dots.setAttribute("aria-hidden", "true");
  dots.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));
  bubble.append(announcement, dots);
  return bubble;
}
function createTypingIndicator(messageId, label) {
  const item = document.createElement("li");
  item.className = "kroma-chat__message kroma-chat__message--assistant kroma-chat__message--typing";
  item.dataset.messageId = messageId;
  item.dataset.messageType = "typing";
  item.setAttribute("role", "status");
  const avatar = document.createElement("span");
  avatar.className = "kroma-chat__message-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = "K";
  item.append(avatar, createTypingBubble(label));
  return item;
}
const iconPaths = {
  browse: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
  search: "M10.8 4.5a6.3 6.3 0 1 0 0 12.6 6.3 6.3 0 0 0 0-12.6z M15.4 15.4 20 20",
  orders: "M7 3.5h8l3 3V20H7z M15 3.5V7h3 M10 11h5 M10 14h5 M10 17h3",
  advisor: "M4 5.5h16v11H11l-4.5 3v-3H4z M8 10h.01 M12 10h.01 M16 10h.01",
  all: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
  clothing: "M8 4 5 6 2.5 9l3 3L8 9.5V20h8V9.5l2.5 2.5 3-3L19 6l-3-2a4 4 0 0 1-8 0z",
  accessories: "M5 8h14l-1 12H6L5 8z M9 8V6a3 3 0 0 1 6 0v2",
  cart: "M3 4h2l2.2 10.5h10.4L20 7H6 M8 18.5h.01 M17 18.5h.01"
};
function createIcon(icon, className) {
  const iconElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  if (className) iconElement.setAttribute("class", className);
  iconElement.setAttribute("aria-hidden", "true");
  iconElement.setAttribute("focusable", "false");
  iconElement.setAttribute("viewBox", "0 0 24 24");
  iconElement.setAttribute("fill", "none");
  iconElement.setAttribute("stroke", "currentColor");
  iconElement.setAttribute("stroke-width", "1.75");
  iconElement.setAttribute("stroke-linecap", "round");
  iconElement.setAttribute("stroke-linejoin", "round");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", iconPaths[icon] || "M12 4v16 M4 12h16");
  iconElement.append(path);
  return iconElement;
}
function createChevronIcon(direction) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.75");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", direction === "next" ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7");
  icon.append(path);
  return icon;
}
function createIconLabel(icon, label, className) {
  const wrapper = document.createElement("span");
  wrapper.className = className;
  if (icon) {
    wrapper.append(createIcon(icon, `${className}-icon`));
  }
  const text = document.createElement("span");
  text.className = `${className}-text`;
  text.textContent = label;
  wrapper.append(text);
  return wrapper;
}
function createCategoryTile(messageId, category, onAction) {
  const button = createControlAction(messageId, "category-picker", category.id, category.label, category.id, { categoryId: category.id }, onAction, category.label);
  button.classList.add("kroma-chat__category");
  button.disabled = Boolean(category.disabled);
  button.dataset.categoryId = category.id;
  button.replaceChildren(createIconLabel(category.icon, category.label, "kroma-chat__category-label"));
  if (category.description) {
    const description = document.createElement("span");
    description.className = "kroma-chat__category-description";
    description.textContent = category.description;
    button.append(description);
  }
  return button;
}
function createCategoryPicker(messageId, message, onAction) {
  const group = document.createElement("div");
  group.className = "kroma-chat__category-picker";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `${messageId}-content`);
  message.categories.forEach((category) => group.append(createCategoryTile(messageId, category, onAction)));
  return group;
}
function createJourneyOption(messageId, item, onAction) {
  const button = createControlAction(messageId, "journey-menu", item.id, item.label, item.value ?? item.id, void 0, onAction, item.label);
  button.classList.add("kroma-chat__journey-item");
  button.disabled = Boolean(item.disabled);
  button.replaceChildren(createIconLabel(item.icon, item.label, "kroma-chat__journey-item-label"));
  if (item.description) {
    const description = document.createElement("span");
    description.className = "kroma-chat__journey-item-description";
    description.textContent = item.description;
    button.querySelector(".kroma-chat__journey-item-label-text")?.append(description);
  }
  button.dataset.itemId = item.id;
  return button;
}
function createJourneyMenu(messageId, message, onAction) {
  const group = document.createElement("div");
  group.className = "kroma-chat__journey-menu";
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `${messageId}-content`);
  message.items.forEach((item) => group.append(createJourneyOption(messageId, item, onAction)));
  return group;
}
function createProductListItem(messageId, product, control, actionLabel, onAction) {
  const button = createControlAction(messageId, control, `product-${product.id}`, actionLabel, product.id, { productId: product.id }, onAction, product.name);
  button.classList.add("kroma-chat__product-card");
  button.dataset.productId = product.id;
  button.replaceChildren();
  const image = createProductImage(product.image) || createProductImagePlaceholder(product.name);
  const content = document.createElement("span");
  content.className = "kroma-chat__product-content";
  const name = document.createElement("strong");
  name.className = "kroma-chat__product-name";
  name.textContent = product.name;
  const description = document.createElement("span");
  description.className = "kroma-chat__product-description";
  description.textContent = product.summary || product.description;
  content.append(name, description);
  const priceLabel = product.priceLabel || formatMoney(product.price);
  if (priceLabel) {
    const price = document.createElement("span");
    price.className = "kroma-chat__product-price";
    price.textContent = priceLabel;
    content.append(price);
  }
  const action = document.createElement("span");
  action.className = "kroma-chat__product-action";
  action.textContent = actionLabel;
  button.append(image);
  button.append(content, action);
  return button;
}
function createProductCard(messageId, message, onAction) {
  const card = document.createElement("div");
  card.className = "kroma-chat__product-card-message";
  card.append(createProductListItem(messageId, message.product, "product-card", message.actionLabel || "View product", onAction));
  return card;
}
function createProductCarousel(messageId, message, onAction) {
  const carousel = document.createElement("div");
  carousel.className = "kroma-chat__product-carousel";
  carousel.setAttribute("role", "region");
  carousel.setAttribute("aria-label", message.text);
  const controls = document.createElement("div");
  controls.className = "kroma-chat__carousel-controls";
  const trackId = `${messageId}-products`;
  const track = document.createElement("div");
  track.id = trackId;
  track.className = "kroma-chat__product-track";
  track.tabIndex = 0;
  track.setAttribute("aria-label", message.text);
  message.products.forEach((product) => track.append(createProductListItem(messageId, product, "product-carousel", message.productActionLabel || "View product", onAction)));
  const createArrow = (direction, label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kroma-chat__carousel-arrow";
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-controls", trackId);
    button.append(createChevronIcon(direction < 0 ? "previous" : "next"));
    button.addEventListener("click", () => {
      const card = track.querySelector(".kroma-chat__product-card");
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      track.scrollBy({ left: direction * (card?.offsetWidth || track.clientWidth), behavior });
    });
    return button;
  };
  const previous = createArrow(-1, message.previousLabel || "Previous products");
  const next = createArrow(1, message.nextLabel || "Next products");
  const updateArrows = () => {
    previous.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
  };
  previous.addEventListener("click", () => requestAnimationFrame(updateArrows));
  next.addEventListener("click", () => requestAnimationFrame(updateArrows));
  track.addEventListener("scroll", updateArrows, { passive: true });
  controls.append(previous, next);
  carousel.append(controls, track);
  requestAnimationFrame(updateArrows);
  return carousel;
}
function createFeatureList(features) {
  const list = document.createElement("ul");
  list.className = "kroma-chat__product-features";
  features.forEach((feature) => {
    const item = document.createElement("li");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "kroma-chat__feature-icon");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.8");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    const check = document.createElementNS("http://www.w3.org/2000/svg", "path");
    check.setAttribute("d", "m3 8.5 3.1 3.1L13 4.8");
    icon.append(check);
    const text = document.createElement("span");
    text.textContent = feature;
    item.append(icon, text);
    list.append(item);
  });
  return list;
}
function createQuantitySelector(messageId, controlId, labelText, value, minimum, maximum, decreaseLabel, increaseLabel, productId, onQuantityChange) {
  const control = document.createElement("div");
  control.className = "kroma-chat__quantity-selector";
  control.dataset.controlId = controlId;
  const label = document.createElement("span");
  label.className = "kroma-chat__quantity-label";
  label.textContent = labelText;
  const minus = document.createElement("button");
  minus.type = "button";
  minus.className = "kroma-chat__quantity-button";
  minus.setAttribute("aria-label", decreaseLabel);
  minus.textContent = "−";
  const output = document.createElement("output");
  output.className = "kroma-chat__quantity-value";
  output.setAttribute("aria-live", "polite");
  const plus = document.createElement("button");
  plus.type = "button";
  plus.className = "kroma-chat__quantity-button";
  plus.setAttribute("aria-label", increaseLabel);
  plus.textContent = "+";
  const minimumValue = Number.isFinite(minimum) ? Math.max(0, Math.floor(minimum)) : 0;
  const maximumValue = Number.isFinite(maximum) ? Math.max(minimumValue, Math.floor(maximum)) : minimumValue;
  let quantity = Number.isFinite(value) ? Math.min(maximumValue, Math.max(minimumValue, Math.floor(value))) : minimumValue;
  const update = (next) => {
    const bounded = Math.min(maximumValue, Math.max(minimumValue, next));
    if (bounded === quantity) return;
    quantity = bounded;
    output.value = String(quantity);
    control.dataset.quantityValue = String(quantity);
    minus.disabled = quantity <= minimumValue;
    plus.disabled = quantity >= maximumValue;
    onQuantityChange({ messageId, controlId, productId, quantity });
  };
  minus.addEventListener("click", () => update(quantity - 1));
  plus.addEventListener("click", () => update(quantity + 1));
  output.value = String(quantity);
  control.dataset.quantityValue = String(quantity);
  minus.disabled = quantity <= minimumValue;
  plus.disabled = quantity >= maximumValue;
  control.append(label, minus, output, plus);
  return control;
}
function createStandaloneQuantitySelector(messageId, message, onQuantityChange) {
  return createQuantitySelector(messageId, message.controlId, message.label, message.value, message.minimum ?? 0, message.maximum ?? 99, message.decreaseLabel || "Decrease quantity", message.increaseLabel || "Increase quantity", message.productId, onQuantityChange);
}
function createVariantSelector(messageId, controlId, labelText, variants, selectedId, productId, onAction) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "kroma-chat__variant-selector";
  fieldset.dataset.controlId = controlId;
  const legend = document.createElement("legend");
  legend.textContent = labelText;
  const list = document.createElement("div");
  list.className = "kroma-chat__variant-list";
  fieldset.append(legend, list);
  variants.forEach((variant, index) => {
    const inputId = `${controlId}-${index + 1}`;
    const label = document.createElement("label");
    label.className = "kroma-chat__variant";
    label.htmlFor = inputId;
    const input = document.createElement("input");
    input.type = "radio";
    input.name = controlId;
    input.id = inputId;
    input.value = variant.value;
    input.dataset.variantId = variant.id;
    input.checked = variant.id === selectedId;
    input.disabled = Boolean(variant.disabled);
    input.addEventListener("change", () => {
      if (!input.checked) return;
      onAction({
        messageId,
        control: "product-variant-selector",
        actionId: "select-variant",
        label: variant.label,
        value: variant.value,
        data: { productId, variantId: variant.id }
      });
    });
    const text = document.createElement("span");
    text.textContent = variant.label;
    label.append(input, text);
    list.append(label);
  });
  return fieldset;
}
function createProductVariantSelector(messageId, message, onAction) {
  const selector = createVariantSelector(messageId, message.controlId, message.label, message.variants, message.selectedVariantId, message.productId, onAction);
  selector.classList.add("kroma-chat__standalone-variant-selector");
  return selector;
}
function createProductDetail(messageId, message, onAction, onQuantityChange) {
  const detail = document.createElement("section");
  detail.className = "kroma-chat__product-detail";
  const image = createProductImage(message.product.image, "kroma-chat__product-detail-image") || createProductImagePlaceholder(message.product.name, "kroma-chat__product-detail-image");
  detail.append(image);
  const heading = document.createElement("h3");
  heading.className = "kroma-chat__product-detail-title";
  heading.textContent = message.product.name;
  detail.append(heading);
  if (message.product.description) {
    const description = document.createElement("p");
    description.className = "kroma-chat__product-detail-description";
    description.textContent = message.product.description;
    detail.append(description);
  }
  if (message.product.features?.length) detail.append(createFeatureList(message.product.features));
  const priceLabel = message.product.priceLabel || formatMoney(message.product.price);
  if (priceLabel) {
    const price = document.createElement("p");
    price.className = "kroma-chat__product-detail-price";
    price.textContent = priceLabel;
    detail.append(price);
  }
  let selectedVariantId = message.selectedVariantId;
  const variants = message.variants || message.product.variants || [];
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "kroma-chat__journey-action kroma-chat__product-add";
  addButton.dataset.actionId = "add-to-cart";
  addButton.append(createIconLabel("cart", message.addActionLabel || "Add to selection", "kroma-chat__product-add-label"));
  addButton.disabled = Boolean(message.requiresVariant && !selectedVariantId);
  if (variants.length) {
    detail.append(createVariantSelector(messageId, `${messageId}-variants`, message.variantLabel || "Choose a variant", variants, selectedVariantId, message.product.id, (selection, userMessage) => {
      selectedVariantId = selection.data?.variantId;
      addButton.disabled = Boolean(message.requiresVariant && !selectedVariantId);
      onAction(selection, userMessage);
    }));
  }
  const showQuantity = message.quantity !== void 0 || message.minimumQuantity !== void 0 || message.maximumQuantity !== void 0;
  const quantity = showQuantity ? createQuantitySelector(
    messageId,
    `${messageId}-quantity`,
    message.quantityLabel || "Quantity",
    message.quantity ?? message.minimumQuantity ?? 1,
    message.minimumQuantity ?? 1,
    message.maximumQuantity ?? 20,
    message.decreaseQuantityLabel || "Decrease quantity",
    message.increaseQuantityLabel || "Increase quantity",
    message.product.id,
    onQuantityChange
  ) : null;
  if (quantity) detail.append(quantity);
  addButton.addEventListener("click", () => onAction({
    messageId,
    control: "product-detail",
    actionId: "add-to-cart",
    label: addButton.textContent || "",
    value: message.product.id,
    data: {
      productId: message.product.id,
      quantity: quantity ? Number(quantity.dataset.quantityValue) || 1 : void 0,
      variantId: selectedVariantId
    }
  }, message.actionMessage || addButton.textContent || message.product.name));
  if (message.backActionLabel) {
    detail.append(createControlAction(messageId, "product-detail", "back-to-products", message.backActionLabel, "back", { productId: message.product.id }, onAction, message.backActionLabel));
  }
  detail.append(addButton);
  return detail;
}
function createProductList(messageId, message, onAction) {
  const list = document.createElement("section");
  list.className = "kroma-chat__product-list";
  list.setAttribute("aria-label", message.text);
  message.products.forEach((product) => list.append(createProductListItem(messageId, product, "product-list", message.productActionLabel || "View product", onAction)));
  return list;
}
function appendPrompt(item, message) {
  item.append(createChatBubble(message, item.id));
}
function renderStatus(item, message) {
  item.classList.add("kroma-chat__message--status");
  item.dataset.status = message.status || "neutral";
  item.append(createStatusMessage(message));
}
function renderRich(item, message, handlers) {
  item.append(createRichMessage(message, item.id, (action, userMessage) => handlers.onRichAction(item.id, action, userMessage)));
}
function renderJourneyMenu(item, message, handlers) {
  appendPrompt(item, message);
  item.append(createJourneyMenu(item.id, message, handlers.onAction), createChatMessageTime(message));
}
function renderCategoryPicker(item, message, handlers) {
  appendPrompt(item, message);
  item.append(createCategoryPicker(item.id, message, handlers.onAction), createChatMessageTime(message));
}
function renderProductCard(item, message, handlers) {
  item.append(createProductCard(item.id, message, handlers.onAction), createChatMessageTime(message));
}
function renderProductList(item, message, handlers) {
  appendPrompt(item, message);
  item.append(createProductList(item.id, message, handlers.onAction), createChatMessageTime(message));
}
function renderProductCarousel(item, message, handlers) {
  appendPrompt(item, message);
  item.append(createProductCarousel(item.id, message, handlers.onAction), createChatMessageTime(message));
}
function renderProductDetail(item, message, handlers) {
  item.append(createProductDetail(item.id, message, handlers.onAction, handlers.onQuantityChange), createChatMessageTime(message));
}
function renderProductVariantSelector(item, message, handlers) {
  item.append(createProductVariantSelector(item.id, message, handlers.onAction), createChatMessageTime(message));
}
function renderQuantitySelector(item, message, handlers) {
  item.append(createStandaloneQuantitySelector(item.id, message, handlers.onQuantityChange), createChatMessageTime(message));
}
function renderCartSummary(item, message, handlers) {
  appendPrompt(item, message);
  item.append(createCartSummary(item.id, message, handlers.onAction), createChatMessageTime(message));
}
function renderForm(item, message, handlers) {
  appendPrompt(item, message);
  item.append(createConversationalForm(item.id, message, handlers.onFormInputFocus, handlers.onFormSubmit), createChatMessageTime(message));
}
function renderOrderReview(item, message, handlers) {
  appendPrompt(item, message);
  item.append(createOrderReview(item.id, message, handlers.onAction), createChatMessageTime(message));
}
function renderConfirmation(item, message, handlers) {
  item.append(createConfirmationCard(item.id, message, handlers.onAction), createChatMessageTime(message));
}
function renderQuickReplies(item, message, handlers) {
  appendPrompt(item, message);
  const options = message.type === "options" ? message.options : message.replies;
  item.append(createQuickReplies(item.id, options, handlers.onOptionSelect));
}
function renderChoiceList(item, message, handlers) {
  appendPrompt(item, message);
  item.append(createChoiceList(item.id, message.choices, handlers.onOptionSelect));
}
function renderText(item, message) {
  item.append(createChatBubble(message, item.id));
}
function renderTyping(item, message) {
  item.classList.add("kroma-chat__message--typing");
  item.setAttribute("role", "status");
  item.append(createTypingBubble(message.label || "Assistant is typing"));
}
const renderers = {
  status: (item, message, _handlers) => renderStatus(item, message),
  info: (item, message, handlers) => renderRich(item, message, handlers),
  rich: (item, message, handlers) => renderRich(item, message, handlers),
  "journey-menu": (item, message, handlers) => renderJourneyMenu(item, message, handlers),
  "category-picker": (item, message, handlers) => renderCategoryPicker(item, message, handlers),
  "product-card": (item, message, handlers) => renderProductCard(item, message, handlers),
  "product-list": (item, message, handlers) => renderProductList(item, message, handlers),
  "product-carousel": (item, message, handlers) => renderProductCarousel(item, message, handlers),
  "product-detail": (item, message, handlers) => renderProductDetail(item, message, handlers),
  "product-variant-selector": (item, message, handlers) => renderProductVariantSelector(item, message, handlers),
  "quantity-selector": (item, message, handlers) => renderQuantitySelector(item, message, handlers),
  "cart-summary": (item, message, handlers) => renderCartSummary(item, message, handlers),
  "conversational-form": (item, message, handlers) => renderForm(item, message, handlers),
  "order-review": (item, message, handlers) => renderOrderReview(item, message, handlers),
  confirmation: (item, message, handlers) => renderConfirmation(item, message, handlers),
  "confirmation-card": (item, message, handlers) => renderConfirmation(item, message, handlers),
  "quick-replies": (item, message, handlers) => renderQuickReplies(item, message, handlers),
  options: (item, message, handlers) => renderQuickReplies(item, message, handlers),
  "choice-list": (item, message, handlers) => renderChoiceList(item, message, handlers),
  text: (item, message) => renderText(item, message),
  typing: (item, message) => renderTyping(item, message)
};
function renderChatMessage(item, message, handlers) {
  const type = message.type || "text";
  renderers[type](item, message, handlers);
}
const actionReusePolicies = {
  header: "repeatable",
  "journey-menu": "action-once",
  "category-picker": "action-once",
  "product-card": "action-once",
  "product-list": "action-once",
  "product-carousel": "action-once",
  "product-detail": "message-once",
  "product-variant-selector": "repeatable",
  "conversational-form": "repeatable",
  "cart-summary": "action-once",
  "order-review": "message-once",
  confirmation: "action-once"
};
function actionStateKey(actionId, lineId) {
  return lineId ? `${actionId}${lineId}` : actionId;
}
class ChatMessageList {
  constructor(callbacks, emptyLabel, messagesLabel) {
    this.callbacks = callbacks;
    this.element = document.createElement("ol");
    this.element.className = "kroma-chat__messages";
    this.element.setAttribute("role", "log");
    this.element.setAttribute("aria-live", "polite");
    this.element.setAttribute("aria-relevant", "additions");
    this.element.setAttribute("aria-label", messagesLabel);
    this.emptyState = document.createElement("p");
    this.emptyState.className = "kroma-chat__empty";
    this.emptyState.textContent = emptyLabel;
    this.emptyState.hidden = false;
    this.element.addEventListener("scroll", () => {
      this.shouldStickToBottom = this.isAtBottom();
    }, { passive: true, signal: this.listeners.signal });
  }
  callbacks;
  element;
  emptyState;
  typingIndicator = null;
  shouldStickToBottom = true;
  listeners = new AbortController();
  addMessage(message, messageId) {
    if (message.type === "typing" && this.callbacks.interactive) {
      this.setTyping(true, message.label || "Assistant is typing", messageId);
      return messageId;
    }
    const stick = this.shouldStickToBottom || this.element.children.length === 0;
    const item = document.createElement("li");
    item.className = `kroma-chat__message kroma-chat__message--${message.author}`;
    item.id = messageId;
    item.dataset.messageId = messageId;
    item.dataset.author = message.author;
    item.dataset.messageType = message.type || "text";
    if (message.author === "assistant") {
      const avatar = document.createElement("span");
      avatar.className = "kroma-chat__message-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = "K";
      item.append(avatar);
    }
    const previous = this.element.lastElementChild;
    if (previous?.dataset.author === message.author && previous.dataset.messageType !== "status" && message.type !== "status") {
      previous.classList.add("kroma-chat__message--grouped");
      item.classList.add("kroma-chat__message--grouped");
      item.classList.add("kroma-chat__message--group-continuation");
    }
    const handlers = {
      onAction: (detail, userMessage) => this.emitAction(detail, userMessage),
      onRichAction: (id, action, userMessage) => this.emitRichAction(id, action, userMessage),
      onOptionSelect: (selection, group, button) => this.selectOption(selection, group, button),
      onQuantityChange: this.callbacks.onQuantityChange,
      onFormInputFocus: (input) => {
        if (this.callbacks.interactive) this.callbacks.onFormInputFocus(input);
      },
      onFormSubmit: this.callbacks.onFormSubmit
    };
    renderChatMessage(item, message, handlers);
    this.element.append(item);
    this.restoreConsumedActions(messageId);
    this.emptyState.hidden = true;
    if (stick) this.scrollToMessage(item);
    return messageId;
  }
  setTyping(active, label, messageId) {
    if (!active) {
      this.typingIndicator?.remove();
      this.typingIndicator = null;
      if (!this.element.children.length) this.emptyState.hidden = false;
      return;
    }
    if (this.typingIndicator?.isConnected) {
      const announcement = this.typingIndicator.querySelector(".kroma-chat__sr-only");
      if (announcement) announcement.textContent = label;
      return;
    }
    const stick = this.shouldStickToBottom || this.element.children.length === 0;
    const id = messageId || this.callbacks.createMessageId();
    this.typingIndicator = createTypingIndicator(id, label);
    this.typingIndicator.id = id;
    this.element.append(this.typingIndicator);
    this.emptyState.hidden = true;
    if (stick) this.scrollToBottom();
  }
  setOptionsDisabled(messageId, disabled) {
    const group = this.findMessage(messageId)?.querySelector(".kroma-chat__options");
    if (!group || group.dataset.selected === "true") return;
    group.dataset.hostDisabled = String(disabled);
    group.classList.toggle("kroma-chat__options--inactive", disabled);
    group.querySelectorAll("button").forEach((button) => {
      button.disabled = disabled || button.dataset.optionDisabled === "true";
    });
  }
  disableHistoryControls() {
    this.element.querySelectorAll("li[data-message-id]").forEach((message) => {
      const controls = message.querySelectorAll("button, input, select, textarea");
      if (!controls.length) return;
      message.dataset.controlsDisabled = "true";
      message.setAttribute("aria-disabled", "true");
      controls.forEach((control) => {
        control.disabled = true;
      });
      message.querySelectorAll(".kroma-chat__options").forEach((group) => {
        group.dataset.hostDisabled = "true";
        group.classList.add("kroma-chat__options--inactive");
      });
    });
  }
  restoreOptionSelection(messageId, optionId) {
    const group = this.findMessage(messageId)?.querySelector(".kroma-chat__options");
    if (!group) return;
    group.dataset.selected = "true";
    group.classList.add("kroma-chat__options--selected");
    group.querySelectorAll("button").forEach((button) => {
      button.disabled = true;
      button.setAttribute("aria-pressed", String(button.dataset.optionId === optionId));
    });
  }
  restoreConsumedActions(messageId) {
    const consumed = this.callbacks.consumedActions.get(messageId);
    if (!consumed) return;
    this.findMessage(messageId)?.querySelectorAll("button[data-action-id]").forEach((button) => {
      const key = actionStateKey(button.dataset.actionId || "", button.dataset.lineId);
      if (consumed.has(key)) {
        button.disabled = true;
        button.dataset.consumed = String(consumed.has(`selected:${key}`));
      }
    });
  }
  findMessage(messageId) {
    return [...this.element.querySelectorAll("li[data-message-id]")].find((message) => message.dataset.messageId === messageId);
  }
  scrollToBottom() {
    requestAnimationFrame(() => {
      this.element.scrollTop = this.element.scrollHeight;
    });
  }
  destroy() {
    this.listeners.abort();
  }
  selectOption(selection, group, selectedButton) {
    if (selectedButton.disabled || group.dataset.selected === "true") return;
    group.dataset.selected = "true";
    group.classList.add("kroma-chat__options--selected");
    group.querySelectorAll("button").forEach((button) => {
      button.disabled = true;
      button.setAttribute("aria-pressed", String(button === selectedButton));
    });
    if (!this.callbacks.interactive) return;
    this.callbacks.addUserMessage(selection.label);
    this.scrollToBottom();
    this.callbacks.focusComposer();
    const option = selection.control === "quick-replies" ? selection.option : { id: selection.option.id, label: selection.label, value: selection.value, disabled: selection.option.disabled };
    this.callbacks.onOptionSelect({
      message: selection.value,
      messageId: selection.messageId,
      optionId: selection.optionId,
      value: selection.value,
      label: selection.label,
      control: selection.control,
      option
    });
  }
  emitRichAction(messageId, action, userMessage) {
    if (!this.callbacks.interactive) return;
    const actionId = action.id || `${messageId}-action`;
    const button = this.findMessage(messageId)?.querySelector(`.kroma-chat__rich-action[data-action-id="${CSS.escape(actionId)}"]`);
    if (button && !this.consumeButton(messageId, button, true)) return;
    if (userMessage) {
      this.callbacks.addUserMessage(userMessage);
      this.scrollToBottom();
      this.callbacks.focusComposer();
    }
    this.callbacks.onRichAction({ messageId, actionId, value: action.value }, action, userMessage);
  }
  emitAction(detail, userMessage) {
    if (!this.callbacks.interactive) return;
    if (!this.consumeAction(detail)) return;
    if (userMessage) {
      this.callbacks.addUserMessage(userMessage);
      this.scrollToBottom();
      this.callbacks.focusComposer();
    }
    this.callbacks.onAction(detail, userMessage);
  }
  consumeAction(detail) {
    const policy = detail.control === "cart-summary" && (detail.actionId === "remove-item" || detail.actionId === "edit-quantity") ? "line-once" : actionReusePolicies[detail.control];
    if (policy === "repeatable") return true;
    const sourceMessage = this.findMessage(detail.messageId);
    const buttons = [...sourceMessage?.querySelectorAll("button[data-action-id]") || []];
    const target = buttons.find((button) => button.dataset.actionId === detail.actionId && (policy !== "line-once" || button.dataset.lineId === detail.data?.lineId));
    if (!target) return true;
    if (policy === "message-once") {
      if (buttons.some((button) => this.isConsumed(detail.messageId, button))) return false;
      buttons.forEach((button) => this.consumeButton(detail.messageId, button, button === target));
      return true;
    }
    return this.consumeButton(detail.messageId, target, true);
  }
  isConsumed(messageId, button) {
    return Boolean(this.callbacks.consumedActions.get(messageId)?.has(actionStateKey(button.dataset.actionId || "", button.dataset.lineId)));
  }
  consumeButton(messageId, button, selected) {
    if (this.isConsumed(messageId, button)) return false;
    const consumed = this.callbacks.consumedActions.get(messageId) || /* @__PURE__ */ new Set();
    const key = actionStateKey(button.dataset.actionId || "", button.dataset.lineId);
    consumed.add(key);
    if (selected) consumed.add(`selected:${key}`);
    this.callbacks.consumedActions.set(messageId, consumed);
    button.disabled = true;
    button.dataset.consumed = String(selected);
    return true;
  }
  isAtBottom() {
    return this.element.scrollHeight - this.element.scrollTop - this.element.clientHeight < 56;
  }
  scrollToMessage(message) {
    requestAnimationFrame(() => {
      if (!message.isConnected) return;
      this.element.scrollTop = this.element.scrollHeight;
    });
  }
}
const CHAT_EVENTS = {
  send: "kroma-chat-send",
  optionSelect: "kroma-chat-option-select",
  action: "kroma-chat-action",
  richAction: "kroma-chat-rich-action",
  quantityChange: "kroma-chat-quantity-change",
  formSubmit: "kroma-chat-form-submit"
};
function emitKromaChatEvent(target, name, detail) {
  target.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
}
const tagName = "kroma-chat";
let nextElementId = 0;
class KromaChat extends HTMLElement {
  instanceId = ++nextElementId;
  messageSequence = 0;
  initialized = false;
  history = [];
  selectedOptions = /* @__PURE__ */ new Map();
  disabledOptions = /* @__PURE__ */ new Map();
  consumedActions = /* @__PURE__ */ new Map();
  typing = { active: false, label: "" };
  status = null;
  error = null;
  composerDisabled = false;
  interactionModeValue = "guided";
  headerActions = [];
  header = null;
  messageList = null;
  composer = null;
  modeRevision = 0;
  static get observedAttributes() {
    return ["mode"];
  }
  get mode() {
    return this.getAttribute("mode") === "kitchen" ? "kitchen" : "default";
  }
  set mode(mode) {
    if (this.mode === mode) return;
    this.setAttribute("mode", mode);
  }
  get interactionMode() {
    return this.composer?.mode || this.interactionModeValue;
  }
  set interactionMode(mode) {
    if (this.interactionModeValue === mode && this.composer?.mode === mode) return;
    this.interactionModeValue = mode;
    this.composer?.setInteractionMode(mode);
  }
  attributeChangedCallback(name, previous, current) {
    if (name === "mode" && previous !== current && this.initialized) this.reinitializeForMode();
  }
  connectedCallback() {
    if (this.initialized) return;
    if (this.mode === "kitchen") {
      this.history = [];
      this.selectedOptions.clear();
      this.disabledOptions.clear();
      this.consumedActions.clear();
      this.typing = { active: false, label: "" };
      this.status = null;
      this.error = null;
    }
    this.initialized = true;
    this.classList.add("kroma-chat");
    const title = this.getAttribute("chat-title") || "Assistant";
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", title);
    const header = new ChatHeader({
      title,
      avatar: this.getAttribute("avatar"),
      subtitle: this.getAttribute("subtitle"),
      status: this.status ?? this.getAttribute("status")
    });
    const messageList = new ChatMessageList({
      createMessageId: () => this.createMessageId(),
      consumedActions: this.consumedActions,
      interactive: this.mode !== "kitchen",
      addUserMessage: (text) => this.addMessage({ author: "user", type: "text", text }),
      focusComposer: () => this.composer?.focus(),
      onAction: (detail, userMessage) => this.emitAction(detail, userMessage),
      onRichAction: (detail, action, userMessage) => this.emitRichAction(detail, action, userMessage),
      onOptionSelect: (detail) => this.emitOptionSelect(detail),
      onQuantityChange: (detail) => this.emitQuantityChange(detail),
      onFormInputFocus: (input) => this.composer?.setKeyboardTarget(input),
      onFormSubmit: (detail) => this.emitFormSubmit(detail)
    }, this.getAttribute("empty-state") || "Start a conversation", this.getAttribute("messages-label") || "Messages");
    const composer = new ChatComposer({
      id: `kroma-chat-input-${this.instanceId}`,
      inputLabel: this.getAttribute("input-label") || "Write a message",
      placeholder: this.getAttribute("placeholder") || "Message…",
      sendLabel: this.getAttribute("send-label") || "Send message",
      disabled: this.composerDisabled || this.mode === "kitchen",
      showKeyboardShowcase: this.mode === "kitchen",
      interactionMode: this.mode === "kitchen" ? "guided" : this.interactionModeValue,
      onInteractionModeChange: (mode) => {
        this.interactionModeValue = mode;
      },
      onSend: (message) => this.sendMessage(message)
    });
    this.header = header;
    this.messageList = messageList;
    this.composer = composer;
    this.replaceChildren(
      header.element,
      messageList.element,
      messageList.emptyState,
      composer.element,
      ...composer.keyboardDock ? [composer.keyboardDock] : []
    );
    if (this.headerActions.length && this.mode !== "kitchen") this.setHeaderActions(this.headerActions);
    if (this.error) composer.setError(this.error);
    this.history.forEach(({ id, message }) => messageList.addMessage(message, id));
    this.selectedOptions.forEach((optionId, messageId) => messageList.restoreOptionSelection(messageId, optionId));
    this.disabledOptions.forEach((disabled, messageId) => messageList.setOptionsDisabled(messageId, disabled));
    if (this.typing.active) messageList.setTyping(true, this.typing.label, this.typing.messageId);
    if (this.mode === "kitchen") this.loadKitchenConversation();
  }
  disconnectedCallback() {
    this.modeRevision++;
    this.messageList?.destroy();
    this.composer?.destroy();
    this.messageList = null;
    this.composer = null;
    this.header = null;
    this.initialized = false;
  }
  /** Adds a typed message and returns its stable ID. Legacy text and info payloads remain supported. */
  addMessage(message) {
    const id = message.id || this.createMessageId();
    const normalized = { ...message, id };
    if (normalized.type === "typing" && this.mode !== "kitchen") {
      this.setTyping(true, normalized.label, id);
      return id;
    }
    this.history.push({ id, message: normalized });
    this.messageList?.addMessage(normalized, id);
    return id;
  }
  setTyping(active, label = this.getAttribute("typing-label") || "Assistant is typing", messageId) {
    this.typing = { active, label, messageId };
    this.messageList?.setTyping(active, label, messageId);
  }
  setStatus(status) {
    this.status = status;
    this.header?.setStatus(status);
  }
  setHeaderActions(actions) {
    this.headerActions = [...actions];
    this.header?.setActions(this.mode === "kitchen" ? [] : this.headerActions, (action) => this.emitAction({
      messageId: "header",
      control: "header",
      actionId: action.id,
      label: action.label,
      value: action.value
    }));
  }
  setComposerDisabled(disabled) {
    this.composerDisabled = disabled;
    this.composer?.setDisabled(disabled || this.mode === "kitchen");
  }
  setOptionsDisabled(messageId, disabled) {
    this.disabledOptions.set(messageId, disabled);
    this.messageList?.setOptionsDisabled(messageId, disabled);
  }
  disableHistoryControls() {
    this.composer?.setKeyboardTarget(null);
    this.messageList?.disableHistoryControls();
  }
  setError(message) {
    this.error = message;
    this.composer?.setError(message);
  }
  createMessageId() {
    return `kroma-chat-${this.instanceId}-message-${++this.messageSequence}`;
  }
  sendMessage(message) {
    if (this.mode === "kitchen") return;
    this.addMessage({ id: this.createMessageId(), author: "user", type: "text", text: message });
    this.setError(null);
    emitKromaChatEvent(this, CHAT_EVENTS.send, { message, source: "composer" });
  }
  emitOptionSelect(detail) {
    if (this.mode === "kitchen") return;
    this.selectedOptions.set(detail.messageId, detail.optionId);
    emitKromaChatEvent(this, CHAT_EVENTS.optionSelect, detail);
  }
  emitRichAction(detail, _action, _userMessage) {
    if (this.mode === "kitchen") return;
    emitKromaChatEvent(this, CHAT_EVENTS.richAction, detail);
  }
  emitAction(detail, _userMessage) {
    if (this.mode === "kitchen") return;
    emitKromaChatEvent(this, CHAT_EVENTS.action, detail);
  }
  emitQuantityChange(detail) {
    if (this.mode === "kitchen") return;
    emitKromaChatEvent(this, CHAT_EVENTS.quantityChange, detail);
  }
  emitFormSubmit(detail) {
    if (this.mode === "kitchen") return;
    emitKromaChatEvent(this, CHAT_EVENTS.formSubmit, detail);
  }
  reinitializeForMode() {
    this.modeRevision++;
    this.messageList?.destroy();
    this.composer?.destroy();
    this.header = null;
    this.messageList = null;
    this.composer = null;
    this.history = [];
    this.selectedOptions.clear();
    this.disabledOptions.clear();
    this.consumedActions.clear();
    this.typing = { active: false, label: "" };
    this.status = null;
    this.error = null;
    this.initialized = false;
    this.connectedCallback();
  }
  loadKitchenConversation() {
    const revision = ++this.modeRevision;
    void __vitePreload(async () => {
      const { createKitchenMessages } = await import("./kitchen.messages-ByUaOU2N.js");
      return { createKitchenMessages };
    }, true ? [] : void 0, import.meta.url).then(({ createKitchenMessages }) => {
      if (!this.isConnected || this.mode !== "kitchen" || revision !== this.modeRevision) return;
      createKitchenMessages().forEach((message) => this.addMessage(message));
    }).catch((error) => {
      console.error("[kroma-chat] Kitchen Mode examples could not be loaded.", error);
    });
  }
}
if (!customElements.get(tagName)) customElements.define(tagName, KromaChat);
const poloImage = "" + new URL("chat-polo-v2.png", import.meta.url).href;
const chatJacketImage = "" + new URL("chat-jacket-v2.png", import.meta.url).href;
const chatBottleImage = "" + new URL("chat-bottle-v2.png", import.meta.url).href;
const sneakerImage = "" + new URL("chat-sneaker-v2.png", import.meta.url).href;
const capImage = "" + new URL("chat-cap-v2.png", import.meta.url).href;
window.bootstrap = bootstrap;
const themeStylesheet = document.createElement("link");
themeStylesheet.id = "kroma-theme-stylesheet";
themeStylesheet.rel = "stylesheet";
document.head.append(themeStylesheet);
document.documentElement.setAttribute("data-kroma-theme", "bootstrap");
document.documentElement.setAttribute("data-bs-theme", "dark");
initializeThemeDropdown(bootstrap);
initializeContrastDropdown(bootstrap);
initializeColorTokenPalette();
const commerceDemoCleanups = /* @__PURE__ */ new WeakMap();
document.querySelectorAll("kroma-chat[data-demo='commerce-journey']").forEach((chat) => {
  const modeControl = document.querySelector("[data-chat-mode]");
  if (chat.mode === "default") commerceDemoCleanups.set(chat, initializeCommerceJourneyDemo(chat));
  if (!modeControl) return;
  modeControl.value = chat.mode;
  modeControl.addEventListener("change", () => {
    const nextMode = modeControl.value === "kitchen" ? "kitchen" : "default";
    if (nextMode === chat.mode) return;
    commerceDemoCleanups.get(chat)?.();
    commerceDemoCleanups.delete(chat);
    chat.mode = nextMode;
    if (nextMode === "default") commerceDemoCleanups.set(chat, initializeCommerceJourneyDemo(chat));
  });
});
document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => new Tooltip(element));
document.querySelectorAll('[data-bs-toggle="popover"]').forEach((element) => new Popover(element));
document.querySelectorAll(".toast").forEach((element) => {
  element.classList.remove("fade", "hide");
  element.classList.add("show");
});
document.querySelectorAll('[data-bs-spy="scroll"]').forEach((element) => ScrollSpy.getOrCreateInstance(element));
document.querySelectorAll('a[href="#"]').forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});
const demoCategories = [
  { id: "all", label: "Todos", icon: "all" },
  { id: "clothing", label: "Ropa", icon: "clothing" },
  { id: "accessories", label: "Accesorios", icon: "accessories" }
];
const demoProducts = [
  {
    id: "cotton-polo",
    name: "Polo de algodón",
    summary: "Algodón suave, cuello redondo y corte clásico.",
    description: "Polo de algodón suave, con cuello redondo y un corte clásico para el uso diario.",
    image: { src: poloImage, alt: "Polo blanco de algodón" },
    price: { amount: 49, currency: "PEN", label: "S/ 49.00" },
    features: ["Algodón suave", "Colores blanco y negro", "Lavable a máquina"],
    variants: [
      { id: "polo-size-s", label: "Talla S", value: "S" },
      { id: "polo-size-m", label: "Talla M", value: "M" },
      { id: "polo-size-l", label: "Talla L", value: "L" }
    ]
  },
  {
    id: "light-jacket",
    name: "Casaca ligera",
    summary: "Una capa versátil para días frescos.",
    description: "Casaca ligera y versátil para usar durante los días frescos.",
    image: { src: chatJacketImage, alt: "Casaca ligera color grafito" },
    price: { amount: 129, currency: "PEN", label: "S/ 129.00" },
    features: ["Tela ligera", "Bolsillos laterales", "Cierre frontal"],
    variants: [
      { id: "jacket-size-s", label: "Talla S", value: "S" },
      { id: "jacket-size-m", label: "Talla M", value: "M" }
    ]
  },
  {
    id: "folding-bottle",
    name: "Botella reutilizable",
    summary: "Formato compacto para llevar contigo.",
    description: "Botella reutilizable de formato compacto para llevar contigo.",
    image: { src: chatBottleImage, alt: "Botella reutilizable de acero grafito" },
    price: { amount: 35, currency: "PEN", label: "S/ 35.00" },
    features: ["Tapa a rosca", "Fácil de transportar"]
  },
  {
    id: "urban-sneaker",
    name: "Zapatilla urbana",
    summary: "Diseño ligero para todos los días.",
    description: "Zapatilla urbana ligera en blanco con detalles grafito.",
    image: { src: sneakerImage, alt: "Zapatilla urbana blanca" },
    price: { amount: 129, currency: "PEN", label: "S/ 129.00" },
    features: ["Suela flexible", "Malla transpirable"],
    variants: [
      { id: "sneaker-size-38", label: "Talla 38", value: "38" },
      { id: "sneaker-size-40", label: "Talla 40", value: "40" },
      { id: "sneaker-size-42", label: "Talla 42", value: "42" }
    ]
  },
  {
    id: "classic-cap",
    name: "Gorra clásica",
    summary: "Algodón con ajuste posterior.",
    description: "Gorra de algodón azul noche con ajuste posterior.",
    image: { src: capImage, alt: "Gorra azul noche" },
    price: { amount: 39, currency: "PEN", label: "S/ 39.00" },
    features: ["Algodón tejido", "Ajuste regulable"]
  }
];
const productsByCategory = {
  all: demoProducts.map((product) => product.id),
  clothing: ["cotton-polo", "light-jacket", "urban-sneaker"],
  accessories: ["folding-bottle", "classic-cap"]
};
function getDemoProduct(productId) {
  return demoProducts.find((product) => product.id === productId);
}
function makeMoney(amount) {
  return { amount, currency: "PEN", label: `S/ ${amount.toFixed(2)}` };
}
function toCartItems(lines) {
  return lines.flatMap((line) => {
    const product = getDemoProduct(line.productId);
    if (!product) return [];
    const variant = product.variants?.find((item) => item.id === line.variantId);
    return [{
      id: line.id,
      product,
      variantLabel: variant?.label,
      quantity: line.quantity,
      unitPrice: product.price,
      lineTotal: product.price ? makeMoney(product.price.amount * line.quantity) : void 0
    }];
  });
}
function calculateSubtotal(lines) {
  return makeMoney(lines.reduce((sum, line) => sum + (getDemoProduct(line.productId)?.price?.amount || 0) * line.quantity, 0));
}
function freshJourney() {
  return { step: "welcome", cart: [] };
}
function welcomeMessage() {
  const items = [
    { id: "browse-products", label: "Explorar productos", description: "Ver categorías y productos", icon: "browse" },
    { id: "search-product", label: "Buscar un producto", description: "Encuentra un artículo específico", icon: "search" },
    { id: "order-status", label: "Consultar un pedido", description: "Consulta el estado de una solicitud", icon: "orders" },
    { id: "advisor", label: "Hablar con un asesor", description: "Recibe ayuda personalizada", icon: "advisor" }
  ];
  return { author: "assistant", type: "journey-menu", text: "¡Hola! Bienvenido. ¿Qué te gustaría hacer hoy?", items };
}
function categoriesMessage() {
  return { author: "assistant", type: "category-picker", text: "Estas son nuestras categorías. Selecciona una para explorar los productos.", categories: demoCategories };
}
function quickReplies(text, replies) {
  return { author: "assistant", type: "quick-replies", text, replies };
}
function renderJourney(chat, state, onProductDetail) {
  switch (state.step) {
    case "welcome":
      chat.addMessage(welcomeMessage());
      return;
    case "search-options":
      chat.addMessage(quickReplies("¿Cómo prefieres buscar?", [
        { id: "search-categories", label: "Explorar categorías", value: "explore-products" },
        { id: "search-all", label: "Ver productos disponibles", value: "browse-all" },
        { id: "search-name", label: "Escribir el nombre", value: "write-product-name" }
      ]));
      return;
    case "search-query":
      chat.addMessage({ author: "assistant", text: "Escribe un nombre del catálogo ficticio de esta demostración." });
      chat.addMessage(quickReplies("También puedes explorar por categoría.", [{ id: "search-back", label: "Explorar categorías", value: "explore-products" }]));
      return;
    case "search-results": {
      const products = state.productIds.map(getDemoProduct).filter((product) => Boolean(product));
      if (products.length) {
        const prompt = state.query ? `Coincidencias de ejemplo para “${state.query}”.` : "Estos son los productos ficticios disponibles en la demostración.";
        chat.addMessage({ author: "assistant", type: "product-list", text: prompt, products, productActionLabel: "Ver producto" });
        const replies = [
          { id: "search-again", label: "Cambiar búsqueda", value: "search-again" },
          { id: "search-categories", label: "Explorar categorías", value: "explore-products" }
        ];
        if (state.cart.length) replies.push({ id: "cart", label: `Ver mi selección (${state.cart.length})`, value: "view-cart" });
        chat.addMessage(quickReplies("El catálogo de la demostración es ficticio y limitado.", replies));
      } else {
        chat.addMessage({ author: "system", type: "status", status: "neutral", text: `No hay coincidencias de ejemplo para “${state.query}”.` });
        chat.addMessage(quickReplies("Puedes probar otra búsqueda o explorar las categorías.", [
          { id: "search-again", label: "Cambiar búsqueda", value: "search-again" },
          { id: "search-categories", label: "Explorar categorías", value: "explore-products" }
        ]));
      }
      return;
    }
    case "order-help":
      chat.addMessage({ author: "system", type: "status", status: "neutral", text: "La consulta de pedidos no está conectada en esta demostración. No se consultan ni se inventan estados de pedidos." });
      chat.addMessage(quickReplies("Puedes continuar con el catálogo de ejemplo.", [
        { id: "order-browse", label: "Explorar productos", value: "explore-products" },
        { id: "order-home", label: "Volver al inicio", value: "home" }
      ]));
      return;
    case "advisor-reason":
      chat.addMessage({ author: "assistant", type: "choice-list", text: "¿Sobre qué necesitas orientación?", choices: [
        { id: "advisor-product", title: "Un producto", description: "Características o variantes", value: "product" },
        { id: "advisor-selection", title: "Mi selección", description: "Cantidades o productos guardados", value: "selection" },
        { id: "advisor-order", title: "Un pedido", description: "La consulta real no está disponible en la demo", value: "order" }
      ] });
      return;
    case "advisor-topic":
      chat.addMessage(quickReplies("Elige el tema que mejor describe tu consulta.", state.reason === "product" ? [
        { id: "advisor-features", label: "Características", value: "features" },
        { id: "advisor-variants", label: "Tallas y variantes", value: "variants" }
      ] : state.reason === "selection" ? [
        { id: "advisor-quantities", label: "Modificar cantidades", value: "quantities" },
        { id: "advisor-review", label: "Revisar mi selección", value: "review" }
      ] : [
        { id: "advisor-order-status", label: "Estado de un pedido", value: "order-status" },
        { id: "advisor-other", label: "Otro motivo", value: "other" }
      ]));
      return;
    case "advisor-follow-up":
      chat.addMessage({ author: "system", type: "status", status: "neutral", text: "La atención humana no está conectada en esta demostración. No se ha contactado a ningún asesor." });
      chat.addMessage(quickReplies("Si quieres, puedes añadir contexto localmente o volver a las opciones.", [
        { id: "advisor-note", label: "Añadir información", value: "advisor-note" },
        { id: "advisor-home", label: "Volver al inicio", value: "home" }
      ]));
      return;
    case "advisor-note":
      chat.addMessage({ author: "assistant", text: "Escribe información adicional. Permanecerá en esta demostración y no se enviará a un asesor." });
      return;
    case "advisor-note-received":
      chat.addMessage({ author: "system", type: "status", status: "neutral", text: "La información solo quedó en el historial local. No se envió a un asesor ni a un servidor." });
      chat.addMessage(quickReplies("Puedes continuar con el catálogo de ejemplo.", [
        { id: "advisor-browse", label: "Explorar productos", value: "explore-products" },
        { id: "advisor-home", label: "Volver al inicio", value: "home" }
      ]));
      return;
    case "cart-edit":
      chat.addMessage({ author: "assistant", text: "Ajusta las cantidades. Los cambios se aplicarán al guardar." });
      state.draftCart.forEach((line) => {
        const product = getDemoProduct(line.productId);
        if (!product) return;
        const variant = product.variants?.find((item) => item.id === line.variantId);
        chat.addMessage({ author: "assistant", type: "quantity-selector", controlId: `cart-edit:${state.revision}:${line.id}`, productId: line.id, label: [product.name, variant?.label].filter(Boolean).join(" · "), value: line.quantity, minimum: 1, maximum: 99, decreaseLabel: "Reducir cantidad", increaseLabel: "Aumentar cantidad" });
      });
      chat.addMessage(quickReplies("¿Listo?", [
        { id: "save-cart-edits", label: "Guardar cambios", value: `save-cart:${state.revision}` },
        { id: "cancel-cart-edits", label: "Cancelar", value: `cancel-cart:${state.revision}` }
      ]));
      return;
    case "categories":
      chat.addMessage(categoriesMessage());
      return;
    case "products": {
      const products = productsByCategory[state.categoryId].map(getDemoProduct).filter((product) => Boolean(product));
      const prompt = state.categoryId === "clothing" ? "Estos son los productos de ropa. Selecciona uno para conocer sus características." : state.categoryId === "accessories" ? "Este es un accesorio de ejemplo. Selecciónalo para ver sus características." : "Explora los productos ficticios disponibles en esta demostración.";
      chat.addMessage({ author: "assistant", type: "product-list", text: prompt, products, productActionLabel: "Ver producto" });
      const replies = state.cart.length ? [
        { id: "categories", label: "Cambiar categoría", value: "back-categories" },
        { id: "cart", label: `Ver mi selección (${state.cart.length})`, value: "view-cart" }
      ] : [
        { id: "categories", label: "Cambiar categoría", value: "back-categories" },
        { id: "home", label: "Volver al inicio", value: "home" }
      ];
      chat.addMessage(quickReplies("También puedes navegar por las opciones anteriores.", replies));
      return;
    }
    case "product-detail": {
      const product = getDemoProduct(state.productId);
      if (!product) {
        chat.addMessage({ author: "system", type: "status", status: "error", text: "No encontramos ese producto en el catálogo de ejemplo." });
        return;
      }
      const messageId = chat.addMessage({
        author: "assistant",
        type: "product-detail",
        product,
        selectedVariantId: state.variantId,
        variantLabel: "Selecciona una talla",
        quantity: state.quantity,
        quantityLabel: "Cantidad",
        decreaseQuantityLabel: "Reducir cantidad",
        increaseQuantityLabel: "Aumentar cantidad",
        minimumQuantity: 1,
        maximumQuantity: 10,
        requiresVariant: Boolean(product.variants?.length),
        addActionLabel: "Agregar a mi selección",
        backActionLabel: "Ver otros productos",
        actionMessage: "Agregar producto a mi selección"
      });
      onProductDetail?.(messageId);
      const detailActions = [{ id: "change-category", label: "Cambiar categoría", value: "back-categories" }];
      if (state.cart.length) detailActions.unshift({ id: "cart", label: `Revisar selección (${state.cart.length})`, value: "view-cart" });
      chat.addMessage(quickReplies(state.cart.length ? "También puedes cambiar de categoría o revisar lo que llevas." : "Puedes cambiar de categoría o volver a la lista.", detailActions));
      return;
    }
    case "after-add":
      chat.addMessage({ author: "assistant", text: "Producto agregado a tu selección. Puedes seguir explorando o revisar lo que llevas." });
      chat.addMessage(quickReplies("¿Qué prefieres hacer?", [
        { id: "continue", label: "Seguir explorando", value: "continue-shopping" },
        { id: "cart", label: `Revisar selección (${state.cart.length})`, value: "view-cart" }
      ]));
      return;
    case "cart":
      chat.addMessage({
        author: "assistant",
        type: "cart-summary",
        text: "Este es el resumen de los productos seleccionados.",
        items: toCartItems(state.cart).map((item) => ({
          ...item,
          actions: [
            { id: "edit-quantity", label: "Editar cantidad", value: item.id, messageText: "Editar cantidades" },
            { id: "remove-item", label: "Quitar", value: item.id, messageText: `Quitar ${item.product.name}` }
          ]
        })),
        subtotal: state.cart.length ? calculateSubtotal(state.cart) : void 0,
        subtotalTitle: "Subtotal de ejemplo",
        continueLabel: state.cart.length ? "Continuar con mis datos" : void 0,
        removeItemLabel: "Quitar",
        emptyLabel: "Tu selección está vacía. Puedes seguir explorando productos."
      });
      chat.addMessage(quickReplies("Puedes seguir explorando o solicitar orientación.", [
        { id: "browse", label: "Seguir explorando", value: "continue-shopping" },
        { id: "advisor", label: "Solicitar atención", value: "start-advisor" }
      ]));
      return;
    case "customer-information":
      chat.addMessage({
        author: "assistant",
        type: "conversational-form",
        text: "Para preparar tu solicitud de ejemplo, necesitamos algunos datos.",
        fields: [
          { id: "name", name: "name", label: "Nombre", type: "text", required: true, placeholder: "Tu nombre", autocomplete: "name", value: state.customer?.name },
          { id: "contact", name: "contact", label: "Correo o teléfono", type: "text", required: true, placeholder: "Dato de contacto", value: state.customer?.contact },
          { id: "delivery", name: "delivery", label: "Dirección o zona de entrega", type: "text", required: true, placeholder: "Zona de entrega", autocomplete: "street-address", value: state.customer?.delivery }
        ],
        submitLabel: "Revisar solicitud"
      });
      chat.addMessage(quickReplies("Los datos solo permanecen en esta demostración.", [{ id: "back-cart", label: "Volver al resumen", value: "back-to-cart" }]));
      return;
    case "order-review":
      chat.addMessage({
        author: "assistant",
        type: "order-review",
        text: "Revisa los datos antes de confirmar tu solicitud de ejemplo.",
        customer: state.customer,
        customerLabels: { name: "Cliente", contact: "Contacto", delivery: "Entrega" },
        items: toCartItems(state.cart),
        subtotal: calculateSubtotal(state.cart),
        subtotalTitle: "Subtotal de ejemplo",
        confirmLabel: "Confirmar solicitud simulada",
        editLabel: "Editar datos",
        removeItemLabel: "Quitar"
      });
      return;
    case "completed":
      chat.addMessage({
        author: "assistant",
        type: "confirmation",
        title: "Solicitud simulada",
        description: "Has completado el recorrido de ejemplo. No se ha registrado ningún pedido real ni enviado información a un servidor.",
        reference: `Referencia de simulación #${state.reference}`,
        summary: state.cart.map((line) => `${getDemoProduct(line.productId)?.name || line.productId} × ${line.quantity}`),
        action: { id: "restart-journey", label: "Iniciar otra conversación", value: "restart", messageText: "Iniciar otra conversación" }
      });
  }
}
function initializeCommerceJourneyDemo(chat) {
  const listeners = new AbortController();
  let state = freshJourney();
  let pendingReply = 0;
  let productDetailMessageId = null;
  let cartEditRevision = 0;
  const render = () => renderJourney(chat, state, (messageId) => {
    productDetailMessageId = messageId;
  });
  render();
  const transition = (event, delayed = true, renderResult = true) => {
    const next = reduceJourney(state, event);
    if (next === state) return;
    const keepProductDetailMessage = state.step === "product-detail" && next.step === "product-detail";
    state = next;
    if (!keepProductDetailMessage) productDetailMessageId = null;
    chat.interactionMode = "guided";
    const revision = ++pendingReply;
    if (renderResult) chat.disableHistoryControls();
    if (!delayed) {
      if (renderResult) render();
      return;
    }
    chat.setTyping(true, "El asistente está escribiendo");
    window.setTimeout(() => {
      if (revision !== pendingReply) return;
      chat.setTyping(false);
      render();
    }, 420);
  };
  chat.addEventListener("kroma-chat-action", (event) => {
    const detail = event.detail;
    switch (detail.control) {
      case "journey-menu":
        if (detail.value === "browse-products") transition({ type: "explore-products" });
        else if (detail.value === "search-product") transition({ type: "search-products" });
        else if (detail.value === "order-status") transition({ type: "show-order-help" });
        else if (detail.value === "advisor") transition({ type: "start-advisor" });
        break;
      case "category-picker":
        if (detail.value === "all" || detail.value === "clothing" || detail.value === "accessories") transition({ type: "choose-category", categoryId: detail.value });
        break;
      case "product-card":
      case "product-list":
      case "product-carousel":
        if (detail.data?.productId) transition({ type: "choose-product", productId: detail.data.productId });
        break;
      case "product-detail":
        if (detail.messageId !== productDetailMessageId) break;
        if (detail.actionId === "back-to-products") transition({ type: "back-to-products" });
        else if (detail.actionId === "add-to-cart") transition({ type: "add-product", productId: detail.data?.productId, variantId: detail.data?.variantId, quantity: detail.data?.quantity });
        break;
      case "product-variant-selector":
        if (detail.messageId === productDetailMessageId) transition({ type: "choose-variant", productId: detail.data?.productId, variantId: detail.data?.variantId }, false, false);
        break;
      case "cart-summary":
        if (detail.actionId === "remove-item") transition({ type: "remove-item", lineId: detail.data?.lineId || detail.value });
        else if (detail.actionId === "edit-quantity") transition({ type: "edit-cart-quantities", revision: ++cartEditRevision });
        else if (detail.actionId === "continue") transition({ type: "checkout" });
        break;
      case "order-review":
        if (detail.actionId === "confirm") transition({ type: "confirm-order" });
        else if (detail.actionId === "edit") transition({ type: "edit-customer" });
        break;
      case "confirmation":
        if (detail.actionId === "restart-journey") transition({ type: "restart" });
        break;
    }
  }, { signal: listeners.signal });
  chat.addEventListener("kroma-chat-quantity-change", (event) => {
    const detail = event.detail;
    if (state.step === "product-detail" && detail.messageId === productDetailMessageId) {
      transition({ type: "change-quantity", productId: detail.productId, quantity: detail.quantity }, false, false);
      return;
    }
    if (state.step === "cart-edit") {
      const match = /^cart-edit:(\d+):(.+)$/.exec(detail.controlId);
      if (match) transition({ type: "change-cart-quantity", revision: Number(match[1]), lineId: match[2], quantity: detail.quantity }, false, false);
    }
  }, { signal: listeners.signal });
  chat.addEventListener("kroma-chat-form-submit", (event) => {
    const detail = event.detail;
    transition({
      type: "submit-customer",
      customer: { name: detail.values.name || "", contact: detail.values.contact || "", delivery: detail.values.delivery || "" }
    });
  }, { signal: listeners.signal });
  chat.addEventListener("kroma-chat-option-select", (event) => {
    const detail = event.detail;
    const saveRevision = /^save-cart:(\d+)$/.exec(detail.value);
    if (saveRevision) {
      transition({ type: "save-cart-quantities", revision: Number(saveRevision[1]) });
      return;
    }
    const cancelRevision = /^cancel-cart:(\d+)$/.exec(detail.value);
    if (cancelRevision) {
      transition({ type: "cancel-cart-quantities", revision: Number(cancelRevision[1]) });
      return;
    }
    switch (detail.value) {
      case "continue-shopping":
        transition({ type: "continue-shopping" });
        break;
      case "view-cart":
        transition({ type: "view-cart" });
        break;
      case "browse-all":
        transition({ type: "search-results", query: "", productIds: demoProducts.map((product) => product.id) });
        break;
      case "write-product-name":
      case "search-again":
        transition({ type: "search-query" });
        chat.interactionMode = "free-text";
        break;
      case "start-advisor":
        transition({ type: "start-advisor" });
        break;
      case "advisor-note":
        transition({ type: "advisor-note" });
        chat.interactionMode = "free-text";
        break;
      case "back-to-cart":
        transition({ type: "back-to-cart" });
        break;
      case "back-categories":
        transition({ type: "back-to-categories" });
        break;
      case "back-home":
      case "home":
        transition({ type: "home" });
        break;
      case "explore-products":
        transition({ type: "explore-products" });
        break;
      default:
        if (state.step === "advisor-reason" && ["product", "selection", "order"].includes(detail.value)) {
          transition({ type: "advisor-reason", reason: detail.value });
        } else if (state.step === "advisor-topic") {
          transition({ type: "advisor-topic", reason: state.reason, topic: detail.value });
        }
        break;
    }
  }, { signal: listeners.signal });
  chat.addEventListener("kroma-chat-send", (event) => {
    const detail = event.detail;
    if (state.step === "search-query") {
      const query = detail.message.trim();
      const normalizedQuery = normalizeSearchText(query);
      const productIds = demoProducts.filter((product) => [product.name, product.summary, product.description, ...product.features || []].some((text) => normalizeSearchText(text || "").includes(normalizedQuery))).map((product) => product.id);
      transition({ type: "search-results", query, productIds });
      return;
    }
    if (state.step === "advisor-note") {
      transition({ type: "advisor-note-received" });
      return;
    }
    const revision = ++pendingReply;
    chat.setTyping(true, "El asistente está escribiendo");
    window.setTimeout(() => {
      if (revision !== pendingReply) return;
      chat.setTyping(false);
      chat.addMessage({ author: "system", type: "status", status: "neutral", text: "La escritura libre no está conectada a un asistente en esta demostración. Usa las opciones guiadas para explorar el catálogo de ejemplo." });
      const replies = [{ id: "browse", label: "Explorar categorías", value: "explore-products" }];
      if (state.cart.length) replies.push({ id: "cart", label: `Ver mi selección (${state.cart.length})`, value: "view-cart" });
      chat.addMessage(quickReplies("¿Qué prefieres hacer?", replies));
    }, 420);
  }, { signal: listeners.signal });
  return () => {
    pendingReply++;
    listeners.abort();
  };
}
function reduceJourney(state, event) {
  switch (event.type) {
    case "explore-products":
      return ["welcome", "search-options", "search-query", "search-results", "order-help", "after-add", "cart", "customer-information", "advisor-reason", "advisor-topic", "advisor-follow-up", "advisor-note-received"].includes(state.step) ? { step: "categories", cart: state.cart } : state;
    case "search-products":
      return ["welcome", "search-options", "search-query", "search-results"].includes(state.step) ? { step: "search-options", cart: state.cart } : state;
    case "search-query":
      return ["search-options", "search-results"].includes(state.step) ? { step: "search-query", cart: state.cart } : state;
    case "search-results":
      return ["search-options", "search-query"].includes(state.step) ? { step: "search-results", cart: state.cart, query: event.query, productIds: event.productIds } : state;
    case "show-order-help":
      return state.step === "welcome" ? { step: "order-help", cart: state.cart } : state;
    case "start-advisor":
      return ["welcome", "cart", "after-add"].includes(state.step) ? { step: "advisor-reason", cart: state.cart } : state;
    case "advisor-reason":
      return state.step === "advisor-reason" ? { step: "advisor-topic", cart: state.cart, reason: event.reason } : state;
    case "advisor-topic":
      return state.step === "advisor-topic" && state.reason === event.reason ? { step: "advisor-follow-up", cart: state.cart, reason: event.reason, topic: event.topic } : state;
    case "advisor-note":
      return state.step === "advisor-follow-up" ? { step: "advisor-note", cart: state.cart } : state;
    case "advisor-note-received":
      return state.step === "advisor-note" ? { step: "advisor-note-received", cart: state.cart } : state;
    case "home":
      return { step: "welcome", cart: state.cart };
    case "choose-category":
      return state.step === "categories" && demoCategories.some((category) => category.id === event.categoryId) ? { step: "products", cart: state.cart, categoryId: event.categoryId } : state;
    case "choose-product": {
      if (state.step !== "products" && state.step !== "search-results") return state;
      const allowedProducts = state.step === "products" ? productsByCategory[state.categoryId] : state.productIds;
      if (!allowedProducts.includes(event.productId)) return state;
      const product = getDemoProduct(event.productId);
      if (!product) return state;
      const categoryId = state.step === "products" ? state.categoryId : productsByCategory.clothing.includes(product.id) ? "clothing" : productsByCategory.accessories.includes(product.id) ? "accessories" : "all";
      return { step: "product-detail", cart: state.cart, categoryId, productId: product.id, quantity: 1 };
    }
    case "choose-variant": {
      if (state.step !== "product-detail" || event.productId && event.productId !== state.productId) return state;
      const variants = getDemoProduct(state.productId)?.variants || [];
      return event.variantId && variants.some((variant) => variant.id === event.variantId) ? { ...state, variantId: event.variantId } : state;
    }
    case "change-quantity":
      if (state.step !== "product-detail" || event.productId && event.productId !== state.productId) return state;
      return { ...state, quantity: Math.max(1, Math.min(10, Math.floor(event.quantity))) };
    case "add-product": {
      if (state.step !== "product-detail" || event.productId && event.productId !== state.productId) return state;
      const productId = state.productId;
      const product = getDemoProduct(productId);
      const variantId = event.variantId || state.variantId;
      if (!product || product.variants?.length && !product.variants.some((variant) => variant.id === variantId)) return state;
      const lineId = `${productId}:${variantId || "default"}`;
      const quantity = Math.max(1, Math.min(10, Math.floor(event.quantity || state.quantity)));
      const existing = state.cart.find((line) => line.id === lineId);
      const cart = existing ? state.cart.map((line) => line.id === lineId ? { ...line, quantity: Math.min(99, line.quantity + quantity) } : line) : [...state.cart, { id: lineId, productId, variantId, quantity }];
      return { step: "after-add", cart, categoryId: state.categoryId, productId };
    }
    case "back-to-products":
      return state.step === "product-detail" ? { step: "products", cart: state.cart, categoryId: state.categoryId } : state;
    case "back-to-categories":
      return state.step === "products" || state.step === "product-detail" ? { step: "categories", cart: state.cart } : state;
    case "continue-shopping":
      if (state.step === "after-add") return { step: "products", cart: state.cart, categoryId: state.categoryId };
      if (state.step === "cart" || state.step === "customer-information") return { step: "categories", cart: state.cart };
      return state;
    case "view-cart":
      return state.cart.length && ["welcome", "search-results", "products", "product-detail", "after-add", "advisor-topic", "advisor-follow-up", "advisor-note-received"].includes(state.step) ? { step: "cart", cart: state.cart } : state;
    case "edit-cart-quantities":
      return state.step === "cart" && state.cart.length ? { step: "cart-edit", cart: state.cart, draftCart: state.cart.map((line) => ({ ...line })), revision: event.revision } : state;
    case "change-cart-quantity":
      if (state.step !== "cart-edit" || state.revision !== event.revision || !state.draftCart.some((line) => line.id === event.lineId)) return state;
      return { ...state, draftCart: state.draftCart.map((line) => line.id === event.lineId ? { ...line, quantity: Math.max(1, Math.min(99, Math.floor(event.quantity))) } : line) };
    case "save-cart-quantities":
      return state.step === "cart-edit" && state.revision === event.revision ? { step: "cart", cart: state.draftCart } : state;
    case "cancel-cart-quantities":
      return state.step === "cart-edit" && state.revision === event.revision ? { step: "cart", cart: state.cart } : state;
    case "remove-item":
      if (state.step !== "cart" || !event.lineId || !state.cart.some((line) => line.id === event.lineId)) return state;
      return { step: "cart", cart: state.cart.filter((line) => line.id !== event.lineId) };
    case "checkout":
      return state.step === "cart" && state.cart.length ? { step: "customer-information", cart: state.cart } : state;
    case "back-to-cart":
      return state.step === "customer-information" || state.step === "order-review" ? { step: "cart", cart: state.cart } : state;
    case "submit-customer":
      return state.step === "customer-information" ? { step: "order-review", cart: state.cart, customer: event.customer } : state;
    case "edit-customer":
      return state.step === "order-review" ? { step: "customer-information", cart: state.cart, customer: state.customer } : state;
    case "confirm-order":
      return state.step === "order-review" ? { step: "completed", cart: state.cart, customer: state.customer, reference: "SIM-001" } : state;
    case "restart":
      return { step: "welcome", cart: [] };
    default:
      return state;
  }
}
function normalizeSearchText(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
}
export {
  capImage as c,
  poloImage as p,
  sneakerImage as s
};
//# sourceMappingURL=app-WzcooMD1.js.map
