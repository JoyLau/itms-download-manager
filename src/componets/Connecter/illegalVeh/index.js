import React, {Component} from 'react';
import IllegalVehSelect from "./illegalVehSelect";
import IllegalVehAll from "./illegalVehAll";

class IllegalVeh extends Component {

    render() {
        return (
            <div>
                <IllegalVehSelect/>
                <IllegalVehAll/>
            </div>
        );
    }
}

export default IllegalVeh;