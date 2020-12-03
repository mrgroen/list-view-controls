import { ChangeEvent, Component } from "react";

export interface XPathConstraintProps {
    isChecked: boolean;
    handleChange: (value: boolean) => void;
}

interface XPathConstraintState {
    isChecked: boolean;
}

export class XPathConstraint extends Component<XPathConstraintProps, XPathConstraintState> {
    constructor(props: XPathConstraintProps) {
        super(props);

        this.state = { isChecked : this.props.isChecked };
        this.handleOnChange = this.handleOnChange.bind(this);
    }

    render() {
        return null;
    }

    componentWillReceiveProps(newProps: XPathConstraintProps) {
        if (this.state.isChecked !== newProps.isChecked) {
            this.setState({ isChecked : newProps.isChecked });
        }
    }

    private handleOnChange(event: ChangeEvent<HTMLInputElement>) {
        this.setState({ isChecked: event.target.checked });
        this.props.handleChange(event.target.checked);
    }
}
