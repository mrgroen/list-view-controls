import { ReactChild, createElement } from "react";
import { ContainerProps } from "./components/XPathConstraintContainer";

export class Validate {
    static validateProps(props: ContainerProps & { isWebModeler?: boolean }): ReactChild {
        const errorMessages = [];

        if ((props.isWebModeler || !window.mx.isOffline()) && !props.xpathConstraintAttribute) {
            errorMessages.push("The 'XPath constraint' is required.");
        }
        if (!props.isWebModeler) {
            if (window.mx.isOffline()) {
                errorMessages.push("The 'XPath constraint' is not supported for offline application.");
            }
            if (!props.mxObject) {
                errorMessages.push("The 'XPath constraint' requires a context object.");
            }
        }

        if (errorMessages.length) {
            return createElement("div", {},
                "Configuration error in widget:",
                errorMessages.map((message, key) => createElement("p", { key }, message))
            );
        }

        return "";
    }
}
