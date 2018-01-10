import { Component, createElement } from "react";

import { SharedUtils } from "../Shared/SharedUtils";

import { HeaderSort } from "./components/HeaderSort";
import { ContainerProps } from "./components/HeaderSortContainer";

declare function require(name: string): string;

// tslint:disable-next-line class-name
export class preview extends Component<ContainerProps, {}> {
    constructor(props: ContainerProps) {
        super(props);

    }

    render() {
        return createElement("div", { className: "widget-header-sort" },
            createElement(HeaderSort, {
                caption: this.props.caption,
                onClickAction: () => { return; },
                sortAttributes: this.props.sortAttributes,
                sortOrder: this.props.sortOrder,
                style: SharedUtils.parseStyle(this.props.style)
            })
        );
    }
}

export function getPreviewCss() {
    return require("./ui/HeaderSort.scss");
}
