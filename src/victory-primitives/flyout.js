import React from "react";
import PropTypes from "prop-types";

export default class Flyout extends React.Component {

  static propTypes = {
    style: PropTypes.object,
    x: PropTypes.number,
    y: PropTypes.number,
    dx: PropTypes.number,
    dy: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    orientation: PropTypes.oneOf(["top", "bottom", "left", "right"]),
    pointerLength: PropTypes.number,
    pointerWidth: PropTypes.number,
    cornerRadius: PropTypes.number,
    events: PropTypes.object
  };

  getVerticalPath(props) {
    const { pointerLength, pointerWidth, cornerRadius, orientation, width, height } = props;
    const sign = orientation === "top" ? 1 : -1;
    const x = props.x + (props.dx || 0);
    const y = props.y - sign * (props.dy || 0);
    const pointerEdge = y - (sign * pointerLength);
    const oppositeEdge = y - (sign * pointerLength) - (sign * height);
    const rightEdge = x + (width / 2);
    const leftEdge = x - (width / 2);
    const direction = orientation === "top" ? "0 0 0" : "0 0 1";
    const arc = `${cornerRadius} ${cornerRadius} ${direction}`;
    return `M ${x - pointerWidth / 2}, ${pointerEdge}
      L ${x}, ${y}
      L ${x + pointerWidth / 2}, ${pointerEdge}
      L ${rightEdge - cornerRadius}, ${pointerEdge}
      A ${arc} ${rightEdge}, ${pointerEdge - sign * cornerRadius}
      L ${rightEdge}, ${oppositeEdge + sign * cornerRadius}
      A ${arc} ${rightEdge - cornerRadius}, ${oppositeEdge}
      L ${leftEdge + cornerRadius}, ${oppositeEdge}
      A ${arc} ${leftEdge}, ${oppositeEdge + sign * cornerRadius}
      L ${leftEdge}, ${pointerEdge - sign * cornerRadius}
      A ${arc} ${leftEdge + cornerRadius}, ${pointerEdge}
      z`;
  }

  getHorizontalPath(props) {
    const { pointerLength, pointerWidth, cornerRadius, orientation, width, height } = props;
    const sign = orientation === "right" ? 1 : -1;
    const x = props.x + sign * (props.dx || 0);
    const y = props.y - (props.dy || 0);
    const pointerEdge = x + sign * pointerLength;
    const oppositeEdge = x + (sign * pointerLength) + (sign * width);
    const bottomEdge = y + height / 2;
    const topEdge = y - height / 2;
    const direction = orientation === "right" ? "0 0 0" : "0 0 1";
    const arc = `${cornerRadius} ${cornerRadius} ${direction}`;
    return `M ${pointerEdge}, ${y - pointerWidth / 2}
      L ${x}, ${y}
      L ${pointerEdge}, ${y + pointerWidth / 2}
      L ${pointerEdge}, ${bottomEdge - cornerRadius}
      A ${arc} ${pointerEdge + sign * cornerRadius}, ${bottomEdge}
      L ${oppositeEdge - sign * cornerRadius}, ${bottomEdge}
      A ${arc} ${oppositeEdge}, ${bottomEdge - cornerRadius}
      L ${oppositeEdge}, ${topEdge + cornerRadius}
      A ${arc} ${oppositeEdge - sign * cornerRadius}, ${topEdge}
      L ${pointerEdge + sign * cornerRadius}, ${topEdge}
      A ${arc} ${pointerEdge}, ${topEdge + cornerRadius}
      z`;
  }

  getFlyoutPath(props) {
    const orientation = props.orientation || "top";
    return orientation === "left" || orientation === "right" ?
      this.getHorizontalPath(props) : this.getVerticalPath(props);
  }

  renderFlyout(path, style, events) {
    return (
      <path d={path} style={style} {...events}/>
    );
  }

  render() {
    const path = this.getFlyoutPath(this.props);
    return this.renderFlyout(path, this.props.style, this.props.events);
  }
}
