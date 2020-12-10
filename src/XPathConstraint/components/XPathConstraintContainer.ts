import { Component, ReactChild, ReactNode, createElement } from "react";
import * as classNames from "classnames";

import { Alert } from "../../Shared/components/Alert";
import { DataSourceHelper, DataSourceHelperListView } from "../../Shared/DataSourceHelper/DataSourceHelper";
import { SharedUtils, WrapperProps } from "../../Shared/SharedUtils";
import { Validate } from "../Validate";
import { SharedContainerUtils } from "../../Shared/SharedContainerUtils";
import { FormViewState } from "../../Shared/FormViewState";

export interface ContainerProps extends WrapperProps {
    listViewEntity: string;
    group: string;
    xpathConstraintAttribute: string;
}

export interface ContainerState {
    alertMessage: ReactChild;
    listViewAvailable: boolean;
    targetListView?: DataSourceHelperListView;
    validationPassed?: boolean;
    isChecked: boolean;
    xpathConstraintValue?: string;
}

interface FormState {
    isChecked: boolean;
}

export default class XPathConstraintContainer extends Component<ContainerProps, ContainerState> {
    private dataSourceHelper?: DataSourceHelper;
    private widgetDom: Element | null = null;
    private viewStateManager: FormViewState<FormState>;
    private retriesFind = 0;
    private subscriptionHandles: number[];

    constructor(props: ContainerProps) {
        super(props);

        this.subscriptionHandles = [];
        this.applyFilter = this.applyFilter.bind(this);
        this.subscriptionCallback = this.subscriptionCallback.bind(this);
        this.resetSubscriptions(this.props.mxObject);
        this.viewStateManager = new FormViewState(this.props.mxform, this.props.uniqueid, viewState => {
            viewState.isChecked = this.state.isChecked;
        });

        this.state = {
            xpathConstraintValue: "",
            isChecked: true,
            listViewAvailable: false,
            alertMessage: Validate.validateProps(this.props)
        };
    }

    render() {
        logger.debug(this.props.uniqueid, "render", this.props.group);

        return createElement("div", {
            className: classNames("widget-xpath-constraint", this.props.class),
            ref: widgetDom => this.widgetDom = widgetDom,
            style: SharedUtils.parseStyle(this.props.style)
        }, this.renderAlert());
    }

    componentWillReceiveProps(nextProps: ContainerProps) {
        logger.debug(this.props.uniqueid, "componentWillReceiveProps", this.props.group);
        this.resetSubscriptions(nextProps.mxObject);
        this.setState(this.updateState(nextProps.mxObject));
        if (this.state.listViewAvailable) {
            this.setState({ alertMessage: Validate.validateProps(nextProps) });
        }
    }

    componentWillMount(): void {
        logger.debug(this.props.uniqueid, "componentWillMount", this.props.group);
    }

    componentDidMount() {
        logger.debug(this.props.uniqueid, "componentDidMount", this.props.group);
        SharedUtils.delay(this.connectToListView.bind(this), this.checkListViewAvailable.bind(this), 20);
    }

    componentWillUpdate(): void {
        logger.debug(this.props.uniqueid, "componentWillUpdate", this.props.group);
    }

    componentDidUpdate(prevProps: ContainerProps, prevState: ContainerState) {
        logger.debug(this.props.uniqueid, "componentDidUpdate", this.props.group);
        if (this.state.listViewAvailable && !prevState.listViewAvailable) {
            const restoreState = this.checkRestoreState();
            if (this.props.mxObject) this.applyFilter(restoreState);
        } else if (this.state.listViewAvailable && this.props.mxObject !== prevProps.mxObject) {
            if (this.props.mxObject) this.applyFilter();
        }
    }

    componentWillUnmount() {
        logger.debug(this.props.uniqueid, "componentWillUnmount", this.props.group);
        this.subscriptionHandles.forEach(mx.data.unsubscribe);
        this.viewStateManager.destroy();
    }

    private updateState(mxObject = this.props.mxObject): ContainerState {
        logger.debug(this.props.uniqueid, "updateState - mxObject:" + mxObject.getGuid(), this.props.group);
        return {
            isChecked: this.state.isChecked,
            listViewAvailable: this.state.listViewAvailable,
            alertMessage: ""
        };
    }
/*
    private getAttributeValue(attribute: string, mxObject?: mendix.lib.MxObject): string {
        return (mxObject !== undefined ? mxObject.get(attribute) as string : "");
    }
*/
    private getXPathConstraint(): string {
        return this.props.mxObject ? this.props.mxObject.get(this.props.xpathConstraintAttribute).toString() : "";
    }

    private resetSubscriptions(mxObject?: mendix.lib.MxObject): void {
        logger.debug(this.props.uniqueid, "resetSubscriptions", this.props.group);
        this.subscriptionHandles.forEach(mx.data.unsubscribe);
        this.subscriptionHandles = [];

        if (mxObject) {
            this.subscriptionHandles.push(
                mx.data.subscribe({
                    guid: mxObject.getGuid(),
                    callback: this.subscriptionCallback
                })
            );
/*
            this.subscriptionHandles.push(
                mx.data.subscribe({
                    guid: mxObject.getGuid(),
                    attr: this.props.xpathConstraintAttribute.split(".").pop() as string,
                    callback: this.subscriptionCallback
                })
            );
*/
            this.subscriptionHandles.push(
                mx.data.subscribe({
                    guid: mxObject.getGuid(),
                    callback: this.handleValidations,
                    val: true
                })
            );
        }
    }

    private subscriptionCallback(guid: number, attr?: string, attrValue?: any): void {
        logger.debug(this.props.uniqueid, "subscriptionCallback - guid:" + guid + " attr:" + attr + " attrValue:" + attrValue, this.props.group);
        if (guid && attr && attrValue && attr === this.props.xpathConstraintAttribute) {
            logger.debug(this.props.uniqueid, "subscriptionCallback - xpathConstraintAttribute change detected, applyFilter()", this.props.group);
            this.setState(this.updateState());
            this.setState({ xpathConstraintValue: attrValue as string });
            this.applyFilter();
        } else if (guid) {
            this.setState(this.updateState());
            if (this.state.xpathConstraintValue !== this.getXPathConstraint()) {
                logger.debug(this.props.uniqueid, "subscriptionCallback - guid change detected with new xpathConstraintValue, applyFilter()", this.props.group);
                this.setState({ xpathConstraintValue: this.getXPathConstraint() });
                this.applyFilter();
            }
        }
    }

    private handleValidations(validations: mendix.lib.ObjectValidation[]): void {
        logger.debug(this.props.uniqueid, "handleValidations", this.props.group);
        const validationMessage = validations[0].getErrorReason(this.props.xpathConstraintAttribute);
        validations[0].removeAttribute(this.props.xpathConstraintAttribute);
        if (validationMessage) {
            this.setState({ alertMessage: validationMessage });
        }
    }

    private checkListViewAvailable(): boolean {
        logger.debug(this.props.uniqueid, "checkListViewAvailable", this.props.group);
        if (!this.widgetDom) {
            return false;
        }
        this.retriesFind++;
        if (this.retriesFind > 25) {
            return true; // Give-up searching
        }
        return !!SharedContainerUtils.findTargetListView(this.widgetDom.parentElement, this.props.listViewEntity);
    }

    private renderAlert(): ReactNode {
        logger.debug(this.props.uniqueid, "renderAlert", this.props.group);
        return createElement(Alert, {
            className: "widget-xpath-constraint-alert"
        }, this.state.alertMessage);
    }

    private applyFilter(restoreState = false) {
        logger.debug(this.props.uniqueid, "applyFilter", this.props.group);
        if (this.dataSourceHelper) {
            this.dataSourceHelper.setConstraint(this.props.uniqueid, this.getConstraint(), this.props.group, restoreState);
            this.setState({ isChecked: true });
        }
    }

    private getConstraint(): string | mendix.lib.dataSource.OfflineConstraint {
        logger.debug(this.props.uniqueid, "getConstraint", this.props.group);
        const { targetListView } = this.state;

        if (targetListView && targetListView._datasource) {
            const constraint = this.state.xpathConstraintValue ? this.state.xpathConstraintValue : this.getXPathConstraint();
            const mxObjectId = this.props.mxObject ? this.props.mxObject.getGuid() : "";
            const hasContext = constraint.indexOf(`'[%CurrentObject%]'`) !== -1;

            if (hasContext && mxObjectId) {
                return constraint.replace(/\[%CurrentObject%\]/g, mxObjectId);
            } else if (!hasContext) {
                return constraint;
            }

        }
        return "";
    }

    private connectToListView() {
        logger.debug(this.props.uniqueid, "connectToListView", this.props.group);
        let targetListView: DataSourceHelperListView | undefined;
        let errorMessage = "";

        try {
            this.dataSourceHelper = DataSourceHelper.getInstance(this.widgetDom, this.props.listViewEntity);
            targetListView = this.dataSourceHelper.getListView();
        } catch (error) {
            errorMessage = error.message;
        }

        if (errorMessage && targetListView) {
            DataSourceHelper.showContent(targetListView.domNode);
        }

        this.setState({
            alertMessage: errorMessage || Validate.validateProps(this.props),
            listViewAvailable: !!targetListView,
            targetListView
        });
    }

    private checkRestoreState(): boolean {
        logger.debug(this.props.uniqueid, "checkRestoreState", this.props.group);
        return this.viewStateManager.getPageState("isChecked") !== undefined;
    }

}
