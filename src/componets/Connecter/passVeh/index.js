import React, {Component} from 'react';
import PassVehSelect from "./passVehSelect";
import PassVehAll from "./passVehAll";

class PassVeh extends Component {

    render() {
        return (
            <div>
                <PassVehSelect/>
                <PassVehAll/>
            </div>
        );
    }
}

export default PassVeh;