import { Manager, Popper, Reference } from 'react-popper';
import React, { Fragment } from 'react';
import Transition, { ENTERED, ENTERING, EXITING } from 'react-transition-group/Transition';
import Button from '../Button/Button';
import FocusTrap from 'focus-trap-react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import TooltipIcon from './TooltipIcon';
import classNames from 'classnames';

const transitionDuration = 300;
const defaultTransitionStyle = {
  transition: `opacity ${transitionDuration}ms`,
  opacity: 0
};
const transitionStyles = {
  [ENTERING]: { opacity: 0 },
  [ENTERED]: { opacity: 1 },
  [EXITING]: { opacity: 0 }
};

const TOOLTIP_OFFSET_OPT = '5, 5, 5, 5';
const TOOLTIP_OFFSET = 5;

class Tooltip extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showTooltip: false,
      focusEventTriggered: false
    };
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleKeyDown(e) {
    if (this.props.hasInteractiveContent && this.state.showTooltip) {
      const ESCAPE_KEY = 27;
      switch (e.keyCode) {
        case ESCAPE_KEY:
          this.hideTooltip();
          break;
        default:
          break;
      }
    }
  }

  handleFocus() {
    this.setState({ showTooltip: true, focusEventTriggered: true });
  }

  hideTooltip() {
    this.setState({ showTooltip: false, focusEventTriggered: false });
  }

  showTooltip() {
    this.setState({ showTooltip: true });
  }

  renderTrigger() {
    const {
      ariaLabel,
      hasInteractiveContent,
      triggerIconClassName,
      id,
      inverse,
      triggerClassName,
      triggerContent
    } = this.props;
    return (
      <Reference>
        {({ ref }) => (
          <button
            id={id}
            type="button"
            onTouchStart={() => this.showTooltip()}
            onFocus={this.handleFocus}
            onBlur={hasInteractiveContent ? null : () => this.hideTooltip()}
            onMouseEnter={() => this.showTooltip()}
            onMouseLeave={() => this.hideTooltip()}
            aria-label={`Tooltip: ${ariaLabel || ''}`}
            className={classNames('ds-c-tooltip__trigger', triggerClassName)}
            ref={ref}
          >
            {triggerContent || (
              <TooltipIcon
                triggerIconClassName={triggerIconClassName}
                inverse={inverse}
                showTooltip={this.state.showTooltip}
              />
            )}
          </button>
        )}
      </Reference>
    );
  }

  renderContent() {
    const {
      children,
      id,
      inverse,
      hasInteractiveContent,
      positionFixed,
      placement,
      tooltipMaxWidth,
      tooltipZIndex,
      tooltipBodyClassName
    } = this.props;
    const bodyElement = document.querySelector('body');

    const interactiveContent = (arrowProps, arrowStyle) => (
      // Child of focus trap must be a single node and valid HTML element, no <Fragment>
      <FocusTrap>
        <div>
          <div className="ds-c-tooltip__arrow" ref={arrowProps.ref} style={arrowStyle} />
          <div className="ds-c-tooltip__content ds-base">
            {children}
            <div className="ds-u-justify-content--end ds-u-display--flex">
              <Button
                className="qa-tooltip-close-button"
                size="small"
                onClick={() => this.hideTooltip()}
              >
                Close
              </Button>
            </div>
          </div>
          <div
            style={{ left: arrowProps.style.left }}
            className="ds-c-tooltip__invisible-button"
            onTouchStart={() => this.hideTooltip()}
          />
        </div>
      </FocusTrap>
    );
    const nonInteractiveContent = (arrowProps, arrowStyle) => (
      <Fragment>
        <div className="ds-c-tooltip__arrow" ref={arrowProps.ref} style={arrowStyle} />
        <div className="ds-c-tooltip__content ds-base">{children}</div>
        <div
          style={{ left: arrowProps.style.left }}
          className="ds-c-tooltip__invisible-button"
          onTouchStart={() => this.hideTooltip()}
        />
      </Fragment>
    );
    return ReactDOM.createPortal(
      <Transition in={this.state.showTooltip} unmountOnExit timeout={transitionDuration}>
        {transitionState => (
          <Popper
            positionFixed={positionFixed}
            placement={placement}
            modifiers={{ offset: { offset: TOOLTIP_OFFSET_OPT } }}
          >
            {({ placement, ref, style, arrowProps }) => {
              // Need to add back 1/2 width of arrow to the left placement of the
              // tooltip container so the arrow shows up at exactly 50% as the
              // arrow container has a width/height we are setting that the
              // arrowProps positioning here does not account for
              let leftArrowOffset = 0;
              if (parseInt(arrowProps.style.left, 10)) {
                leftArrowOffset = arrowProps.style.left + 8;
              }
              const arrowStyle = { left: leftArrowOffset };

              // Can't directly modify style, so copy and add styles from props
              const newStyle = {
                ...style,
                ...defaultTransitionStyle,
                ...transitionStyles[transitionState],
                ...{ maxWidth: tooltipMaxWidth },
                ...{ zIndex: tooltipZIndex }
              };
              return (
                <div
                  ref={ref}
                  className={classNames('ds-c-tooltip__container', tooltipBodyClassName, {
                    'inverse-tooltip-body': inverse
                  })}
                  style={newStyle}
                  onMouseEnter={() => this.showTooltip()}
                  onMouseLeave={() => this.hideTooltip()}
                  modifiers={{ offset: TOOLTIP_OFFSET }}
                  data-placement={placement}
                  aria-labelledby={id}
                >
                  {hasInteractiveContent && this.state.focusEventTriggered
                    ? interactiveContent(arrowProps, arrowStyle)
                    : nonInteractiveContent(arrowProps, arrowStyle)}
                </div>
              );
            }}
          </Popper>
        )}
      </Transition>,
      bodyElement
    );
  }

  render() {
    const bodyElement = document.querySelector('body');
    return (
      <Manager>
        {this.renderTrigger()}
        {bodyElement !== null && this.renderContent()}
      </Manager>
    );
  }
}

Tooltip.defaultProps = {
  placement: 'top',
  positionFixed: false,
  tooltipMaxWidth: '300px',
  tooltipZIndex: '1'
};
Tooltip.propTypes = {
  /**
   * Helpful description of the tooltip for screenreaders
   */
  ariaLabel: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  /**
   * Should be set to `true` if tooltip content includes tabbable elements like links or buttons. Interactive tooltips have a focus trap, close button, and other accessibility changes to account for interactive elements.
   */
  hasInteractiveContent: PropTypes.bool,
  /**
   * Set prop to `true` to use `position: fixed` strategy to place the popper element. By default it is `false`, meaning it will use `position: absolute`
   */
  positionFixed: PropTypes.bool,
  /**
   * Placement of the tooltip relative to the trigger
   */
  placement: PropTypes.oneOf(['top', 'bottom']),
  inverse: PropTypes.bool,
  /**
   * Id applied to the trigger element, used in  `aria-labelledby`
   */
  id: PropTypes.string.isRequired,
  /**
   * Classes applied to the tooltip body
   */
  tooltipBodyClassName: PropTypes.string,
  /**
   * Optional custom trigger node. This replaces the default trigger icon.
   */
  triggerContent: PropTypes.node,
  /**
   * Classes applied to the tooltip trigger
   */
  triggerClassName: PropTypes.string,
  /**
   * Classes applied to the default tooltip trigger icon, can be used to override icon fill color
   */
  triggerIconClassName: PropTypes.string,
  tooltipMaxWidth: PropTypes.string,
  tooltipZIndex: PropTypes.string
};

export default Tooltip;