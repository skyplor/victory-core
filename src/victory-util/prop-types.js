/* eslint-disable max-len */
/* global console */
import { isFunction } from "lodash";
import PropTypes from "prop-types";

/**
 * Return a new validator based on `validator` but with the option to chain
 * `isRequired` onto the validation. This is nearly identical to how React
 * does it internally, but they don't expose their helper for us to use.
 * @param {Function} validator Validation function.
 * @returns {Function} Validator with `isRequired` option.
 */
const makeChainable = function (validator) {
  /* eslint-disable max-params */
  const _chainable = function (isRequired, props, propName, componentName, ...rest) {
    const value = props[propName];
    if (typeof value === "undefined" || value === null) {
      if (isRequired) {
        return new Error(
          `Required \`${propName}\` was not specified in \`${componentName}\`.`
        );
      }
      return null;
    }
    return validator(props, propName, componentName, ...rest);
  };
  const chainable = _chainable.bind(null, false);
  chainable.isRequired = _chainable.bind(null, true);
  return chainable;
};

const nullConstructor = () => null;
const undefinedConstructor = () => undefined;

/**
 * Get the constructor of `value`. If `value` is null or undefined, return the
 * special singletons `nullConstructor` or `undefinedConstructor`, respectively.
 * @param {*} value Instance to return the constructor of.
 * @returns {Function} Constructor of `value`.
 */
const getConstructor = (value) => {
  if (typeof value === "undefined") {
    return undefinedConstructor;
  } else if (value === null) {
    return nullConstructor;
  } else {
    return value.constructor;
  }
};

/**
 * Get the name of the constructor used to create `value`, using
 * `Object.protoype.toString`. If the value is null or undefined, return
 * "null" or "undefined", respectively.
 * @param {*} value Instance to return the constructor name of.
 * @returns {String} Name of the constructor.
 */
const getConstructorName = (value) => {
  if (typeof value === "undefined") {
    return "undefined";
  } else if (value === null) {
    return "null";
  }
  return Object.prototype.toString.call(value).slice(8, -1);
};

export default {
  /**
   * Return a new validator based on `propType` but which logs a `console.error`
   * with `explanation` if used.
   * @param {Function} propType The old, deprecated propType.
   * @param {String} explanation The message to provide the user of the deprecated propType.
   * @returns {Function} Validator which logs usage of this propType
   */
  deprecated(propType, explanation) {
    return (props, propName, componentName, ...rest) => {
      if (process.env.NODE_ENV !== "production") {
        /* eslint-disable no-console */
        if (typeof console !== "undefined" && console.error) {
          if (props[propName] !== null) {
            console.error(false,
              `"${propName}" property of "${componentName}" has been deprecated ${explanation}`);
          }
        }
        /* eslint-enable no-console */
      }
      return propType(props, propName, componentName, ...rest);
    };
  },

  /**
   * Return a new validator which returns true
   * if and only if all validators passed as arguments return true.
   * Like React.propTypes.oneOfType, except "all" instead of "any"
   * @param {Array} validators Validation functions.
   * @returns {Function} Combined validator function
   */
  allOfType(validators) {
    return makeChainable((props, propName, componentName, ...rest) => {
      const error = validators.reduce((result, validator) => {
        return result || validator(props, propName, componentName, ...rest);
      }, undefined);
      if (error) {
        return error;
      }
    });
  },

  /**
   * Check that the value is a non-negative number.
   */
  nonNegative: makeChainable((props, propName, componentName, ...rest) => {
    const error = PropTypes.checkPropTypes({testProp: PropTypes.number}, props, propName, componentName, ...rest);
    if (error) {
      return error;
    }
    const value = props[propName];
    if (value < 0) {
      return new Error(
        `\`${propName}\` in \`${componentName}\` must be non-negative.`
      );
    }
  }),

  /**
   * Check that the value is an integer.
   */
  integer: makeChainable((props, propName, componentName, ...rest) => {
    const error = PropTypes.checkPropTypes({testProp: PropTypes.number}, props, propName, componentName, ...rest);
    if (error) {
      return error;
    }
    const value = props[propName];
    if (value % 1 !== 0) {
      return new Error(
        `\`${propName}\` in \`${componentName}\` must be an integer.`
      );
    }
  }),

  /**
   * Check that the value is greater than zero.
   */
  greaterThanZero: makeChainable((props, propName, componentName, ...rest) => {
    const error = PropTypes.checkPropTypes({testProp: PropTypes.number}, props, propName, componentName, ...rest);
    if (error) {
      return error;
    }
    const value = props[propName];
    if (value <= 0) {
      return new Error(
        `\`${propName}\` in \`${componentName}\` must be greater than zero.`
      );
    }
  }),

  /**
   * Check that the value is an Array of two unique values.
   */
  domain: makeChainable((props, propName, componentName, ...rest) => {
    const error = PropTypes.checkPropTypes({testProp: PropTypes.array}, props, propName, componentName, ...rest);
    if (error) {
      return error;
    }
    const value = props[propName];
    if (value.length !== 2 || value[1] === value[0]) {
      return new Error(
        `\`${propName}\` in \`${componentName}\` must be an array of two unique numeric values.`
      );
    }
  }),

  /**
   * Check that the value looks like a d3 `scale` function.
   */
  scale: makeChainable((props, propName, componentName) => {
    const supportedScaleStrings = ["linear", "time", "log", "sqrt"];
    const validScale = (scl) => {
      if (isFunction(scl)) {
        return (isFunction(scl.copy) && isFunction(scl.domain) && isFunction(scl.range));
      } else if (typeof scl === "string") {
        return supportedScaleStrings.indexOf(scl) !== -1;
      }
      return false;
    };

    const value = props[propName];
    if (!validScale(value)) {
      return new Error(
        `\`${propName}\` in \`${componentName}\` must be a d3 scale.`
      );
    }
  }),

  /**
   * Check that an array contains items of the same type.
   */
  homogeneousArray: makeChainable((props, propName, componentName, ...rest) => {
    const error = PropTypes.checkPropTypes({testProp: PropTypes.array}, props, propName, componentName, ...rest);
    if (error) {
      return error;
    }
    const value = props[propName];
    if (value.length > 1) {
      const constructor = getConstructor(value[0]);
      for (let i = 1; i < value.length; i++) {
        const otherConstructor = getConstructor(value[i]);
        if (constructor !== otherConstructor) {
          const constructorName = getConstructorName(value[0]);
          const otherConstructorName = getConstructorName(value[i]);
          return new Error(
            `Expected \`${propName}\` in \`${componentName}\` to be a ` +
            `homogeneous array, but found types \`${constructorName}\` and ` +
            `\`${otherConstructorName}\`.`
          );
        }
      }
    }
  }),

  /**
   * Check that array prop length matches props.data.length
   */
  matchDataLength: makeChainable((props, propName) => {
    if (
      props[propName] &&
      Array.isArray(props[propName]) &&
      props[propName].length !== props.data.length
    ) {
      return new Error(`Length of data and ${propName} arrays must match.`);
    }
  })
};
