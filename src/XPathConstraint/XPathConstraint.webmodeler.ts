import { Component, createElement } from "react";
import * as classNames from "classnames";

import { Alert } from "../Shared/components/Alert";
import { SharedUtils } from "../Shared/SharedUtils";
import { Validate } from "./Validate";
import { ContainerProps } from "./components/XPathConstraintContainer";

// tslint:disable-next-line class-name
export class preview extends Component<ContainerProps, {}> {
    constructor(props: ContainerProps) {
        super(props);
    }

    render() {
        return createElement("div", { ref: this.parentInline },
            createElement("div",
                {
                    className: classNames("widget-xpath-constraint", this.props.class),
                    style: SharedUtils.parseStyle(this.props.style)
                },
                this.renderAlert()
            )
        );
    }

    private parentInline(node?: HTMLElement | null) {
        // Temporary fix, the web modeler add a containing div, to render inline we need to change it.
        if (node && node.parentElement) {
            node.parentElement.style.display = "inline-block";
        }
    }

    private renderAlert() {
        return createElement(Alert, {
            className: "widget-xpath-constraint-alert"
        }, Validate.validateProps({ ...this.props as ContainerProps, isWebModeler: true }));
    }
}

export function getVisibleProperties(valueMap: ContainerProps, visibilityMap: any) {
    visibilityMap.constraint = !valueMap.xpathConstraintAttribute;

    return visibilityMap;
}
