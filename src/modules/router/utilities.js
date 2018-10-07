let utilities = {};

// parseUrl(location, mode) - Augment the native URL() constructor to get info about hash paths
//
// Example parseUrl('http://domain.com/other/path?queryParam3=false#/example/path?queryParam1=true&queryParam2=example%20string#middle', 'auto')
//
// returns {
//   path: '/example/path',
//   hash: '#middle'
//   search: '?queryParam1=true&queryParam2=example%20string',
//   isHashPath: true
// }
//
// Note: The location must be a fully qualified URL with a protocol like 'http(s)://'
utilities.parseUrl = function(location, mode) {
  var url = {
    isHashPath: mode === "hash"
  };

  if (typeof URL === "function") {
    // browsers that support `new URL()`
    var nativeUrl = new URL(location);
    url.path = nativeUrl.pathname;
    url.hash = nativeUrl.hash;
    url.search = nativeUrl.search;
  } else {
    // IE
    var anchor = document.createElement("a");
    anchor.href = location;
    url.path = anchor.pathname;
    if (url.path.charAt(0) !== "/") {
      url.path = "/" + url.path;
    }
    url.hash = anchor.hash;
    url.search = anchor.search;
  }

  if (mode !== "pushstate") {
    // auto or hash

    // check for a hash path
    if (url.hash.substring(0, 2) === "#/") {
      // hash path
      url.isHashPath = true;
      url.path = url.hash.substring(1);
    } else if (url.hash.substring(0, 3) === "#!/") {
      // hashbang path
      url.isHashPath = true;
      url.path = url.hash.substring(2);
    } else if (url.isHashPath) {
      // still use the hash if mode="hash"
      if (url.hash.length === 0) {
        url.path = "/";
      } else {
        url.path = url.hash.substring(1);
      }
    }

    if (url.isHashPath) {
      url.hash = "";

      // hash paths might have an additional hash in the hash path for scrolling to a specific part of the page #/hash/path#elementId
      var secondHashIndex = url.path.indexOf("#");
      if (secondHashIndex !== -1) {
        url.hash = url.path.substring(secondHashIndex);
        url.path = url.path.substring(0, secondHashIndex);
      }

      // hash paths get the search from the hash if it exists
      var searchIndex = url.path.indexOf("?");
      if (searchIndex !== -1) {
        url.search = url.path.substring(searchIndex);
        url.path = url.path.substring(0, searchIndex);
      }
    }
  }

  return url;
};

// testRoute(routePath, urlPath, trailingSlashOption, isRegExp) - Test if the route's path matches the URL's path
//
// Example routePath: '/user/:userId/**'
// Example urlPath = '/user/123/bio'
utilities.testRoute = function(
  routePath,
  urlPath,
  trailingSlashOption,
  isRegExp
) {
  // try to fail or succeed as quickly as possible for the most common cases

  // handle trailing slashes (options: strict (default), ignore)
  if (trailingSlashOption === "ignore") {
    // remove trailing / from the route path and URL path
    if (urlPath.slice(-1) === "/") {
      urlPath = urlPath.slice(0, -1);
    }
    if (routePath.slice(-1) === "/" && !isRegExp) {
      routePath = routePath.slice(0, -1);
    }
  }

  // test regular expressions
  if (isRegExp) {
    return utilities.testRegExString(routePath, urlPath);
  }

  // if the urlPath is an exact match or '*' then the route is a match
  if (routePath === urlPath || routePath === "*") {
    return true;
  }

  // relative routes a/b/c are the same as routes that start with a globstar /**/a/b/c
  if (routePath.charAt(0) !== "/") {
    routePath = "/**/" + routePath;
  }

  // recursively test if the segments match (start at 1 because 0 is always an empty string)
  return segmentsMatch(routePath.split("/"), 1, urlPath.split("/"), 1);
};

// routeArguments(routePath, urlPath, search, isRegExp) - Gets the path variables and query parameter values from the URL
utilities.routeArguments = function(
  routePath,
  urlPath,
  search,
  isRegExp,
  typecast
) {
  let params = {},
    query = {};

  // regular expressions can't have path variables
  if (!isRegExp) {
    // relative routes a/b/c are the same as routes that start with a globstar /**/a/b/c
    if (routePath.charAt(0) !== "/") {
      routePath = "/**/" + routePath;
    }

    // get path variables
    // urlPath '/customer/123'
    // routePath '/customer/:id'
    // parses id = '123'
    segmentsMatch(routePath.split("/"), 1, urlPath.split("/"), 1, params);
  }

  var queryParameters = search.substring(1).split("&");
  // split() on an empty string has a strange behavior of returning [''] instead of []
  if (queryParameters.length === 1 && queryParameters[0] === "") {
    queryParameters = [];
  }
  for (var i = 0; i < queryParameters.length; i++) {
    var queryParameter = queryParameters[i];
    var queryParameterParts = queryParameter.split("=");

    query[queryParameterParts[0]] = queryParameterParts
      .splice(1, queryParameterParts.length - 1)
      .join("=");
  }

  if (typecast) {
    // parse the arguments into unescaped strings, numbers, or booleans
    for (let key in params) {
      params[key] = utilities.typecast(params[key]);
    }
    for (let key in query) {
      query[key] = utilities.typecast(query[key]);
    }
  }

  return { path: urlPath, params, query };
};

// typecast(value) - Typecast the string value to an unescaped string, number, or boolean
utilities.typecast = function(value) {
  // bool
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }

  // number
  if (!isNaN(value) && value !== "" && value.charAt(0) !== "0") {
    return +value;
  }

  // string
  return decodeURIComponent(value);
};

// testRegExString(pattern, value) - Parse HTML attribute path="/^\/\w+\/\d+$/i" to a regular
// expression `new RegExp('^\/\w+\/\d+$', 'i')` and test against it.
//
// note that 'i' is the only valid option. global 'g', multiline 'm', and sticky 'y' won't be valid matchers for a path.
utilities.testRegExString = function(pattern, value) {
  if (pattern.charAt(0) !== "/") {
    // must start with a slash
    return false;
  }
  pattern = pattern.slice(1);
  var options = "";
  if (pattern.slice(-1) === "/") {
    pattern = pattern.slice(0, -1);
  } else if (pattern.slice(-2) === "/i") {
    pattern = pattern.slice(0, -2);
    options = "i";
  } else {
    // must end with a slash followed by zero or more options
    return false;
  }
  return new RegExp(pattern, options).test(value);
};

// segmentsMatch(routeSegments, routeIndex, urlSegments, urlIndex, pathVariables)
// recursively test the route segments against the url segments in place (without creating copies of the arrays
// for each recursive call)
//
// example routeSegments ['', 'user', ':userId', '**']
// example urlSegments ['', 'user', '123', 'bio']
function segmentsMatch(
  routeSegments,
  routeIndex,
  urlSegments,
  urlIndex,
  pathVariables
) {
  var routeSegment = routeSegments[routeIndex];
  var urlSegment = urlSegments[urlIndex];

  // if we're at the last route segment and it is a globstar, it will match the rest of the url
  if (routeSegment === "**" && routeIndex === routeSegments.length - 1) {
    return true;
  }

  // we hit the end of the route segments or the url segments
  if (
    typeof routeSegment === "undefined" ||
    typeof urlSegment === "undefined"
  ) {
    // return true if we hit the end of both at the same time meaning everything else matched, else return false
    return routeSegment === urlSegment;
  }

  // if the current segments match, recursively test the remaining segments
  if (
    routeSegment === urlSegment ||
    routeSegment === "*" ||
    routeSegment.charAt(0) === ":"
  ) {
    // store the path variable if we have a pathVariables object
    if (
      routeSegment.charAt(0) === ":" &&
      typeof pathVariables !== "undefined"
    ) {
      pathVariables[routeSegment.substring(1)] = urlSegments[urlIndex];
    }
    return segmentsMatch(
      routeSegments,
      routeIndex + 1,
      urlSegments,
      urlIndex + 1,
      pathVariables
    );
  }

  // globstars can match zero to many URL segments
  if (routeSegment === "**") {
    // test if the remaining route segments match any combination of the remaining url segments
    for (var i = urlIndex; i < urlSegments.length; i++) {
      if (
        segmentsMatch(
          routeSegments,
          routeIndex + 1,
          urlSegments,
          i,
          pathVariables
        )
      ) {
        return true;
      }
    }
  }

  // all tests failed, the route segments do not match the url segments
  return false;
}

export default utilities;
